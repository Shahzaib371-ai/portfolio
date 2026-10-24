"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  "> booting shahzaib.sys ............ OK",
  "> robotics core ................... OK",
  "> embedded · iot · ml modules ..... OK",
  "> status: OPEN TO OPPORTUNITIES",
];

/**
 * One-time boot popup shown when the site opens: a small system dialog that
 * "powers on" the portfolio, then slides away. Runs once per browser session,
 * skips itself for reduced-motion users, and can be dismissed with a click.
 */
export default function IntroOverlay() {
  const [phase, setPhase] = useState<"show" | "exit" | "gone">("show");
  const [lines, setLines] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("intro-seen") === "1") {
      setPhase("gone");
      return;
    }
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLines(i + 1), 240 * (i + 1)));
    });
    timers.push(setTimeout(() => setPhase("exit"), 1560));
    timers.push(
      setTimeout(() => {
        setPhase("gone");
        sessionStorage.setItem("intro-seen", "1");
      }, 2120),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      onClick={() => setPhase("gone")}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink-950 px-5 transition-transform duration-500 ease-in ${
        phase === "exit" ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="anim-pop-in w-full max-w-md rounded-2xl border border-amber-400/40 bg-ink-900 p-7 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">
            shahzaib.sys
          </p>
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            <span className="anim-blink h-2.5 w-2.5 rounded-full bg-amber-400" />
          </span>
        </div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-50">
          Shahzaib Hasnain
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-400">
          computer_engineering — portfolio interface
        </p>
        <div className="mt-6 min-h-24 font-mono text-[13px] leading-6 text-slate-300">
          {BOOT_LINES.slice(0, lines).map((l) => (
            <p key={l}>
              {l}
              {l.includes("OPEN TO") && <span className="anim-blink text-amber-300">_</span>}
            </p>
          ))}
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div className="boot-bar-fill h-full rounded-full bg-amber-400" />
        </div>
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">
          tap anywhere to skip
        </p>
      </div>
    </div>
  );
}
