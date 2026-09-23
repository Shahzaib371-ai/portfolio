import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Read from ~/workspace/portfolio/.env (DATABASE_URL) — never committed.
    url: process.env.DATABASE_URL!,
  },
});
