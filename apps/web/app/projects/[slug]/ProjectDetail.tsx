"use client";

import Link from "next/link";
import { Seo } from "../../../lib/seo";
import { useSiteContent } from "../../../lib/use-site-content";

export default function ProjectDetail({ slug }: { slug: string }) {
  const { projects } = useSiteContent();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-100">Project not found</h1>
        <p className="mt-3 text-slate-400">
          This project may have been removed or is still being published.
        </p>
        <Link href="/projects" className="mt-6 inline-block text-amber-400 hover:underline">
          ← All projects
        </Link>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={project.title}
        description={project.tagline}
        path={`/projects/${project.slug}`}
      />
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Link href="/projects" className="mb-8 inline-block text-sm text-amber-400 hover:underline">
        ← All projects
      </Link>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
        {project.category}
      </p>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-50">{project.title}</h1>
      <p className="mb-6 text-lg text-slate-300">{project.tagline}</p>
      <div className="mb-8 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <span key={t} className="rounded-full bg-ink-700/70 px-3 py-1 text-sm text-slate-300">
            {t}
          </span>
        ))}
      </div>
      <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
        <h2 className="mb-3 font-semibold text-slate-100">About this project</h2>
        <p className="leading-relaxed text-slate-300">{project.description}</p>
      </div>
      <div className="mt-8 flex gap-4">
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-amber-400 px-6 py-2.5 font-semibold text-ink-950 transition hover:bg-amber-300"
          >
            View on GitHub
          </a>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-600 px-6 py-2.5 font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
          >
            Live demo
          </a>
        )}
      </div>
    </div>
    </>
  );
}
