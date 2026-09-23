# Deployment (Phase 9)

The portfolio is split across two hosts — the static frontend on GitHub Pages,
the API on Vercel serverless. No secrets ever ship in the frontend bundle.

## Live URLs

| Service | URL |
|---|---|
| Website | https://shahzaib371-ai.github.io/portfolio/ |
| API | `https://<project>.vercel.app` (set at deploy time, see below) |
| API health | `https://<project>.vercel.app/health` |
| Webhook | `https://<project>.vercel.app/api/webhooks/github` |

## 1. Website → GitHub Pages (automatic)

`.github/workflows/deploy-web.yml` builds the static export (`apps/web/out`)
with `NEXT_BASE_PATH=/portfolio` and pushes it to the `gh-pages` branch on
every push to `main` that touches `apps/web/`.

One-time setup (repo Settings → Pages): set **Source** to the `gh-pages`
branch. The first deploy creates the branch.

To redeploy: just push to `main`. To deploy manually: Actions → "Deploy web to
GitHub Pages" → Run workflow (add `workflow_dispatch` if you want the button).

## 2. API → Vercel (one-time setup, then auto-deploys)

The API is a Hono app served as a single Vercel serverless function
(`apps/api/api/index.ts`). Vercel's `waitUntil` is wired into Hono's execution
context, so webhook background work (sync → AI analysis → draft) survives the
202 response.

**Create the project** (Vercel dashboard → Add New → Project → import
`Shahzaib371-ai/portfolio`):

- Framework Preset: **Other**
- Root Directory: **`apps/api`**
- Build Command: **`npm run build --workspace=@portfolio/api`**
  (compiles the `@portfolio/github-sync` and `@portfolio/ai-agent` workspace
  packages to `dist/` — Vercel's Node runtime cannot load their `.ts` source
  from `node_modules`, so the API imports the built JS)
- Output Directory: *(leave empty)*

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Value source |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → API keys (service_role) |
| `GITHUB_WEBHOOK_SECRET` | root `.env` (generated in Phase 7) |
| `GEMINI_API_KEY` | Google AI Studio / Cloud Console |
| `GEMINI_MODEL` | `gemini-3.8-flash` |
| `GITHUB_TOKEN` | optional read-only PAT (public repos work without it) |
| `GITHUB_USERNAME` | `Shahzaib371-ai` |

Deploy. Every later push to `main` redeploys automatically.

**Verify:** `curl https://<project>.vercel.app/health` → `{"ok":true,…}`.

## 3. Register the GitHub webhooks

For each repo (Settings → Webhooks → Add webhook):

- Payload URL: `https://<project>.vercel.app/api/webhooks/github`
- Content type: `application/json`
- Secret: the `GITHUB_WEBHOOK_SECRET` value
- Events: **Let me select individual events → Pushes** only

Send a test **Ping** → expect `200 {"msg":"pong"}`. Then push a real commit to
the default branch → the API returns `202` immediately, and a `sync_logs` row
with `kind="webhook"` plus (for new SHAs) an `ai_project_drafts` review draft
appear in Supabase.

## 4. Frontend ↔ API wiring

The public site is fully static today and calls no API. When the admin
dashboard or visitor chat starts calling the API, set the repository variable
**Settings → Secrets and variables → Actions → Variables**:
`NEXT_PUBLIC_API_URL=https://<project>.vercel.app` and reference it in
`deploy-web.yml` — the value is baked in at build time.

## Rollback

- Website: redeploy any older commit, or revert the `gh-pages` branch in the
  repo's Pages settings history.
- API: Vercel dashboard → Deployments → promote any previous deployment.

## Costs

GitHub Pages: free. Vercel Hobby: free (serverless functions, `maxDuration`
60s on the webhook function). Supabase: free tier. All within free limits for
this project's traffic.
