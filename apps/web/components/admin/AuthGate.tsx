"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../../lib/supabase";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Admin</p>
      <h1 className="text-2xl font-bold text-slate-100">Sign in</h1>
      <p className="mt-2 text-sm text-slate-400">
        Only the site owner can sign in. New public sign-ups are disabled.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-300">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/** Blocks the admin UI behind Supabase Auth. Shows the login form when signed out. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (mounted) setSession(data.session);
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
          if (mounted) setSession(s);
        });
        return () => sub.subscription.unsubscribe();
      } catch (err) {
        if (mounted) setConfigError(err instanceof Error ? err.message : "Supabase error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (configError) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-xl font-bold text-slate-100">Admin unavailable</h1>
        <p className="mt-3 text-slate-400">{configError}</p>
      </div>
    );
  }

  if (session === undefined) {
    return <p className="px-5 py-24 text-center text-slate-400">Loading…</p>;
  }

  if (!session) return <LoginForm />;

  return (
    <div>
      <div className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <p className="text-sm text-slate-400">
            Signed in as <span className="text-slate-200">{session.user.email}</span>
          </p>
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-amber-400 hover:text-amber-300"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
