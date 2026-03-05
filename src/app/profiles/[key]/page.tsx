import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { getHomeCatalogView } from "@/lib/server/catalog-service";
import { getRequestLanguage } from "@/lib/server/lang";

type ProfileMeta = {
  name: { en: string; et: string };
  label: { en: string; et: string };
  description: { en: string; et: string };
};

const profileMeta: Record<string, ProfileMeta> = {
  "local-llm-inference": {
    name: { en: "Local LLM Inference", et: "Kohalik LLM Inferents" },
    label: { en: "Cost-Efficient Local LLMs", et: "Kulutõhusad kohalikud LLM-id" },
    description: {
      en: "Builds optimised for running 7B–70B quantized models locally with maximum VRAM per euro.",
      et: "Ehitused, mis on optimeeritud 7B–70B kvantiseeritud mudelite kohalikuks käitamiseks maksimaalse VRAM-iga euro kohta.",
    },
  },
  "llm-finetune-starter": {
    name: { en: "LLM Fine-Tune Starter", et: "LLM Peenhäälestuse Starter" },
    label: { en: "Tuning Stability", et: "Treenimise stabiilsus" },
    description: {
      en: "Platforms with enough system RAM and stable cooling for LoRA adapters and custom training runs.",
      et: "Platvormid piisavalt süsteemi RAM-i ja stabiilse jahutusega LoRA adapterite ja kohandatud treeningute jaoks.",
    },
  },
  "hybrid-ai-gaming": {
    name: { en: "Hybrid AI + Gaming", et: "Hübriid AI + Mäng" },
    label: { en: "Multitasking", et: "Multitegumtöötlus" },
    description: {
      en: "Balanced builds for AI development during the day and high-refresh gaming at night.",
      et: "Tasakaalustatud ehitused AI arenduseks päeval ja kõrge sagedusega mängimiseks õhtul.",
    },
  },
  "workstation-ai": {
    name: { en: "AI Workstation", et: "AI Tööjaam" },
    label: { en: "Maximum Throughput", et: "Maksimaalne läbilaskevõime" },
    description: {
      en: "Threadripper and Xeon platforms with ECC RAM for multi-session inference serving and large model research.",
      et: "Threadripper ja Xeon platvormid ECC RAM-iga mitmeseansilise inferentsiteenuse ja suurte mudelite uurimiseks.",
    },
  },
  "macos-systems": {
    name: { en: "MacOS Based Systems", et: "MacOS Põhised Süsteemid" },
    label: { en: "Compact & Quiet", et: "Kompaktne ja vaikne" },
    description: {
      en: "Apple Silicon Mac minis pre-configured with Ollama, LM Studio, and local AI tooling. No GPU required.",
      et: "Apple Silicon Mac mini-d, eelseadistatud Ollama, LM Studio ja kohaliku AI tööriistadega. GPU-d pole vaja.",
    },
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

  const t = {
    back: lang === "et" ? "← Tagasi" : "← Back",
    viewMore: lang === "et" ? "Vaata lähemalt" : "View more details",
    chip: lang === "et" ? "Kiip" : "Chip",
    memory: lang === "et" ? "Mälu" : "Memory",
    storage: lang === "et" ? "Salvestus" : "Storage",
    software: lang === "et" ? "Tarkvara" : "Software",
    preorder: lang === "et" ? "Ettetellimus" : "Preorder",
    inStock: lang === "et" ? "Laos" : "In Stock",
    outOfStock: lang === "et" ? "Otsas" : "Out of Stock",
    gpu: "GPU",
    cpu: "CPU",
    ram: "RAM",
    target: lang === "et" ? "Sihitmudel" : "Target",
    estPrice: lang === "et" ? "Hinnang" : "Est.",
    andMore: lang === "et" ? "ja veel" : "and more",
    builtBy: "Built by Oaxtone ♥",
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                {t.back}
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
          <p className="label-pill mt-6 inline-block">{lang === "et" ? meta.label.et : meta.label.en}</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
            {lang === "et" ? meta.name.et : meta.name.en}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
            {lang === "et" ? meta.description.et : meta.description.en}
          </p>
        </header>

        {key === "macos-systems" ? (
          <div className="grid gap-6 md:grid-cols-3">
            {compactAiSystems.map((system) => (
              <article key={system.id} className="wireframe-panel p-6">
                <p className="font-display text-xl font-semibold">{system.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{system.vendor}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{system.bestFor}</p>
                <div className="mt-4 space-y-1 font-mono text-xs text-[color:var(--muted)]">
                  <p>{t.chip}: {system.chip}</p>
                  <p>{t.memory}: {system.memoryGb}GB unified</p>
                  <p>{t.storage}: {system.storageGb}GB SSD</p>
                  <p>
                    {t.software}:{" "}
                    {(() => {
                      const apps = system.installedSoftware.split(", ");
                      const shown = apps.slice(0, 3).join(", ");
                      return apps.length > 3 ? `${shown} ${t.andMore}` : shown;
                    })()}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">{t.preorder} €{system.preorderPriceEur}</span>
                  <span className="label-pill">{system.inStock ? t.inStock : t.outOfStock}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/catalog/compact_ai_system/${system.id}`}
                    className="rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                  >
                    {t.viewMore}
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
                  {key === "workstation-ai" && (
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{t.builtBy}</p>
                  )}
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{build.notes}</p>
                  <div className="mt-4 space-y-1 font-mono text-xs text-[color:var(--muted)]">
                    <p>{t.gpu}: {build.gpuName}</p>
                    <p>{t.cpu}: {build.cpuName}</p>
                    <p>{t.ram}: {build.ramGb}GB | {t.storage}: {build.storageGb}GB</p>
                    <p>{t.target}: {build.targetModel}</p>
                  </div>
                  <p className="mt-4 text-base font-semibold">{t.estPrice} €{build.estimatedPriceEur}</p>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/builds/${build.id}`}
                      className="rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                    >
                      {t.viewMore}
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
