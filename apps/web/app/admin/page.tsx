"use client";

import { useEffect, useState } from "react";
import AuthGate from "../../components/admin/AuthGate";
import CrudSection from "../../components/admin/CrudSection";
import GithubSection from "../../components/admin/GithubSection";
import PhotoSection from "../../components/admin/PhotoSection";
import SettingsSection from "../../components/admin/SettingsSection";
import DraftsSection from "../../components/admin/DraftsSection";
import { entities } from "../../lib/admin-config";
import { getSupabase } from "../../lib/supabase";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "photo", label: "Photo" },
  ...entities.map((e) => ({ id: e.table, label: e.label })),
  { id: "settings", label: "Settings" },
  { id: "github", label: "GitHub" },
  { id: "ai_project_drafts", label: "AI Drafts" },
];

function Overview() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const out: Record<string, number> = {};
      for (const e of entities) {
        const { count } = await supabase.from(e.table).select("*", { count: "exact", head: true });
        out[e.table] = count ?? 0;
      }
      const { count: drafts } = await supabase
        .from("ai_project_drafts")
        .select("*", { count: "exact", head: true })
        .eq("needs_review", true);
      out["ai_project_drafts"] = drafts ?? 0;
      setCounts(out);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-slate-400">Loading…</p>;

  const cards = [
    ...entities.map((e) => ({ label: e.label, count: counts[e.table] ?? 0, tab: e.table })),
    { label: "AI drafts needing review", count: counts["ai_project_drafts"] ?? 0, tab: "ai_project_drafts" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.tab} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-3xl font-bold text-amber-400">{c.count}</p>
          <p className="mt-1 text-sm text-slate-400">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function AdminApp() {
  const [tab, setTab] = useState("overview");
  const entity = entities.find((e) => e.table === tab);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Admin</p>
      <h1 className="mb-6 text-2xl font-bold text-slate-100">Dashboard</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-amber-400 text-slate-950"
                : "border border-slate-700 text-slate-300 hover:border-amber-400/60 hover:text-amber-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "photo" && <PhotoSection />}
      {entity && <CrudSection key={entity.table} config={entity} />}
      {tab === "settings" && <SettingsSection />}
      {tab === "github" && <GithubSection />}
      {tab === "ai_project_drafts" && <DraftsSection />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGate>
      <AdminApp />
    </AuthGate>
  );
}
