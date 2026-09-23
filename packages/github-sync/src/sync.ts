// ---------------------------------------------------------------------------
// Phase 5: GitHub → Supabase sync.
//
// Lists the owner's repositories via the GitHub REST API and upserts them
// into the `github_repositories` table (the detection source of truth).
// Detects new repos and repos whose default-branch SHA changed since the
// last sync, and appends a summary row to `sync_logs`.
//
// Phase 6 (AI agent) reads this table to decide what needs analysis.
// Phase 7 (webhooks) calls `syncSingleRepo` for the repo named in a push
// event so detection + analysis happen within seconds of a push.
// Phase 8 will run the full sync on a schedule in GitHub Actions.
//
// Usage:
//   GITHUB_TOKEN=... GITHUB_USERNAME=Shahzaib371-ai \
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run sync
//
// The token needs only Contents=Read-only + Metadata=Read-only (least
// privilege). It lives in env / CI secrets — never in frontend code.
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface GhRepo {
  id: number;
  full_name: string;
  default_branch: string;
  fork: boolean;
}

interface SingleRepoSyncResult {
  repo_id: string;
  full_name: string;
  default_branch: string;
  last_seen_sha: string | null;
  isNew: boolean;
  shaChanged: boolean;
}

function gh(token: string | undefined) {
  return async (path: string): Promise<unknown> => {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status} on ${path}: ${body.slice(0, 200)}`);
    }
    return res.json();
  };
}

/**
 * Sync ONE repo (by full_name) into `github_repositories`.
 * Used by the Phase 7 webhook handler on push events.
 */
export async function syncSingleRepo(
  supabase: SupabaseClient,
  githubToken: string | undefined,
  fullName: string
): Promise<SingleRepoSyncResult> {
  const call = gh(githubToken);
  const repo = (await call(`/repos/${fullName}`)) as GhRepo;

  let sha: string | null = null;
  try {
    const data = (await call(
      `/repos/${fullName}/branches/${repo.default_branch}`
    )) as { commit: { sha: string } };
    sha = data.commit.sha;
  } catch (err) {
    console.warn(`  ! could not read default branch of ${fullName}: ${err}`);
  }

  const { data: existing, error: readError } = await supabase
    .from("github_repositories")
    .select("repo_id,last_seen_sha")
    .eq("repo_id", String(repo.id))
    .maybeSingle();
  if (readError) throw new Error(`Supabase read failed: ${readError.message}`);

  const isNew = !existing;
  const shaChanged = !isNew && sha !== null && existing.last_seen_sha !== sha;
  const now = new Date().toISOString();

  const { error: upsertError } = await supabase.from("github_repositories").upsert(
    {
      repo_id: String(repo.id),
      full_name: repo.full_name,
      default_branch: repo.default_branch,
      last_seen_sha: sha,
      last_synced_at: now,
      updated_at: now,
    },
    { onConflict: "repo_id" }
  );
  if (upsertError) throw new Error(`Supabase upsert failed for ${fullName}: ${upsertError.message}`);

  return {
    repo_id: String(repo.id),
    full_name: repo.full_name,
    default_branch: repo.default_branch,
    last_seen_sha: sha,
    isNew,
    shaChanged,
  };
}

async function listRepos(token: string | undefined): Promise<GhRepo[]> {
  const call = gh(token);
  const repos: GhRepo[] = [];
  let page = 1;
  for (;;) {
    const batch = (await call(
      `/user/repos?per_page=100&page=${page}&type=owner&sort=pushed`
    )) as GhRepo[];
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return repos;
}

async function defaultBranchSha(
  token: string | undefined,
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const data = (await gh(token)(`/repos/${owner}/${repo}/branches/${branch}`)) as {
    commit: { sha: string };
  };
  return data.commit.sha;
}

async function main() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (const [name, value] of [
    ["GITHUB_TOKEN", GITHUB_TOKEN],
    ["GITHUB_USERNAME", GITHUB_USERNAME],
    ["SUPABASE_URL", SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY],
  ] as const) {
    if (!value) {
      console.error(`Missing required env var: ${name}`);
      process.exit(1);
    }
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  const repos = (await listRepos(GITHUB_TOKEN!)).filter((r) => !r.fork);
  console.log(`Found ${repos.length} non-fork repos for ${GITHUB_USERNAME}.`);

  const { data: existing, error: readError } = await supabase
    .from("github_repositories")
    .select("repo_id,last_seen_sha");
  if (readError) throw new Error(`Supabase read failed: ${readError.message}`);
  const known = new Map((existing ?? []).map((r) => [r.repo_id as string, r.last_seen_sha as string | null]));

  const now = new Date().toISOString();
  let added = 0;
  let changed = 0;
  const changedNames: string[] = [];

  for (const repo of repos) {
    const [owner, name] = repo.full_name.split("/");
    let sha: string | null = null;
    try {
      sha = await defaultBranchSha(GITHUB_TOKEN!, owner, name, repo.default_branch);
    } catch (err) {
      console.warn(`  ! could not read default branch of ${repo.full_name}: ${err}`);
    }
    const prev = known.get(String(repo.id));
    const isNew = prev === undefined;
    const isChanged = !isNew && sha !== null && prev !== sha;
    if (isNew) added += 1;
    if (isChanged) {
      changed += 1;
      changedNames.push(repo.full_name);
    }

    const { error } = await supabase.from("github_repositories").upsert(
      {
        repo_id: String(repo.id),
        full_name: repo.full_name,
        default_branch: repo.default_branch,
        last_seen_sha: sha,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: "repo_id" }
    );
    if (error) throw new Error(`Supabase upsert failed for ${repo.full_name}: ${error.message}`);
  }

  const message = `Synced ${repos.length} repos: ${added} new, ${changed} changed.`;
  const { error: logError } = await supabase.from("sync_logs").insert({
    kind: "sync",
    status: "ok",
    message,
    details: { total: repos.length, added, changed, changed_repos: changedNames },
  });
  if (logError) console.warn(`Could not write sync log: ${logError.message}`);

  console.log(message);
}

// Only run the CLI when this file is executed directly — the webhook
// handler imports the reusable functions above without side effects.
import { pathToFileURL } from "node:url";
const isMainModule =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((err) => {
    console.error("Sync failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
