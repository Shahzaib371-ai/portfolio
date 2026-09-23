# ARCHITECTURE.md — Portfolio System Design

## 1. Overview

A modular, AI-automated developer portfolio for **Shahzaib Hasnain**
(Computer Engineering: Embedded Systems, IoT, ML, Computer Vision, Robotics).

The system is split because **GitHub Pages can only serve static files**.
Anything needing secrets, a database, auth, or webhooks lives in a separate
secure backend. The two halves communicate over HTTPS with a typed API client.

```
┌─────────────────────────┐         ┌──────────────────────────┐
│ apps/web (Next.js)      │         │ apps/api (Hono, Node)    │
│ static export           │ HTTPS   │ Vercel serverless        │
│ GitHub Pages            │◄───────►│ - admin CRUD             │
│ - public portfolio      │  JSON   │ - GitHub webhook         │
│ - /admin dashboard SPA  │         │ - AI analysis agent      │
│ - visitor chat widget   │         │ - visitor AI assistant   │
└─────────────────────────┘         └────────────┬─────────────┘
                                                 │ Drizzle ORM
                                      ┌──────────▼──────────┐
                                      │ Supabase Postgres   │
                                      │ + Supabase Auth     │
                                      └─────────────────────┘
```

## 2. Frontend (`apps/web`)

- Next.js 14 App Router, TypeScript, Tailwind CSS.
- `output: 'export'` → fully static HTML/CSS/JS → GitHub Pages via Actions.
- **No secrets in the bundle.** Only `NEXT_PUBLIC_API_URL` is public.
- Public pages: home (hero, featured projects, skills, experience, education,
  GitHub activity, contact), `/projects`, `/projects/[slug]`, resume, sitemap,
  robots.txt, OG metadata.
- `/admin` is a client-side SPA: it calls the backend API with the admin's
  Supabase Auth JWT. Works fine as static hosting because all logic is API-side.
- Content (hero text, tagline, about) is editable via admin → stored in the
  `settings` table → baked into the static build.
- **Decided hero subtitle:** `Computer Engineering Student | Embedded Systems | IoT | Machine Learning | Robotics`

## 3. Backend (`apps/api`)

Hono app deployed to Vercel serverless functions. Responsibilities:

| Area | Endpoints (planned) |
|---|---|
| Admin CRUD | `GET/POST/PATCH/DELETE /api/admin/projects`, `/skills`, `/experience`, `/education`, `/certifications`, `/settings`, `/social-links` |
| GitHub sync | `POST /api/admin/sync` (manual), `POST /api/webhooks/github` (auto) |
| AI analysis | `POST /api/admin/analyze/:repo` → draft in `ai_project_drafts` |
| Drafts | `GET /api/admin/drafts`, `POST /api/admin/drafts/:id/approve` |
| Visitor chat | `POST /api/chat` (rate-limited, DB-grounded answers only) |
| Health | `GET /health` |

- Auth: Supabase Auth JWT verified on every `/api/admin/*` route.
- Validation: Zod schemas on all inputs.
- Rate limiting on `/api/chat` and `/api/webhooks/github`.
- Webhook signature verification with `GITHUB_WEBHOOK_SECRET` (HMAC-SHA256).

## 4. Database (`packages/db`)

Supabase Postgres, Drizzle ORM, migrations in `packages/db/migrations`.

Tables: `users` (admin), `projects`, `skills`, `experience`, `education`,
`certifications`, `settings` (key/value site content), `social_links`,
`github_repositories` (sync state per repo), `ai_project_drafts` (pending AI
output), `sync_logs` (every sync/AI run, success or failure — never silent).

Safety fields on `projects`: `aiGenerated` (bool), `manuallyEdited` (bool),
`lastSyncedAt` (timestamp), `githubRepoId`, `status` (`draft|published|hidden`),
`featured`, `sortOrder`. The AI updater only touches fields where
`manuallyEdited = false`.

## 5. GitHub integration

- **Least privilege:** fine-grained PAT with Contents=Read-only and
  Metadata=Read-only, scoped to selected repos. (A GitHub App is the
  later upgrade path.)
- **Manual:** admin "Sync GitHub" button → lists repos → creates/updates drafts.
- **Automatic:** repo webhook (`push` events) → `POST /api/webhooks/github`
  → signature verified → AI re-analyzes → draft updated → admin notified
  in dashboard → approve → publish.
- On publish/approve, the backend fires a `repository_dispatch` to trigger a
  GitHub Pages rebuild so the static site picks up DB changes.

## 6. AI project-analysis agent (`packages/ai-agent`)

Provider-independent by design:

```ts
interface LLMProvider {
  readonly name: string;
  analyzeRepository(repo: RepoContext): Promise<ProjectAnalysis>;
}
```

- `RepoContext`: name, description, README, languages, `package.json` /
  `requirements.txt` / configs, file tree (truncated, allow-listed extensions).
- First implementation: `OpenAICompatibleProvider` (works with OpenAI,
  DeepSeek, Gemini via OpenAI-compatible endpoints).
- Output is **always** validated against a Zod schema (`ProjectAnalysis`).
  Invalid output → logged to `sync_logs`, draft marked `needsReview`.
- **Hard rule:** the agent must never invent features/technologies. Anything
  unverifiable → empty / `needsReview: true`.
- The system prompt is versioned in code so agent behavior is reviewable.

## 7. Human approval workflow

```
detected → AI draft (status=draft, needsReview) → admin reviews in /admin
→ approve → status=published → rebuild triggered → live
```

Optional `settings.autoPublishTrustedRepos` enables auto-publish later.
Manual edits set `manuallyEdited=true` and are never overwritten.

## 8. GitHub Actions (`.github/workflows/`)

- `ci.yml` — install, typecheck, (Phase 8+: lint, test, build). PRs blocked on failure.
- `deploy-web.yml` (Phase 9) — static export → GitHub Pages. Triggered on push
  to `main` and on `repository_dispatch` from the backend.
- Backend deploys via Vercel's GitHub integration.
- Production build failure = deployment failure, always.

## 9. Authentication & security

- Admin: Supabase Auth (email/password, single admin user). JWT verified
  server-side on every admin route; RLS on tables as defense-in-depth.
- Secrets only in backend env vars / Vercel / Supabase. `.env.example`
  documents placeholders; real `.env` never committed.
- Webhook HMAC verification, Zod input validation, rate limits on public
  endpoints, structured error logging, no stack traces to clients.

## 10. Visitor AI assistant

Floating chat widget (frontend) → `POST /api/chat` (backend). The backend
loads projects/skills/experience from the DB into the prompt with a strict
system instruction: **answer only from portfolio data; if unknown, say so.**
Rate-limited per IP. No browsing, no invention.

## 11. Performance & SEO

Static export = fast by default. Images via `next/image` with `unoptimized`
(static export requirement) + lazy loading. Per-page metadata, sitemap,
robots.txt, OG tags, favicon — all editable via `settings`.
