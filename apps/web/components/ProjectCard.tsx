import Link from "next/link";
import type { Project } from "../lib/data";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col rounded-2xl border border-ink-700 bg-ink-900/60 p-6 transition hover:-translate-y-1 hover:border-amber-400/60"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">{project.category}</p>
      <h3 className="mb-2 text-xl font-bold text-slate-100 group-hover:text-amber-300">{project.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{project.tagline}</p>
      <div className="flex flex-wrap gap-2">
        {project.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-ink-700/70 px-3 py-1 text-xs text-slate-300">
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
