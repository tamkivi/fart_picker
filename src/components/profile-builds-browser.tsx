"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type Profile = {
  key: string;
  name: string;
  target: string;
  priority: string;
};

type ProfileBuild = {
  id: number;
  profile_key: string;
  build_name: string;
  target_model: string;
  ram_gb: number;
  storage_gb: number;
  estimated_price_eur: number;
  best_for: string;
  estimated_tokens_per_sec: string;
  estimated_system_power_w: number;
  recommended_psu_w: number;
  cooling_profile: string;
  notes: string;
  source_refs: string;
  cpu_name: string;
  gpu_name: string;
};

const categoryLabelByProfileKey: Record<string, string> = {
  "local-llm-inference": "Cost-Efficient Local LLMs",
  "llm-finetune-starter": "Tuning Stability",
  "hybrid-ai-gaming": "Multitasking",
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

export function ProfileBuildsBrowser({
  profiles,
  builds,
}: {
  profiles: Profile[];
  builds: ProfileBuild[];
}) {
  const [activeProfileKey, setActiveProfileKey] = useState(profiles[0]?.key ?? "");
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
  const possibleBuildsRef = useRef<HTMLElement | null>(null);
  const profileCardsRef = useRef<HTMLDivElement | null>(null);

  const buildsByProfile = useMemo(() => {
    return builds.reduce<Record<string, ProfileBuild[]>>((acc, build) => {
      if (!acc[build.profile_key]) {
        acc[build.profile_key] = [];
      }
      acc[build.profile_key].push(build);
      return acc;
    }, {});
  }, [builds]);

  const activeBuilds = buildsByProfile[activeProfileKey] ?? [];
  const activeProfile = profiles.find((profile) => profile.key === activeProfileKey);
  const selectedBuild =
    activeBuilds.find((build) => build.id === selectedBuildId) ?? (activeBuilds.length > 0 ? activeBuilds[0] : null);

  return (
    <section className="mt-32">
      <div className="flex justify-center mb-16">
        <button
          type="button"
          onClick={() => {
            if (profileCardsRef.current) slowScrollTo(profileCardsRef.current);
          }}
          className="rounded-2xl border-2 border-[color:var(--accent)] px-10 py-5 text-center font-semibold transition hover:-translate-y-0.5"
          style={{ boxShadow: "0 0 32px color-mix(in srgb, var(--accent) 25%, transparent)" }}
        >
          <span className="font-display block text-xl">Show me the different kinds of builds!</span>
          <span className="mt-1 block text-sm text-[color:var(--muted)]">
            Local inference · Fine-tuning · Hybrid AI + Gaming
          </span>
        </button>
      </div>

      <p className="mb-6 text-sm font-semibold text-[color:var(--muted)]">
        Choose the type of build you&apos;re looking for:
      </p>
      <div ref={profileCardsRef} className="grid gap-8 md:grid-cols-3">
        {profiles.map((profile, index) => {
          const isActive = activeProfileKey === profile.key;
          return (
            <button
              key={profile.key}
              type="button"
              onClick={() => {
                setActiveProfileKey(profile.key);
                setSelectedBuildId(buildsByProfile[profile.key]?.[0]?.id ?? null);
                requestAnimationFrame(() => {
                  const el = possibleBuildsRef.current;
                  if (!el) return;
                  if (el.getBoundingClientRect().top > window.innerHeight) {
                    slowScrollTo(el);
                  }
                });
              }}
              className={`wireframe-panel stagger-in p-7 text-left transition ${isActive ? "ring-2 ring-[color:var(--accent)]" : "hover:-translate-y-0.5"}`}
              style={{
                animationDelay: `${index * 100}ms`,
                ...(isActive ? { background: "color-mix(in srgb, var(--accent) 8%, var(--panel))" } : {}),
              }}
            >
              <p
                className="label-pill inline-block"
                style={isActive ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" } : {}}
              >
                {categoryLabelByProfileKey[profile.key] ?? "Build Category"}
              </p>
              <h2 className="font-display mt-6 text-2xl font-semibold">{profile.name}</h2>
              <p className="mt-4 font-[Helvetica] text-sm text-[color:var(--muted)]">Target: {profile.target}</p>
              <p className="mt-3 font-mono text-sm text-[color:var(--muted)]">Priority: {profile.priority}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">
                {isActive ? "↳ Selected" : "Click to view builds"}
              </p>
            </button>
          );
        })}
      </div>

      <section ref={possibleBuildsRef} className="wireframe-panel mt-20 p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl font-semibold">Possible Builds</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Selected category: {activeProfile?.name ?? "None"}
            </p>
          </div>
          <span className="label-pill">{activeBuilds.length} options</span>
        </div>

        {activeBuilds.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No builds available for this profile yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {activeBuilds.map((build) => (
              <article
                key={build.id}
                className={`rounded-lg border p-6 text-left transition ${selectedBuild?.id === build.id ? "border-[color:var(--accent)] ring-1 ring-[color:var(--accent)]" : "border-[color:var(--panel-border)] hover:-translate-y-0.5"}`}
                onClick={() => setSelectedBuildId(build.id)}
              >
                <p className="font-display text-xl font-semibold">{build.build_name}</p>
                <p className="mt-3 text-sm text-[color:var(--muted)]">{build.notes}</p>
                <p className="mt-5 font-mono text-xs text-[color:var(--muted)]">GPU: {build.gpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">CPU: {build.cpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">
                  RAM: {build.ram_gb}GB | Storage: {build.storage_gb}GB
                </p>
                <p className="font-mono text-xs text-[color:var(--muted)]">Model target: {build.target_model}</p>
                <p className="mt-5 text-base font-semibold">Est. €{build.estimated_price_eur}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">
                    {selectedBuild?.id === build.id ? "Selected build" : "Click to select"}
                  </p>
                  <Link
                    href={`/builds/${build.id}`}
                    className="rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                    onClick={(event) => event.stopPropagation()}
                  >
                    View More Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
