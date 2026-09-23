"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "../../lib/supabase";
import type { EntityConfig, Field } from "../../lib/admin-config";

type Row = Record<string, unknown>;

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-amber-400";

function emptyFor(field: Field): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "select":
      return field.options?.[0] ?? "";
    case "stringlist":
      return [];
    default:
      return "";
  }
}

function fieldToInput(field: Field, value: unknown): string | boolean | number {
  if (field.type === "stringlist") {
    return Array.isArray(value) ? (value as string[]).join(", ") : "";
  }
  if (field.type === "boolean") return Boolean(value);
  if (field.type === "number") return typeof value === "number" ? value : 0;
  return (value as string) ?? "";
}

function inputToField(field: Field, raw: string | boolean | number): unknown {
  if (field.type === "stringlist") {
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (field.type === "boolean") return Boolean(raw);
  if (field.type === "number") return Number(raw) || 0;
  return String(raw);
}

function cellText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function EditModal({
  config,
  row,
  onClose,
  onSaved,
}: {
  config: EntityConfig;
  row: Row | null; // null = new
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Row>(() => {
    const v: Row = {};
    for (const f of config.fields) v[f.name] = row ? row[f.name] : emptyFor(f);
    return v;
  });
  const [inputs, setInputs] = useState<Record<string, string | boolean | number>>(() => {
    const v: Record<string, string | boolean | number> = {};
    for (const f of config.fields) v[f.name] = fieldToInput(f, row ? row[f.name] : emptyFor(f));
    return v;
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: Row = { updated_at: new Date().toISOString() };
      for (const f of config.fields) payload[f.name] = inputToField(f, inputs[f.name]);
      const supabase = getSupabase();
      const res = row
        ? await supabase.from(config.table).update(payload).eq("id", row.id)
        : await supabase.from(config.table).insert(payload);
      if (res.error) throw new Error(res.error.message);
      setValues(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <form
        onSubmit={onSubmit}
        className="my-8 w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-950 p-6"
      >
        <h2 className="text-lg font-bold text-slate-100">
          {row ? `Edit ${config.singular}` : `New ${config.singular}`}
        </h2>
        <div className="mt-4 space-y-4">
          {config.fields.map((f) => (
            <label key={f.name} className="block">
              <span className="mb-1 block text-sm text-slate-300">
                {f.label}
                {f.required && <span className="text-amber-400"> *</span>}
              </span>
              {f.type === "textarea" || f.type === "stringlist" ? (
                <textarea
                  rows={f.type === "textarea" ? 4 : 2}
                  value={String(inputs[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                  className={inputCls}
                />
              ) : f.type === "select" ? (
                <select
                  value={String(inputs[f.name] ?? "")}
                  onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                  className={inputCls}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "boolean" ? (
                <input
                  type="checkbox"
                  checked={Boolean(inputs[f.name])}
                  onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.checked }))}
                  className="h-5 w-5 accent-amber-400"
                />
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={Number(inputs[f.name] ?? 0)}
                  onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                  className={inputCls}
                />
              ) : (
                <input
                  type="text"
                  value={String(inputs[f.name] ?? "")}
                  required={f.required}
                  placeholder={f.placeholder}
                  onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                  className={inputCls}
                />
              )}
            </label>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Generic list + add/edit/delete UI for one database table. */
export default function CrudSection({ config }: { config: EntityConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null | undefined>(undefined); // undefined = closed

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from(config.table)
        .select("*")
        .order(config.orderBy, { ascending: true });
      if (error) throw new Error(error.message);
      setRows((data as Row[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(row: Row) {
    if (!window.confirm(`Delete this ${config.singular}? This cannot be undone.`)) return;
    const { error } = await getSupabase().from(config.table).delete().eq("id", row.id);
    if (error) {
      alert(error.message);
      return;
    }
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">
          {config.label} <span className="text-sm font-normal text-slate-500">({rows.length})</span>
        </h2>
        <button
          onClick={() => setEditing(null)}
          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          + New {config.singular}
        </button>
      </div>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                {config.listColumns.map((c) => (
                  <th key={c} className="px-4 py-3 font-medium">
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)} className="border-b border-slate-800/60 last:border-0">
                  {config.listColumns.map((c) => (
                    <td key={c} className="max-w-xs truncate px-4 py-3 text-slate-200">
                      {c === "status" ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r[c] === "published"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : r[c] === "hidden"
                                ? "bg-slate-500/15 text-slate-400"
                                : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {cellText(r[c])}
                        </span>
                      ) : (
                        cellText(r[c])
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      onClick={() => setEditing(r)}
                      className="mr-3 text-amber-300 hover:text-amber-200"
                    >
                      Edit
                    </button>
                    <button onClick={() => remove(r)} className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={config.listColumns.length + 1}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Nothing here yet — add the first {config.singular.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && (
        <EditModal
          config={config}
          row={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}
