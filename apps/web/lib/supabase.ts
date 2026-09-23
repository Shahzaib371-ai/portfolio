import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase client for the admin SPA. The site is a static export
// (GitHub Pages), so auth + data access happen in the browser with the
// publishable anon key. RLS on the database enforces that only the admin's
// JWT can read/write private tables.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to apps/web/.env.local"
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
