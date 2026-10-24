import { profile, socialLinks } from "../lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-ink-700/60 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 text-sm text-slate-400">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built with Next.js — static, fast, no trackers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[13px] text-amber-400 hover:underline"
            >
              {s.label.toLowerCase()}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
