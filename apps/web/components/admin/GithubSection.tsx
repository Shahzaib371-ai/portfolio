"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";

interface RepoRow {
  repo_id: string;
  full_name: string;
  default_branch: string | null;
  last_seen_sha: string | null;
  last_synced_at: string | null;
}

interface LogRow {
  id: string;
  kind: string;
  status: string;
  message: string | null;
  created_at: string;
}

function shortSha(sha: string | null): string {
  return sha ? sha.slice(0, 7) : "—";
}

/** Phase 7: shows the most recent webhook delivery, if any. */
function WebhookStatus({ logs }: { logs: LogRow[] }) {
  const last = logs.find((l) => l.kind === "webhook");
  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-200">Webhook automation</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {last
              ? `Last delivery: ${last.status} · ${fmtDate(last.created_at)}`
              : "No webhook deliveries yet — push to a tracked repo after registering the webhook."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            !last
              ? "bg-slate-500/15 text-slate-400"
              : last.status === "ok"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
          }`}
        >
          {!last ? "not configured" : last.status}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Setup: register <span className="font-mono">POST /api/webhooks/github</span> in the repo's
        webhook settings (push events, JSON, shared secret). Full guide:{" "}
        <span className="font-mono">apps/api/WEBHOOKS.md</span>
      </p>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

/** Read-only view of the GitHub sync state (written by packages/github-sync). */
export default function GithubSection() {
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [{ data: repoData, error: repoError }, { data: logData, error: logError }] =
        await Promise.all([
          supabase
            .from("github_repositories")
            .select("repo_id,full_name,default_branch,last_seen_sha,last_synced_at")
            .order("full_name", { ascending: true }),
          supabase
            .from("sync_logs")
            .select("id,kind,status,message,created_at")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);
      if (repoError) throw new Error(repoError.message);
      if (logError) throw new Error(logError.message);
      setRepos((repoData as RepoRow[]) ?? []);
      setLogs((logData as LogRow[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">GitHub repositories</h2>
          <p className="mt-1 text-sm text-slate-400">
            Synced from GitHub by the sync script (Phase 5). The AI agent (Phase 6) uses this
            list to detect new or updated projects.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-amber-400/60 hover:text-amber-300"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <WebhookStatus logs={logs} />

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">HEAD</th>
                  <th className="px-4 py-3 font-medium">Last synced</th>
                </tr>
              </thead>
              <tbody>
                {repos.map((r) => (
                  <tr key={r.repo_id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-slate-200">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-400">{r.default_branch ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{shortSha(r.last_seen_sha)}</td>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(r.last_synced_at)}</td>
                  </tr>
                ))}
                {repos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No repos synced yet — run the sync script (see packages/github-sync/README.md).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 mt-8 text-lg font-bold text-slate-100">Recent sync activity</h3>
          <div className="space-y-2">
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-slate-200">{l.message ?? l.kind}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {l.kind} · {fmtDate(l.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    l.status === "ok"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-500">No sync runs logged yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
