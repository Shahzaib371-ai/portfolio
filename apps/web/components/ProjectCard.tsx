import Link from "next/link";
import type { Project } from "../lib/data";
import Reveal from "./Reveal";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Reveal className="h-full">
      <Link
        href={`/projects/${project.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-ink-700 bg-ink-900/60 p-6 transition duration-300 hover:-translate-y-1.5 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-400/10"
      >
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">{project.category}</p>
        <h3 className="mb-2 font-display text-xl font-bold text-slate-100 group-hover:text-amber-300">{project.title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{project.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-ink-700/70 px-3 py-1 text-xs text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </Link>
    </Reveal>
  );
}
