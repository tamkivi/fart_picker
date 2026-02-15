import { listCpus, listGpus, listPrebuilts, listProfileBuilds } from "@/lib/catalog-db";
import { AuthPanel } from "@/components/auth-panel";
import { ProfileBuildsBrowser } from "@/components/profile-builds-browser";
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

  const gpus = listGpus();
  const cpus = listCpus();
  const prebuilts = listPrebuilts();
  const profileBuilds = listProfileBuilds().map((build) => ({ ...build }));

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
            <AuthPanel />
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Pick AI-ready PC parts with
            <span className="ml-2 text-[color:var(--accent)]">LLM capability mode</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[color:var(--muted)]">
            Local SQLite-backed catalog for GPUs, CPUs, and prebuilts. This page renders live data from the database.
          </p>
        </header>

        <ProfileBuildsBrowser profiles={profileCards} builds={profileBuilds} />

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
                    {gpu.brand} | {gpu.vram_gb}GB VRAM | {gpu.architecture} | AI {gpu.ai_score}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">${gpu.price_usd}</p>
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
                    {cpu.brand} | {cpu.cores}C/{cpu.threads}T | {cpu.socket} | AI {cpu.ai_score}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">${cpu.price_usd}</p>
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
                <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">CPU: {prebuilt.cpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">GPU: {prebuilt.gpu_name}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">
                  RAM: {prebuilt.ram_gb}GB | Storage: {prebuilt.storage_gb}GB
                </p>
                <p className="font-mono text-xs text-[color:var(--muted)]">LLM fit: {prebuilt.llm_max_model_size}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">${prebuilt.price_usd}</span>
                  <span className="label-pill">{prebuilt.in_stock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
