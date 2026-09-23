import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazily-initialised Drizzle client for server-side code (API routes,
// admin, workers). Uses the service_role connection string from the
// environment; never import this in client/browser bundles.
let cached: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const client = postgres(url, { prepare: false });
    cached = drizzle(client, { schema });
  }
  return cached;
}

export { schema };
