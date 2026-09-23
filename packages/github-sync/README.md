# @portfolio/github-sync — Phase 5

Syncs the owner's GitHub repositories into the Supabase `github_repositories`
table. This table is the **detection source of truth**: Phase 6 (AI agent)
reads it to decide which repos need analysis, and Phase 7 webhooks update it
on every push.

## Run manually

```bash
GITHUB_TOKEN=ghp_... \
GITHUB_USERNAME=Shahzaib371-ai \
SUPABASE_URL=https://xyz.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run sync --workspace=@portfolio/github-sync
```

(The repo root `.env` already has `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`;
only `GITHUB_TOKEN` and `GITHUB_USERNAME` need to be supplied.)

## Token permissions (least privilege)

A fine-grained personal access token with, on the selected repositories:

- **Contents: Read-only**
- **Metadata: Read-only**

Nothing is ever written to GitHub. The token lives in env vars / CI
secrets — never in frontend code.

## What it does

1. Lists all non-fork repos owned by `GITHUB_USERNAME` (`/user/repos`).
2. Reads each repo's default-branch HEAD SHA.
3. Upserts every repo into `github_repositories` (`repo_id`, `full_name`,
   `default_branch`, `last_seen_sha`, `last_synced_at`).
4. Counts **new** repos and repos whose SHA **changed** since last sync.
5. Appends a summary row to `sync_logs` (`kind = 'sync'`).

## Automation

Phase 8 adds a scheduled GitHub Actions workflow that runs this with a
`GH_SYNC_TOKEN` repository secret.
