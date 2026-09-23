# Shahzaib Hasnain — AI-Powered Developer Portfolio

A production-ready, automated portfolio system for a Computer Engineering
student/developer focused on **Embedded Systems, IoT, Machine Learning,
Computer Vision, and Robotics**.

## What this is

Not a static template — a system:

- **Frontend** (`apps/web`): Next.js static export, deployed to **GitHub Pages**
- **Backend** (`apps/api`): Hono API on **Vercel** — admin CRUD, GitHub webhooks,
  AI project-analysis agent, visitor AI assistant
- **Database** (`packages/db`): Supabase Postgres via Drizzle ORM
- **AI agent** (`packages/ai-agent`): provider-independent repo analyzer with
  validated, structured JSON output — never invents data

## How automation works

```
New GitHub repo → webhook → API → AI analyzes README/code → draft in DB
→ admin approves → site rebuilds → live on GitHub Pages
```

AI drafts always need human approval before publishing (auto-publish is an
opt-in setting). Manually edited fields are never overwritten by the AI.

## Docs

- `ARCHITECTURE.md` — full system design
- `SETUP.md` — exact setup instructions

## Quick start

```bash
cp .env.example .env   # then fill in real values (never commit .env)
npm install
npm run dev:web        # frontend (Phase 2+)
npm run dev:api        # backend  (Phase 5+)
```

See `SETUP.md` for the full guide.
