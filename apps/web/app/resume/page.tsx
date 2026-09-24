"use client";

import { useSiteContent } from "../../lib/use-site-content";

export default function ResumePage() {
  const { profile, education, experience, skillGroups, projects } = useSiteContent();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-50">{profile.name}</h1>
      <p className="mt-3 text-lg text-amber-300">{profile.tagline}</p>
      <a href={profile.github} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-slate-400 hover:text-amber-300">
        {profile.github}
      </a>

      <h2 className="mt-12 border-b border-ink-700 pb-2 text-xl font-bold text-slate-100">Summary</h2>
      <div className="mt-4 space-y-3 text-slate-300">
        {profile.about.map((p) => (
          <p key={p.slice(0, 24)} className="leading-relaxed">
            {p}
          </p>
        ))}
      </div>

      <h2 className="mt-12 border-b border-ink-700 pb-2 text-xl font-bold text-slate-100">Projects</h2>
      <div className="mt-4 space-y-5">
        {projects.map((p) => (
          <div key={p.slug}>
            <h3 className="font-semibold text-slate-100">
              {p.title} <span className="font-normal text-slate-400">— {p.category}</span>
            </h3>
            <p className="mt-1 text-sm text-slate-400">{p.tagline}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 border-b border-ink-700 pb-2 text-xl font-bold text-slate-100">Skills</h2>
      <div className="mt-4 space-y-3">
        {skillGroups.map((g) => (
          <p key={g.category} className="text-slate-300">
            <span className="font-semibold text-amber-300">{g.category}: </span>
            {g.items.join(", ")}
          </p>
        ))}
      </div>

      <h2 className="mt-12 border-b border-ink-700 pb-2 text-xl font-bold text-slate-100">Education</h2>
      <div className="mt-4 space-y-3">
        {education.map((e) => (
          <div key={e.institution}>
            <h3 className="font-semibold text-slate-100">{e.degree}</h3>
            <p className="text-sm text-slate-400">
              {e.institution} — {e.detail}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 border-b border-ink-700 pb-2 text-xl font-bold text-slate-100">Experience</h2>
      <div className="mt-4 space-y-3">
        {experience.map((x) => (
          <p key={x.role} className="text-slate-300">
            <span className="font-semibold">{x.role}</span>
            <span className="text-slate-400"> — {x.organization}</span>
          </p>
        ))}
      </div>

      <p className="mt-12 text-sm text-slate-500">
        This résumé is editable from the admin dashboard — no code changes needed.
      </p>
    </div>
  );
}
