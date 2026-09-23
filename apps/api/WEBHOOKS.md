# GitHub Webhook Automation (Phase 7)

Push to any tracked repository → the portfolio updates itself within seconds:

```
GitHub push → POST /api/webhooks/github → verify HMAC signature
  → upsert repo in `github_repositories`
  → AI analysis → draft in `ai_project_drafts` (needs_review=true)
  → log everything in `sync_logs` (kind = "webhook")
```

Nothing is ever auto-published. The admin reviews drafts in the dashboard
exactly like Phase 6.

## One-time setup

The API must be deployed first (Phase 9). Then, for each repository you want
auto-synced (or once per org):

1. GitHub → repository **Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://<your-api-domain>/api/webhooks/github`
3. **Content type:** `application/json`
4. **Secret:** the value of `GITHUB_WEBHOOK_SECRET` (see below)
5. **Which events:** "Let me select individual events" → check **Pushes** only
6. **Active:** checked → Add webhook
7. GitHub sends a `ping` event immediately — it must show a green checkmark.
   A red X means the secret or URL is wrong; the failure is also visible in
   the admin dashboard under GitHub → Activity (only verified deliveries are
   logged, so a red X with no log row = signature mismatch).

## Environment variables (API)

| Variable                  | Required | Purpose                                              |
| ------------------------- | -------- | ---------------------------------------------------- |
| `GITHUB_WEBHOOK_SECRET`   | yes      | HMAC secret shared with GitHub; endpoint fails closed without it |
| `SUPABASE_URL`            | yes      | Supabase project URL                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | yes    | Service-role key (bypasses RLS for writes)           |
| `GEMINI_API_KEY`          | yes      | AI analysis of the pushed SHA                        |
| `GITHUB_TOKEN`            | no       | Raises GitHub API rate limits; public repos work without it |

Generate a secret locally:

```bash
openssl rand -hex 32
```

Put it in the API's environment (Vercel → Project Settings → Environment
Variables, or the root `.env` for local dev). The same value goes into the
GitHub webhook "Secret" field. Rotate it any time by changing both sides.

## Behavior details

- **Signature:** `X-Hub-Signature-256` verified with a timing-safe comparison.
  Missing/invalid signature → `401`. No secret configured → `500` (fail closed).
- **Events:** `ping` → `200 {"msg":"pong"}`. `push` → `202` immediately, work
  continues in the background via `waitUntil` so deliveries never hit a
  serverless timeout. Anything else → `202 {"ignored":true}`.
- **Push filtering:** branch deletions and pushes to non-default branches are
  ignored. Only `refs/heads/<default_branch>` triggers sync + analysis.
- **Idempotency:** GitHub redeliveries are harmless — repo upsert is keyed on
  `repo_id`, and analysis is skipped when a draft already exists for the SHA.
- **Rate limiting:** 30 requests/minute per IP, in-memory sliding window.
  Per-instance on serverless; replace with a shared store (e.g. Upstash Redis)
  before heavy public exposure.
- **Logging:** every processed delivery writes a `sync_logs` row with
  `kind="webhook"` — visible in the admin dashboard's GitHub → Activity tab.
  Rejected signatures (401) are NOT logged to the database (avoids log-spam
  amplification from attackers).

## Local testing

```bash
cd ~/workspace/portfolio
set -a; source .env; set +a
npx tsx /tmp/test-webhook.ts   # ping / bad-sig / ignored event / push (test script, not committed)
```

Or with curl (replace `<sig>` with a real HMAC):

```bash
BODY='{"zen":"hello"}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$GITHUB_WEBHOOK_SECRET" | cut -d' ' -f2)"
curl -i -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-GitHub-Delivery: local-1" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
```
