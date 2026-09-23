import { profile } from "../lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-ink-700/60 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 text-sm text-slate-400">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built with Next.js — static, fast, no trackers.
        </p>
        <a href={profile.github} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
          github.com/Shahzaib371-ai
        </a>
      </div>
    </footer>
  );
}
