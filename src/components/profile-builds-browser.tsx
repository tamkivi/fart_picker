"use client";

import Link from "next/link";
import { useRef } from "react";

type Profile = {
  key: string;
  name: string;
  target: string;
  priority: string;
};

const categoryLabelByProfileKey: Record<string, string> = {
  "local-llm-inference": "Cost-Efficient Local LLMs",
  "llm-finetune-starter": "Tuning Stability",
  "hybrid-ai-gaming": "Multitasking",
  "workstation-ai": "Maximum Throughput",
};

function slowScrollTo(el: HTMLElement, duration = 1400) {
  const start = window.scrollY;
  const target = el.getBoundingClientRect().top + start - 32;
  const diff = target - start;
  let startTime: number | null = null;

  function easeInOut(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo(0, start + diff * easeInOut(progress));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export function ProfileBuildsBrowser({ profiles }: { profiles: Profile[] }) {
  const profileCardsRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="mt-16">
      <div className="flex justify-center mb-16">
        <button
          type="button"
          onClick={() => {
            if (profileCardsRef.current) slowScrollTo(profileCardsRef.current);
          }}
          className="rounded-2xl border-2 border-[color:var(--accent)] px-14 py-7 text-center font-semibold transition hover:-translate-y-0.5"
          style={{ boxShadow: "0 0 32px color-mix(in srgb, var(--accent) 25%, transparent)" }}
        >
          <span className="font-display block text-2xl">Show me the different kinds of builds!</span>
          <span className="mt-1.5 block text-sm text-[color:var(--muted)]">
            Local inference · Fine-tuning · Hybrid · AI Workstations
          </span>
        </button>
      </div>

      <p className="mb-6 text-sm font-semibold text-[color:var(--muted)]">
        Choose the type of build you&apos;re looking for:
      </p>
      <div ref={profileCardsRef} className="grid gap-6 grid-cols-2">
        {profiles.map((profile, index) => (
          <Link
            key={profile.key}
            href={`/profiles/${profile.key}`}
            className="wireframe-panel stagger-in p-7 text-left transition hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="label-pill inline-block">
              {categoryLabelByProfileKey[profile.key] ?? "Build Category"}
            </p>
            <h2 className="font-display mt-6 text-2xl font-semibold">{profile.name}</h2>
            <p className="mt-4 font-[Helvetica] text-sm text-[color:var(--muted)]">Target: {profile.target}</p>
            <p className="mt-3 font-mono text-sm text-[color:var(--muted)]">Priority: {profile.priority}</p>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">
              View builds →
            </p>
          </Link>
        ))}
      </div>

      <Link
        href="/profiles/macos-systems"
        className="wireframe-panel mt-6 flex items-center justify-between gap-6 p-7 transition hover:-translate-y-0.5"
      >
        <div>
          <p className="label-pill inline-block">Compact &amp; Quiet</p>
          <h2 className="font-display mt-4 text-2xl font-semibold">MacOS Based Systems</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Apple Silicon Mac minis · pre-configured for local AI workloads · no GPU required
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">
          View systems →
        </p>
      </Link>

      <div className="mt-8 flex justify-center">
        <Link
          href="/faq#which-one"
          className="rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-6 py-3 text-sm font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          Which one should I pick?
        </Link>
      </div>
    </section>
  );
}
