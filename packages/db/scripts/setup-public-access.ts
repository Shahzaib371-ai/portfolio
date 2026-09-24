/**
 * One-time setup for manual portfolio editing (run locally only).
 * Uses ONLY the Supabase HTTPS REST API (direct Postgres is blocked from here).
 *  1. Verifies public (anon-key) SELECT works on content tables.
 *  2. Seeds content tables from apps/web/lib/data.ts via the service-role key
 *     (idempotent — only fills tables that are currently empty).
 *  3. Verifies the anon key can read the seeded published projects.
 *  4. Reports whether the admin auth user exists.
 *
 * Reads SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
 * from the repo-root .env. Never prints secret values.
 */
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
config({ path: join(root, ".env") });

async function main() {
  // Single source of truth: the same data the static site uses today.
  const data = await import(join(root, "apps/web/lib/data.ts"));

  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in root .env");
  }

  const anon = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
  const svc = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const rest = (path: string) => `${SUPABASE_URL}/rest/v1/${path}`;

  async function getCount(table: string, headers: Record<string, string>): Promise<number> {
    const col = table === "settings" ? "key" : "id";
    const r = await fetch(rest(`${table}?select=${col}`), { headers });
    if (!r.ok) throw new Error(`count(${table}) -> HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return ((await r.json()) as unknown[]).length;
  }

  // --- 1. Verify public read on every content table --------------------------
  console.log("Verifying anon-key public read…");
  for (const t of ["projects", "skills", "experience", "education", "certifications", "social_links", "settings"]) {
    const col = t === "settings" ? "key" : "id"; // settings is keyed by `key`, not `id`
    const r = await fetch(rest(`${t}?select=${col}&limit=1`), { headers: anon });
    console.log(`  ${t}: HTTP ${r.status}${r.ok ? "" : " <- PUBLIC READ BLOCKED"}`);
    if (!r.ok) throw new Error(`Public read blocked on ${t} (HTTP ${r.status}). RLS policy needed.`);
  }

  // --- 2. Seed empty tables via service role ---------------------------------
  async function seedIfEmpty(table: string, rows: Record<string, unknown>[]) {
    const n = await getCount(table, svc);
    if (n > 0) {
      console.log(`${table}: already has ${n} rows — skipping.`);
      return;
    }
    console.log(`Seeding ${table} (${rows.length} rows)…`);
    const r = await fetch(rest(table), { method: "POST", headers: svc, body: JSON.stringify(rows) });
    if (!r.ok) throw new Error(`seed(${table}) -> HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    console.log(`  ${table}: seeded.`);
  }

  let order = 0;
  await seedIfEmpty(
    "projects",
    (data.projects as Array<Record<string, any>>).map((p) => ({
      title: p.title,
      slug: p.slug,
      description: p.tagline,
      detailed_description: p.description,
      technologies: p.tags,
      category: p.category,
      github_url: p.githubUrl ?? null,
      live_url: p.liveUrl ?? null,
      featured: p.featured,
      status: "published",
      sort_order: order++,
      ai_generated: false,
      manually_edited: false,
    }))
  );

  order = 0;
  const skillRows: Record<string, unknown>[] = [];
  for (const g of data.skillGroups as Array<{ category: string; items: string[] }>)
    for (const name of g.items) skillRows.push({ name, category: g.category, level: 0, sort_order: order++ });
  await seedIfEmpty("skills", skillRows);

  order = 0;
  await seedIfEmpty(
    "education",
    (data.education as Array<Record<string, string>>).map((e) => ({
      degree: e.degree,
      institution: e.institution,
      description: e.detail,
      sort_order: order++,
    }))
  );

  await seedIfEmpty(
    "experience",
    (data.experience as Array<Record<string, any>>).map((x, i) => ({
      title: x.role,
      organization: x.organization,
      start_date: x.period || null,
      end_date: null,
      description: "",
      sort_order: i,
    }))
  );

  order = 0;
  await seedIfEmpty(
    "social_links",
    (data.socialLinks as Array<{ label: string; url: string }>).map((s) => ({
      platform: s.label.toLowerCase(),
      url: s.url,
      sort_order: order++,
    }))
  );

  const profile = data.profile as { name: string; tagline: string; about: string[]; github: string };
  await seedIfEmpty("settings", [
    { key: "profile_name", value: profile.name },
    { key: "profile_tagline", value: profile.tagline },
    { key: "profile_about", value: JSON.stringify(profile.about) },
    { key: "profile_github", value: profile.github },
  ]);

  // --- 3. Verify anon can read seeded published projects ---------------------
  const r = await fetch(rest("projects?select=slug,title,status"), { headers: anon });
  const rows = (await r.json()) as Array<{ status: string }>;
  console.log(`Public read check: ${rows.length} project rows visible to anon (all should be published).`);

  // --- 4. Admin auth user -----------------------------------------------------
  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers: svc });
  if (!usersRes.ok) throw new Error(`Auth admin check -> HTTP ${usersRes.status}`);
  const users = (await usersRes.json()) as { users: Array<{ email?: string }> };
  const adminEmail = "shahzaibhasnain.it@gmail.com";
  console.log(`Admin auth user (${adminEmail}): ${users.users.some((u) => u.email === adminEmail) ? "EXISTS" : "MISSING"}`);

  console.log("Done.");
}

main().catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
