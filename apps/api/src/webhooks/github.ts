import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { syncSingleRepo } from "@portfolio/github-sync";
import { analyzeSingleRepo } from "@portfolio/ai-agent/analyze";
import { GeminiProvider } from "@portfolio/ai-agent/gemini";

// ---------------------------------------------------------------------------
// Phase 7: GitHub webhook receiver.
//
// POST /api/webhooks/github
//
// On every push to the default branch of a tracked repository this:
//   1. Verifies the HMAC-SHA256 signature (X-Hub-Signature-256) against
//      GITHUB_WEBHOOK_SECRET — unverified requests are rejected, never logged.
//   2. Upserts the repo into `github_repositories` (detection source of truth).
//   3. Runs the Phase 6 AI analysis for the new SHA → draft with
//      needs_review=true. NOTHING is auto-published.
//
// Security notes:
//   - Signature verification is timing-safe; the endpoint fails closed
//     (500) when GITHUB_WEBHOOK_SECRET is not configured.
//   - Simple in-memory sliding-window rate limit per IP (30 req/min).
//     In serverless deployments this is per-instance; a shared store
//     (e.g. Upstash) should replace it before heavy public exposure.
//   - The heavy work (sync + AI analysis) runs AFTER the HTTP response
//     via executionCtx.waitUntil, so GitHub deliveries never time out.
//     Both steps are idempotent (upsert + skip-if-draft-exists), so
//     GitHub redeliveries are harmless.
// ---------------------------------------------------------------------------

const app = new Hono();

// --- rate limiting ---------------------------------------------------------

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 30;
const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX_REQUESTS;
}

/** Test-only helper: clears the in-memory rate-limit state. */
export function clearRateLimitState(): void {
  hits.clear();
}

// --- signature verification ------------------------------------------------

export function verifySignature(secret: string, rawBody: Buffer, signature: string | null): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = Buffer.from(
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex")
  );
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

// --- background processing -------------------------------------------------

interface PushPayload {
  ref: string;
  after: string;
  deleted?: boolean;
  repository?: { full_name: string; default_branch: string };
}

async function logWebhook(
  supabase: SupabaseClient,
  status: "ok" | "error",
  message: string,
  details: Record<string, unknown>
) {
  const { error } = await supabase
    .from("sync_logs")
    .insert({ kind: "webhook", status, message, details });
  if (error) console.error("Could not write webhook log:", error.message);
}

async function processPush(
  supabase: SupabaseClient,
  payload: PushPayload,
  deliveryId: string
) {
  const repo = payload.repository;
  if (!repo?.full_name) {
    await logWebhook(supabase, "error", "Push event missing repository info.", {
      delivery: deliveryId,
    });
    return;
  }

  // Ignore branch deletions and pushes to non-default branches.
  if (payload.deleted || /^0+$/.test(payload.after ?? "")) {
    console.log(`Webhook ${deliveryId}: ignoring branch deletion for ${repo.full_name}.`);
    return;
  }
  const expectedRef = `refs/heads/${repo.default_branch}`;
  if (payload.ref !== expectedRef) {
    console.log(
      `Webhook ${deliveryId}: ignoring push to ${payload.ref} (default is ${expectedRef}).`
    );
    return;
  }

  const githubToken = process.env.GITHUB_TOKEN; // optional; public repos work without it
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    await logWebhook(supabase, "error", "GEMINI_API_KEY not configured; skipping analysis.", {
      repo: repo.full_name,
      sha: payload.after,
      delivery: deliveryId,
    });
    return;
  }

  try {
    const synced = await syncSingleRepo(supabase, githubToken, repo.full_name);
    const provider = new GeminiProvider(geminiKey);
    const result = await analyzeSingleRepo({
      supabase,
      provider,
      githubToken,
      repo: {
        repo_id: synced.repo_id,
        full_name: synced.full_name,
        default_branch: synced.default_branch,
        last_seen_sha: synced.last_seen_sha,
      },
    });

    const summary =
      result.status === "created"
        ? `Push to ${repo.full_name}: new draft created (confidence: ${result.confidence}).`
        : result.status === "skipped"
          ? `Push to ${repo.full_name}: SHA already analyzed, nothing new.`
          : `Push to ${repo.full_name}: analysis failed — ${result.error}`;

    await logWebhook(supabase, result.status === "failed" ? "error" : "ok", summary, {
      repo: repo.full_name,
      sha: payload.after,
      delivery: deliveryId,
      sync: { isNew: synced.isNew, shaChanged: synced.shaChanged },
      analysis: result.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ""}`.slice(0, 500) : String(err);
    console.error(`Webhook ${deliveryId} processing failed:`, msg);
    await logWebhook(supabase, "error", `Push to ${repo.full_name}: ${msg}`, {
      repo: repo.full_name,
      sha: payload.after,
      delivery: deliveryId,
    });
  }
}

function getWaitUntil(c: {
  executionCtx?: { waitUntil: (p: Promise<unknown>) => void };
}): ((p: Promise<unknown>) => void) | undefined {
  try {
    const ctx = c.executionCtx;
    return ctx?.waitUntil?.bind(ctx);
  } catch {
    // No execution context (plain Node / local dev) — the promise keeps
    // the process alive on its own.
    return undefined;
  }
}

function runInBackground(
  c: { executionCtx?: { waitUntil: (p: Promise<unknown>) => void } },
  work: Promise<void>
) {
  const guarded = work.catch((err) => console.error("Webhook background work failed:", err));
  getWaitUntil(c)?.(guarded);
}

// --- route -----------------------------------------------------------------

app.post("/", async (c) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET is not configured.");
    return c.json({ error: "Webhook receiver is not configured." }, 500);
  }

  const ip = clientIp(c);
  if (isRateLimited(ip)) {
    return c.json({ error: "Too many requests." }, 429);
  }

  const rawBody = Buffer.from(await c.req.arrayBuffer());
  if (!verifySignature(secret, rawBody, c.req.header("x-hub-signature-256") ?? null)) {
    return c.json({ error: "Invalid signature." }, 401);
  }

  const event = c.req.header("x-github-event") ?? "";
  const delivery = c.req.header("x-github-delivery") ?? "unknown";

  if (event === "ping") {
    return c.json({ msg: "pong", delivery });
  }

  if (event !== "push") {
    return c.json({ ignored: true, event, delivery }, 202);
  }

  let payload: PushPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return c.json({ error: "Invalid JSON payload." }, 400);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase env vars are not configured for the webhook receiver.");
    return c.json({ error: "Webhook receiver is not configured." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Acknowledge immediately; do the slow work in the background so GitHub
  // deliveries never hit a serverless timeout.
  runInBackground(c, processPush(supabase, payload, delivery));
  return c.json({ accepted: true, event, delivery }, 202);
});

export default app;
