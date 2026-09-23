import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRepoContext } from "./github";
import type { LLMProvider } from "./index";

// ---------------------------------------------------------------------------
// Single-repo analysis used by both the CLI runner (run.ts) and the
// Phase 7 webhook handler (apps/api). Keeps one code path so behavior
// (never auto-publish, drafts always need review) is identical everywhere.
// ---------------------------------------------------------------------------

export interface RepoRow {
  repo_id: string;
  full_name: string;
  default_branch: string | null;
  last_seen_sha: string | null;
}

export type AnalyzeStatus = "created" | "skipped" | "failed";

export interface AnalyzeResult {
  status: AnalyzeStatus;
  draftId?: string;
  confidence?: string;
  error?: string;
}

interface DraftRow {
  payload: { sha?: string } | null;
}

export async function analyzeSingleRepo(opts: {
  supabase: SupabaseClient;
  provider: LLMProvider;
  githubToken?: string;
  repo: RepoRow;
}): Promise<AnalyzeResult> {
  const { supabase, provider, githubToken, repo } = opts;
  const sha = repo.last_seen_sha ?? "";

  // Skip if a draft already exists for this repo + SHA.
  const { data: drafts, error: draftError } = await supabase
    .from("ai_project_drafts")
    .select("payload")
    .eq("github_repo_id", repo.repo_id);
  if (draftError) {
    return { status: "failed", error: `Could not read drafts: ${draftError.message}` };
  }
  const already = ((drafts ?? []) as DraftRow[]).some(
    (d) => (d.payload?.sha ?? "") === sha
  );
  if (already) {
    return { status: "skipped" };
  }

  const [owner, name] = repo.full_name.split("/");
  let context;
  try {
    context = await fetchRepoContext(owner, name, githubToken);
  } catch (err) {
    return { status: "failed", error: `context fetch failed: ${err instanceof Error ? err.message : err}` };
  }

  try {
    const analysis = await provider.analyzeRepository(context);
    const payload = {
      ...analysis,
      sha,
      analyzed_at: new Date().toISOString(),
      provider: provider.name,
    };
    const { data: inserted, error: insertError } = await supabase
      .from("ai_project_drafts")
      .insert({
        github_repo_id: repo.repo_id,
        payload,
        needs_review: true,
        reviewed: false,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    await supabase.from("sync_logs").insert({
      kind: "ai_analysis",
      status: "ok",
      message: `Analyzed ${repo.full_name} → draft created (confidence: ${analysis.confidence}).`,
      details: { repo: repo.full_name, sha, draft_id: inserted.id },
    });
    return { status: "created", draftId: inserted.id, confidence: analysis.confidence };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("sync_logs").insert({
      kind: "ai_analysis",
      status: "error",
      message: `Failed to analyze ${repo.full_name}: ${msg}`,
      details: { repo: repo.full_name },
    });
    return { status: "failed", error: msg };
  }
}
