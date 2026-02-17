"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

  useEffect(() => {
    if (activeProfileKey) {
      possibleBuildsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeProfileKey]);

  return (
    <section className="mt-8">
      <p className="mb-4 text-sm font-semibold text-[color:var(--muted)]">
        Choose the type of build you&apos;re looking for:
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {profiles.map((profile, index) => {
          const isActive = activeProfileKey === profile.key;
          return (
            <button
              key={profile.key}
              type="button"
              onClick={() => {
                setActiveProfileKey(profile.key);
                setSelectedBuildId(buildsByProfile[profile.key]?.[0]?.id ?? null);
              }}
              className={`wireframe-panel stagger-in p-5 text-left transition ${isActive ? "ring-2 ring-[color:var(--accent)]" : "hover:-translate-y-0.5"}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="label-pill inline-block">
                {categoryLabelByProfileKey[profile.key] ?? "Build Category"}
              </p>
              <h2 className="font-display mt-4 text-2xl font-semibold">{profile.name}</h2>
              <p className="mt-3 font-[Helvetica] text-sm text-[color:var(--muted)]">Target: {profile.target}</p>
              <p className="mt-2 font-mono text-sm text-[color:var(--muted)]">Priority: {profile.priority}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">
                {isActive ? "Selected" : "Click to view builds"}
              </p>
            </button>
          );
        })}
      </div>

      <section ref={possibleBuildsRef} className="wireframe-panel mt-10 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
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
          <div className="grid gap-4 md:grid-cols-3">
            {activeBuilds.map((build) => (
              <article
                key={build.id}
                className={`rounded-lg border p-4 text-left transition ${selectedBuild?.id === build.id ? "border-[color:var(--accent)] ring-1 ring-[color:var(--accent)]" : "border-[color:var(--panel-border)] hover:-translate-y-0.5"}`}
                onClick={() => setSelectedBuildId(build.id)}
              >
                <p className="font-display text-xl font-semibold">{build.build_name}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{build.notes}</p>
                <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">GPU: {build.gpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">CPU: {build.cpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">
                  RAM: {build.ram_gb}GB | Storage: {build.storage_gb}GB
                </p>
                <p className="font-mono text-xs text-[color:var(--muted)]">Model target: {build.target_model}</p>
                <p className="mt-3 text-base font-semibold">Est. €{build.estimated_price_eur}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
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
