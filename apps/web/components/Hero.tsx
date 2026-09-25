"use client";

import { useSiteContent } from "../lib/use-site-content";

export default function Hero() {
  const { profile } = useSiteContent();
  const shapeClass = profile.photoShape === "rounded" ? "rounded-3xl" : "rounded-full";

  return (
    <div className="hero-grid relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-24 text-center">
        <p className="mb-4 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">
          Portfolio
        </p>
        {profile.photoUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={profile.photoUrl}
              alt={profile.name}
              className={`h-36 w-36 border-4 border-amber-400/70 object-cover shadow-2xl shadow-amber-400/10 md:h-44 md:w-44 ${shapeClass}`}
            />
          </div>
        )}
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl">
          {profile.name}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          {profile.tagline}
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <a
            href="/projects"
            className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-ink-950 transition hover:bg-amber-300"
          >
            View Projects
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-600 px-7 py-3 font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-300"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
