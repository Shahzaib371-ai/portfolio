// Phase 9: Vercel serverless entry point.
//
// Vercel turns every file in `api/` into a serverless function. This single
// entry forwards all requests to the Hono app and wires Vercel's `waitUntil`
// into Hono's execution context — so the Phase 7 webhook's background work
// (sync → AI analysis → review draft) keeps running after the 202 response
// is sent to GitHub, instead of being frozen mid-flight.
import { waitUntil } from "@vercel/functions";
import app from "../src/index.js";

export const config = {
  // The background AI analysis (GitHub + Gemini calls) can take a while.
  maxDuration: 60,
};

export default async function handler(req: Request): Promise<Response> {
  return app.fetch(
    req,
    {},
    { waitUntil, passThroughOnException: () => {}, props: {} }
  );
}
