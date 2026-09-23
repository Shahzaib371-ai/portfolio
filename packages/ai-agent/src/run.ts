import { createClient } from "@supabase/supabase-js";
import { fetchRepoContext } from "./github";
import { GeminiProvider } from "./gemini";

// ---------------------------------------------------------------------------
// Phase 6 runner: analyze GitHub repos into review drafts.
//
// For every repo in `github_repositories` that has no draft for its current
// default-branch SHA, this fetches the repo context, asks the LLM provider
// for a structured analysis, validates it with Zod, and inserts it into
// `ai_project_drafts` with needs_review=true. NOTHING is published — the
// admin approves drafts in the dashboard.
//
// Usage:
//   GEMINI_API_KEY=... GITHUB_TOKEN=... SUPABASE_URL=... \
//   SUPABASE_SERVICE_ROLE_KEY=... npm run analyze
//
//   DRY_RUN=1 npm run analyze   # fetch contexts only, no LLM calls or writes
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // optional; public repos work without it
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "1";

for (const [name, value] of [
  ["GEMINI_API_KEY", GEMINI_API_KEY],
  ["SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY],
] as const) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}
if (!GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN not set — using unauthenticated GitHub API (rate-limited, public repos only).");
}

interface DraftRow {
  github_repo_id: string | null;
  payload: { sha?: string } | null;
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const provider = new GeminiProvider(GEMINI_API_KEY!);

  const { data: repos, error: repoError } = await supabase
    .from("github_repositories")
    .select("repo_id,full_name,default_branch,last_seen_sha")
    .order("full_name", { ascending: true });
  if (repoError) throw new Error(`Could not read repos: ${repoError.message}`);

  const { data: drafts, error: draftError } = await supabase
    .from("ai_project_drafts")
    .select("github_repo_id,payload");
  if (draftError) throw new Error(`Could not read drafts: ${draftError.message}`);

  const analyzed = new Set(
    ((drafts ?? []) as DraftRow[]).map((d) => `${d.github_repo_id}:${d.payload?.sha ?? ""}`)
  );

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const repo of repos ?? []) {
    const key = `${repo.repo_id}:${repo.last_seen_sha ?? ""}`;
    if (analyzed.has(key)) {
      console.log(`- ${repo.full_name}: already analyzed for this SHA, skipping.`);
      skipped += 1;
      continue;
    }

    const [owner, name] = (repo.full_name as string).split("/");
    console.log(`- ${repo.full_name}: fetching context…`);
    let context;
    try {
      context = await fetchRepoContext(owner, name, GITHUB_TOKEN);
    } catch (err) {
      failed += 1;
      console.error(`  ! fetch failed: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    console.log(
      `  context: readme=${context.readme ? context.readme.length : 0} chars, ` +
        `langs=[${context.languages.join(",")}], files=${context.fileTree.length}, ` +
        `keyFiles=${Object.keys(context.keyFiles).length}`
    );

    if (DRY_RUN) {
      console.log("  DRY_RUN: skipping LLM call and draft insert.");
      continue;
    }

    try {
      const analysis = await provider.analyzeRepository(context);
      const payload = {
        ...analysis,
        sha: repo.last_seen_sha,
        analyzed_at: new Date().toISOString(),
        provider: provider.name,
      };
      const { data: inserted, error: insertError } = await supabase
        .from("ai_project_drafts")
        .insert({
          github_repo_id: String(repo.repo_id),
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
        details: { repo: repo.full_name, sha: repo.last_seen_sha, draft_id: inserted.id },
      });
      created += 1;
      console.log(`  draft created (confidence: ${analysis.confidence}).`);
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ! analysis failed: ${msg}`);
      await supabase.from("sync_logs").insert({
        kind: "ai_analysis",
        status: "error",
        message: `Failed to analyze ${repo.full_name}: ${msg}`,
        details: { repo: repo.full_name },
      });
    }
  }

  console.log(`\nDone: ${created} drafts created, ${skipped} skipped, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Run failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
