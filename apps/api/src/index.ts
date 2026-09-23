import { Hono } from "hono";
import githubWebhook from "./webhooks/github";

const app = new Hono();

// Liveness probe for Vercel / uptime monitors.
app.get("/health", (c) => c.json({ ok: true, service: "portfolio-api" }));

// Phase 7: GitHub webhook receiver (HMAC-verified). On push to a tracked
// repo's default branch: sync repo → AI analysis → review draft.
// Never auto-publishes.
app.route("/api/webhooks/github", githubWebhook);

// Phase 5+:  /api/admin/*  (JWT auth, CRUD for projects/skills/...)
// Phase 6+:  /api/admin/analyze/* (AI agent)
// Phase 10+: /api/chat (rate-limited visitor assistant)

export default app;
