import Link from "next/link";
import { profile } from "../lib/data";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/resume", label: "Résumé" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="text-amber-400">S</span>
          <span className="text-slate-100">hahzaib</span>
          <span className="text-amber-400">.</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-slate-300 transition hover:text-amber-400">
              {l.label}
            </Link>
          ))}
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-amber-400/60 px-4 py-1.5 font-medium text-amber-300 transition hover:bg-amber-400 hover:text-ink-950"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  );
}
