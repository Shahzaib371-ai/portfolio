# GitHub Actions (Phase 8)

Three workflows run the portfolio's CI and automation. All of them use
least-privilege `permissions: contents: read` — no workflow can push code.

## Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | push to `main`, pull requests | `npm ci` → typecheck all workspaces → unit tests → `next build` of the web app. The build is a gate: if it fails, Phase 9 deploy must not run. |
| `sync.yml` | daily 02:00 UTC (07:00 PKT), or manual | Runs the Phase 5 GitHub sync (`@portfolio/github-sync`) so `github_repositories` stays fresh even for repos without the Phase 7 webhook. Idempotent — metadata only, never publishes. |
| `analyze.yml` | manual only (Actions tab → Run workflow) | Runs the Phase 6 AI analysis (`@portfolio/ai-agent`) into review drafts (`needs_review=true`, never auto-publishes). **Defaults to dry-run** so an accidental click writes nothing. Optional `repo` input limits the run to one `owner/name`. |

## Required secrets

Add these once at **Settings → Secrets and variables → Actions** (repository
secrets). Values live only in GitHub — never commit them.

| Secret | Used by | Where to get it |
|---|---|---|
| `SUPABASE_URL` | sync, analyze | Supabase dashboard → project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | sync, analyze | Supabase dashboard → API keys (service_role — keep private!) |
| `GEMINI_API_KEY` | analyze | Google AI Studio / Cloud Console |
| `PORTFOLIO_GITHUB_TOKEN` | sync, analyze (optional) | Fine-grained PAT, **Contents: Read-only**, repository access: your repos |

Without `PORTFOLIO_GITHUB_TOKEN` the jobs still work for public repos at
GitHub's unauthenticated rate limit — same rule as the local CLI.

## Manual runs

- **Sync now:** Actions → "Nightly GitHub sync" → Run workflow.
- **Analyze now:** Actions → "AI project analysis" → Run workflow → uncheck
  `dry_run` only when you really want drafts written (dry-run is the default).

## Local equivalents

```bash
npm run typecheck --workspaces --if-present   # what ci.yml typechecks
npm run test --workspaces --if-present        # what ci.yml tests
npm run build --workspace=@portfolio/web      # what ci.yml builds

# sync / analyze need the secrets as env vars (see .env.example)
npm run sync --workspace=@portfolio/github-sync
DRY_RUN=1 npm run analyze --workspace=@portfolio/ai-agent
```
