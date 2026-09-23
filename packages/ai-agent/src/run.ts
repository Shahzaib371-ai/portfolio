import { createClient } from "@supabase/supabase-js";
import { fetchRepoContext } from "./github";
import { GeminiProvider } from "./gemini";
import { analyzeSingleRepo, type RepoRow } from "./analyzeRepo";

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

async function main() {
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

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const provider = new GeminiProvider(GEMINI_API_KEY!);

  const { data: repos, error: repoError } = await supabase
    .from("github_repositories")
    .select("repo_id,full_name,default_branch,last_seen_sha")
    .order("full_name", { ascending: true });
  if (repoError) throw new Error(`Could not read repos: ${repoError.message}`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const repo of (repos ?? []) as RepoRow[]) {
    console.log(`- ${repo.full_name}: checking…`);

    if (DRY_RUN) {
      // Fetch contexts only — no LLM calls, no draft writes.
      try {
        const [owner, name] = repo.full_name.split("/");
        const context = await fetchRepoContext(owner, name, GITHUB_TOKEN);
        console.log(
          `  DRY_RUN context: readme=${context.readme ? context.readme.length : 0} chars, ` +
            `langs=[${context.languages.join(",")}], files=${context.fileTree.length}, ` +
            `keyFiles=${Object.keys(context.keyFiles).length}`
        );
      } catch (err) {
        failed += 1;
        console.error(`  ! fetch failed: ${err instanceof Error ? err.message : err}`);
      }
      continue;
    }

    const result = await analyzeSingleRepo({ supabase, provider, githubToken: GITHUB_TOKEN, repo });
    if (result.status === "created") {
      created += 1;
      console.log(`  draft created (confidence: ${result.confidence}).`);
    } else if (result.status === "skipped") {
      skipped += 1;
      console.log(`  already analyzed for this SHA, skipping.`);
    } else {
      failed += 1;
      console.error(`  ! analysis failed: ${result.error}`);
    }
  }

  console.log(`\nDone: ${created} drafts created, ${skipped} skipped, ${failed} failed.`);
}

// Only run the CLI when this file is executed directly — the webhook
// handler imports the reusable functions above without side effects.
import { pathToFileURL } from "node:url";
const isMainModule =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((err) => {
    console.error("Run failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
