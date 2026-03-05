import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { getHomeCatalogView } from "@/lib/server/catalog-service";
import { getRequestLanguage } from "@/lib/server/lang";

const profileMeta: Record<string, { name: string; label: string; description: string }> = {
  "local-llm-inference": {
    name: "Local LLM Inference",
    label: "Cost-Efficient Local LLMs",
    description: "Builds optimised for running 7B–70B quantized models locally with maximum VRAM per euro.",
  },
  "llm-finetune-starter": {
    name: "LLM Fine-Tune Starter",
    label: "Tuning Stability",
    description: "Platforms with enough system RAM and stable cooling for LoRA adapters and custom training runs.",
  },
  "hybrid-ai-gaming": {
    name: "Hybrid AI + Gaming",
    label: "Multitasking",
    description: "Balanced builds for AI development during the day and high-refresh gaming at night.",
  },
  "workstation-ai": {
    name: "AI Workstation",
    label: "Maximum Throughput",
    description: "Threadripper and Xeon platforms with ECC RAM for multi-session inference serving and large model research.",
  },
  "macos-systems": {
    name: "MacOS Based Systems",
    label: "Compact & Quiet",
    description: "Apple Silicon Mac minis pre-configured with Ollama, LM Studio, and local AI tooling. No GPU required.",
  },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const lang = await getRequestLanguage();
  const { key } = await params;

  if (!profileMeta[key]) {
    notFound();
  }

  const meta = profileMeta[key];
  const { profileBuilds, compactAiSystems } = getHomeCatalogView();

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                ← Back
              </Link>
              <Link href="/faq" className="label-pill inline-block">
                FAQ
              </Link>
              <LanguageSwitch lang={lang} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>
          <p className="label-pill mt-6 inline-block">{meta.label}</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight md:text-6xl">{meta.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">{meta.description}</p>
        </header>

        {key === "macos-systems" ? (
          <div className="grid gap-6 md:grid-cols-3">
            {compactAiSystems.map((system) => (
              <article key={system.id} className="wireframe-panel p-6">
                <p className="font-display text-xl font-semibold">{system.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{system.vendor}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{system.bestFor}</p>
                <div className="mt-4 space-y-1 font-mono text-xs text-[color:var(--muted)]">
                  <p>Chip: {system.chip}</p>
                  <p>Memory: {system.memoryGb}GB unified</p>
                  <p>Storage: {system.storageGb}GB SSD</p>
                  <p>
                    Software:{" "}
                    {(() => {
                      const apps = system.installedSoftware.split(", ");
                      const shown = apps.slice(0, 3).join(", ");
                      return apps.length > 3 ? `${shown} and more` : shown;
                    })()}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">Preorder €{system.preorderPriceEur}</span>
                  <span className="label-pill">{system.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/catalog/compact_ai_system/${system.id}`}
                    className="rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    View more details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {profileBuilds
              .filter((build) => build.profileKey === key)
              .map((build) => (
                <article key={build.id} className="wireframe-panel p-6">
                  <p className="font-display text-xl font-semibold">{build.buildName}</p>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{build.notes}</p>
                  <div className="mt-4 space-y-1 font-mono text-xs text-[color:var(--muted)]">
                    <p>GPU: {build.gpuName}</p>
                    <p>CPU: {build.cpuName}</p>
                    <p>RAM: {build.ramGb}GB | Storage: {build.storageGb}GB</p>
                    <p>Target: {build.targetModel}</p>
                  </div>
                  <p className="mt-4 text-base font-semibold">Est. €{build.estimatedPriceEur}</p>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/builds/${build.id}`}
                      className="rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                    >
                      View more details
                    </Link>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}
