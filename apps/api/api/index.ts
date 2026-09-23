// Phase 9: Vercel serverless entry point.
//
// Vercel turns every file in `api/` into a serverless function. This single
// entry forwards all requests to the Hono app (see vercel.json: every path
// rewrites to /api) and wires Vercel's `waitUntil` into Hono's execution
// context — so the Phase 7 webhook's background work (sync → AI analysis →
// review draft) keeps running after the 202 response is sent to GitHub,
// instead of being frozen mid-flight.
//
// NOTE: Vercel's Node.js runtime ignores a `default` export that returns a
// `Response` (fetch-style). Named HTTP-method exports ARE supported and may
// return a Response, so we export one handler per method instead.
import { waitUntil } from "@vercel/functions";
import app from "../src/index.js";

export const config = {
  // The background AI analysis (GitHub + Gemini calls) can take a while.
  maxDuration: 60,
};

async function vercelHandler(req: Request): Promise<Response> {
  return app.fetch(
    req,
    {},
    { waitUntil, passThroughOnException: () => {}, props: {} }
  );
}

export const GET = vercelHandler;
export const POST = vercelHandler;
export const PUT = vercelHandler;
export const PATCH = vercelHandler;
export const DELETE = vercelHandler;
export const OPTIONS = vercelHandler;
export const HEAD = vercelHandler;
