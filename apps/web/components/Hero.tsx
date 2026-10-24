"use client";

import Link from "next/link";
import { useSiteContent } from "../lib/use-site-content";

export default function Hero() {
  const { profile } = useSiteContent();
  const shapeClass = profile.photoShape === "rounded" ? "rounded-3xl" : "rounded-full";

  return (
    <div className="hero-grid relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-24 text-center">
        <p className="anim-fade-up mb-4 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 font-mono text-xs font-medium uppercase tracking-[0.2em] text-amber-300">
          <span className="anim-blink mr-2 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" />
          sys.online // portfolio
        </p>
        {profile.photoUrl && (
          <div className="anim-pop-in mb-6 flex justify-center">
            <div className="relative">
              <span
                aria-hidden
                className={`absolute -inset-2.5 animate-[spin_28s_linear_infinite] border border-dashed border-amber-400/40 ${shapeClass}`}
              />
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className={`relative h-36 w-36 border-4 border-amber-400/70 object-cover shadow-2xl shadow-amber-400/10 md:h-44 md:w-44 ${shapeClass}`}
              />
            </div>
          </div>
        )}
        <h1 className="anim-fade-up anim-delay-1 font-display text-5xl font-extrabold tracking-tight text-slate-50 md:text-6xl">
          {profile.name}
        </h1>
        <p className="anim-fade-up anim-delay-2 mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
          {profile.tagline}
        </p>
        <p className="anim-fade-up anim-delay-3 mt-4 font-mono text-sm text-amber-300/90">
          &gt; embedded_systems · iot · machine_learning · robotics
          <span className="anim-blink">_</span>
        </p>
        <div className="anim-fade-up anim-delay-4 mt-9 flex items-center justify-center gap-4">
          <Link
            href="/projects"
            className="rounded-full bg-amber-400 px-7 py-3 font-semibold text-ink-950 transition hover:bg-amber-300"
          >
            View Projects
          </Link>
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
