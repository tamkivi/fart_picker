import { getHomeCatalogView } from "@/lib/server/catalog-service";
import { AuthPanel } from "@/components/auth-panel";
import { ProfileBuildsBrowser } from "@/components/profile-builds-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  const profileCards = [
    {
      key: "local-llm-inference",
      name: "Local LLM Inference",
      target: "7B-70B quantized models",
      priority: "Max VRAM per dollar",
    },
    {
      key: "llm-finetune-starter",
      name: "LLM Fine-Tune Starter",
      target: "LoRA and adapter tuning",
      priority: "RAM + cooling stability",
    },
    {
      key: "hybrid-ai-gaming",
      name: "Hybrid AI + Gaming",
      target: "Daytime dev, nighttime play",
      priority: "Balanced CPU/GPU spend",
    },
  ];

  const { gpus, cpus, prebuilts, profileBuilds } = getHomeCatalogView();
  const browserBuilds = profileBuilds.map((build) => ({
    id: build.id,
    profile_key: build.profileKey,
    build_name: build.buildName,
    target_model: build.targetModel,
    ram_gb: build.ramGb,
    storage_gb: build.storageGb,
    estimated_price_eur: build.estimatedPriceEur,
    best_for: build.bestFor,
    estimated_tokens_per_sec: build.estimatedTokensPerSec,
    estimated_system_power_w: build.estimatedSystemPowerW,
    recommended_psu_w: build.recommendedPsuW,
    cooling_profile: build.coolingProfile,
    notes: build.notes,
    source_refs: build.sourceRefs,
    cpu_name: build.cpuName,
    gpu_name: build.gpuName,
    profile_label: build.profileLabel,
  }));

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="stagger-in mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/about" className="label-pill inline-block">
                About
              </Link>
              <Link href="/faq" className="label-pill inline-block">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Pick AI-ready PC parts with
            <span className="ml-2 text-[color:var(--accent)]">LLM capability mode</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[color:var(--muted)]">
            This is a preorder site. Every order is built, assembled, and fully configured after purchase based on
            your selected build profile.
          </p>
        </header>

        <ProfileBuildsBrowser profiles={profileCards} builds={browserBuilds} />

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "350ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-3xl font-semibold">GPU Catalog</h3>
              <span className="label-pill">{gpus.length} listed</span>
            </div>
            <div className="space-y-3">
              {gpus.map((gpu) => (
                <div key={gpu.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                  <p className="font-semibold">{gpu.name}</p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                    {gpu.brand} | {gpu.vramGb}GB VRAM | {gpu.architecture} | AI {gpu.aiScore}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">€{gpu.priceEur}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "450ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-3xl font-semibold">CPU Catalog</h3>
              <span className="label-pill">{cpus.length} listed</span>
            </div>
            <div className="space-y-3">
              {cpus.map((cpu) => (
                <div key={cpu.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                  <p className="font-semibold">{cpu.name}</p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                    {cpu.brand} | {cpu.cores}C/{cpu.threads}T | {cpu.socket} | AI {cpu.aiScore}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">€{cpu.priceEur}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6 stagger-in" style={{ animationDelay: "550ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-3xl font-semibold">Prebuilt Catalog</h3>
            <span className="label-pill">{prebuilts.length} listed</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {prebuilts.map((prebuilt) => (
              <article key={prebuilt.id} className="rounded-lg border border-[color:var(--panel-border)] p-4">
                <p className="font-display text-xl font-semibold">{prebuilt.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{prebuilt.vendor}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{prebuilt.description}</p>
                <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">CPU: {prebuilt.cpuName}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">GPU: {prebuilt.gpuName}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">
                  RAM: {prebuilt.ramGb}GB | Storage: {prebuilt.storageGb}GB
                </p>
                <p className="font-mono text-xs text-[color:var(--muted)]">LLM fit: {prebuilt.llmMaxModelSize}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">€{prebuilt.priceEur}</span>
                  <span className="label-pill">{prebuilt.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
