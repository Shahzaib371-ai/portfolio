"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";

interface Draft {
  id: string;
  github_repo_id: string | null;
  payload: unknown;
  needs_review: boolean;
  reviewed: boolean;
  created_at: string;
}

/**
 * Human review queue for AI-detected projects (filled by Phase 6).
 * Nothing here is auto-published — the admin reviews and approves.
 */
export default function DraftsSection() {
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("ai_project_drafts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      setRows((data as Draft[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markReviewed(d: Draft, reviewed: boolean) {
    const { error } = await getSupabase()
      .from("ai_project_drafts")
      .update({ reviewed, needs_review: !reviewed, updated_at: new Date().toISOString() })
      .eq("id", d.id);
    if (error) alert(error.message);
    else load();
  }

  async function remove(d: Draft) {
    if (!window.confirm("Delete this draft?")) return;
    const { error } = await getSupabase().from("ai_project_drafts").delete().eq("id", d.id);
    if (error) alert(error.message);
    else load();
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-100">AI Drafts — review queue</h2>
      <p className="mb-4 text-sm text-slate-400">
        Projects detected by the AI agent (Phase 6) wait here for your approval. Nothing is
        published automatically.
      </p>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="rounded-xl border border-slate-800 px-4 py-8 text-center text-slate-500">
          No drafts yet. The AI project-analysis agent arrives in Phase 6.
        </p>
      )}

      <div className="space-y-3">
        {rows.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-800 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm text-slate-200">{d.github_repo_id ?? d.id.slice(0, 8)}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.reviewed
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {d.reviewed ? "Reviewed" : "Needs review"}
                </span>
                <button
                  onClick={() => setOpen(open === d.id ? null : d.id)}
                  className="text-sm text-slate-300 hover:text-amber-300"
                >
                  {open === d.id ? "Hide" : "View"}
                </button>
                <button
                  onClick={() => markReviewed(d, !d.reviewed)}
                  className="text-sm text-amber-300 hover:text-amber-200"
                >
                  {d.reviewed ? "Unmark" : "Mark reviewed"}
                </button>
                <button onClick={() => remove(d)} className="text-sm text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            </div>
            {open === d.id && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
                {JSON.stringify(d.payload, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
