"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "../../lib/supabase";

interface Setting {
  key: string;
  value: string | null;
}

const SUGGESTED_KEYS = [
  "about_text",
  "contact_email",
  "resume_url",
  "site_tagline",
  "auto_publish_trusted_repos",
];

/** Key/value site content: about text, contact email, résumé URL, toggles. */
export default function SettingsSection() {
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("settings")
        .select("key,value")
        .order("key", { ascending: true });
      if (error) throw new Error(error.message);
      setRows((data as Setting[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(key: string, value: string) {
    setBusy(true);
    setError(null);
    try {
      const { error } = await getSupabase()
        .from("settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw new Error(error.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function addNew(e: FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    await save(newKey.trim(), newValue);
    setNewKey("");
    setNewValue("");
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-100">Settings</h2>
      <p className="mb-4 text-sm text-slate-400">
        Site content and toggles. Changes apply wherever the site reads these keys.
      </p>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key} className="rounded-xl border border-slate-800 p-4">
            <p className="mb-2 font-mono text-sm text-amber-300">{r.key}</p>
            <div className="flex gap-2">
              <input
                value={draft[r.key] ?? r.value ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                placeholder={SUGGESTED_KEYS.includes(r.key) ? "" : "value"}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-amber-400"
              />
              <button
                disabled={busy}
                onClick={() => save(r.key, draft[r.key] ?? r.value ?? "")}
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addNew} className="mt-6 rounded-xl border border-dashed border-slate-700 p-4">
        <p className="mb-2 text-sm font-medium text-slate-300">Add new setting</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key, e.g. about_text"
            list="suggested-keys"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-amber-400"
          />
          <datalist id="suggested-keys">
            {SUGGESTED_KEYS.filter((k) => !rows.some((r) => r.key === k)).map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-amber-400/60 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
