import Link from "next/link";
import Hero from "../components/Hero";
import Section from "../components/Section";
import ProjectCard from "../components/ProjectCard";
import {
  profile,
  featuredProjects,
  skillGroups,
  education,
  experience,
  socialLinks,
} from "../lib/data";

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section id="about" kicker="About" title="About me">
        <div className="max-w-3xl space-y-4 text-slate-300">
          {profile.about.map((p) => (
            <p key={p.slice(0, 24)} className="leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </Section>

      <Section id="featured" kicker="Selected work" title="Featured projects">
        <div className="grid gap-6 md:grid-cols-3">
          {featuredProjects().map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
        <div className="mt-8">
          <Link href="/projects" className="font-medium text-amber-400 hover:underline">
            See all projects →
          </Link>
        </div>
      </Section>

      <Section id="skills" kicker="Toolkit" title="Skills">
        <div className="grid gap-6 md:grid-cols-3">
          {skillGroups.map((g) => (
            <div key={g.category} className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
              <h3 className="mb-3 font-semibold text-amber-300">{g.category}</h3>
              <div className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <span key={s} className="rounded-full bg-ink-700/70 px-3 py-1 text-sm text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="education" kicker="Background" title="Education">
        <div className="space-y-4">
          {education.map((e) => (
            <div key={e.institution} className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
              <h3 className="text-lg font-bold text-slate-100">{e.degree}</h3>
              <p className="text-amber-300">{e.institution}</p>
              <p className="mt-2 text-sm text-slate-400">{e.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="experience" kicker="Background" title="Experience">
        <div className="space-y-4">
          {experience.map((x) => (
            <div key={x.role} className="rounded-2xl border border-dashed border-ink-700 bg-ink-900/40 p-6">
              <h3 className="text-lg font-bold text-slate-200">{x.role}</h3>
              <p className="text-sm text-slate-400">{x.organization}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="contact" kicker="Say hello" title="Contact">
        <p className="mb-6 max-w-2xl text-slate-300">
          The fastest way to reach me right now is through GitHub. A contact form and more
          links arrive with the admin dashboard (Phase 4).
        </p>
        <div className="flex flex-wrap gap-4">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-amber-400/60 px-6 py-2.5 font-medium text-amber-300 transition hover:bg-amber-400 hover:text-ink-950"
            >
              {s.label}
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
