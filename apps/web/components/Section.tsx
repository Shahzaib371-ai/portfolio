import type { ReactNode } from "react";

export default function Section({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-5 py-16">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">{kicker}</p>
      <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
