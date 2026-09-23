# SETUP.md — Exact Setup Instructions

Follow in order. Nothing here needs you to write code.

## Step 0 — Prereqs (you, ~10 min)

1. Install **Node.js 20 LTS** from nodejs.org. Verify:
   ```bash
   node -v   # should print v20.x.x
   npm -v
   ```
2. Create a free account at **supabase.com** → "New project". Save:
   - Project URL
   - `anon` key
   - `service_role` key  (Settings → API)
3. Get a free AI key at **aistudio.google.com** → "Get API key".

## Step 1 — Clone the repo

```bash
git clone https://github.com/Shahzaib371-ai/portfolio.git
cd portfolio
cp .env.example .env
```

Fill `.env` with the values from Step 0 (see `.env.example` comments for
exactly where each value comes from). **Never commit `.env`.**

## Step 2 — Install & typecheck

```bash
npm install
npm run typecheck
```

Both must pass with no errors.

## Step 3 — Accounts needed per phase

| Phase | Needs |
|---|---|
| 1 (now) | GitHub repo ✅, Node 20 |
| 3 | Supabase project (DB URL + keys in `.env`) |
| 5 | GitHub fine-grained token (Contents: Read-only, Metadata: Read-only) + webhook secret |
| 6 | AI API key in `.env` |
| 7 | Webhook URL = your deployed API `/api/webhooks/github` |
| 9 | Vercel account (backend), GitHub Pages (frontend, via Actions) |

## Step 4 — How to test Phase 1

```bash
npm install          # workspaces resolve, no errors
npm run typecheck    # all packages compile
git log --oneline -3 # scaffold commits visible after push
```

Then confirm to me and we start **Phase 2: portfolio frontend**.

## Decided content (editable later via admin)

- Hero subtitle: `Computer Engineering Student | Embedded Systems | IoT | Machine Learning | Robotics`
- All other text uses editable placeholders until you provide real info.
  I will never invent your qualifications, jobs, or achievements.
