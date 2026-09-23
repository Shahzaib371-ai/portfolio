import { Hono } from "hono";

const app = new Hono();

// Liveness probe for Vercel / uptime monitors.
app.get("/health", (c) => c.json({ ok: true, service: "portfolio-api" }));

// Phase 5+:  /api/admin/*  (JWT auth, CRUD for projects/skills/...)
// Phase 7+:  /api/webhooks/github (HMAC-verified)
// Phase 6+:  /api/admin/analyze/* (AI agent)
// Phase 10+: /api/chat (rate-limited visitor assistant)

export default app;
