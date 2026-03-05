"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="mt-16">
      <div className="flex justify-center mb-16">
        <button
          type="button"
          onClick={() => {
            setSectionVisible(true);
            if (profileCardsRef.current) slowScrollTo(profileCardsRef.current);
          }}
          className="rounded-2xl border-2 border-[color:var(--accent)] px-5 py-4 md:px-14 md:py-7 text-center font-semibold transition hover:-translate-y-0.5 max-w-sm w-full md:w-auto"
          style={{ boxShadow: "0 0 32px color-mix(in srgb, var(--accent) 25%, transparent)" }}
        >
          <span className="font-display block text-xl md:text-2xl">Show me the different kinds of builds!</span>
          <span className="mt-1.5 block text-xs md:text-sm text-[color:var(--muted)]">
            Local inference · Fine-tuning · Hybrid · AI Workstations
          </span>
        </button>
      </div>

      {/* This section starts hidden and reveals when scrolled into view */}
      <div
        ref={revealRef}
        className={`reveal-on-scroll${sectionVisible ? " is-visible" : ""}`}
      >
        <p className="mb-6 text-sm font-semibold text-[color:var(--muted)]">
          Choose the type of build you&apos;re looking for:
        </p>
        <div ref={profileCardsRef} className="grid gap-6 grid-cols-1 sm:grid-cols-2">
          {profiles.map((profile, index) => (
            <Link
              key={profile.key}
              href={`/profiles/${profile.key}`}
              className="wireframe-panel stagger-in p-7 text-left transition hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="category-tag inline-block">
                {categoryLabelByProfileKey[profile.key] ?? "Build Category"}
              </p>
              <h2 className="font-display mt-6 text-xl md:text-2xl font-semibold">{profile.name}</h2>
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
          className="wireframe-panel mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 transition hover:-translate-y-0.5"
        >
          <div>
            <p className="category-tag inline-block">Compact &amp; Quiet</p>
            <h2 className="font-display mt-4 text-xl md:text-2xl font-semibold">MacOS Based Systems</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Apple Silicon Mac minis · pre-configured for local AI workloads · no GPU required
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)] sm:shrink-0">
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
      </div>
    </section>
  );
}
