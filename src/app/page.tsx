import { getHomeCatalogView } from "@/lib/server/catalog-service";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { ProfileBuildsBrowser } from "@/components/profile-builds-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLanguage } from "@/lib/server/lang";
import Link from "next/link";

export const revalidate = 3600;

export default async function Home() {
  const lang = await getRequestLanguage();
  const copy = {
    headingLead: lang === "et" ? "Vali AI-valmis PC komponendid koos" : "Pick AI-ready PC parts with",
    headingAccent: lang === "et" ? "LLM võimekusreziimiga" : "LLM capability mode",
    preorderDescription:
      lang === "et"
        ? "See on ettetellimuse sait. Iga tellimus ehitatakse, komplekteeritakse ja seadistatakse täielikult pärast ostu vastavalt valitud ehitusprofiilile."
        : "This is a preorder site. Every order is built, assembled, and fully configured after purchase based on your selected build profile.",
    pricingDescription:
      lang === "et"
        ? "Hinnad arvutatakse iga päev ümber Eesti kuulutuste põhjal ning sisaldavad 15% komplekteerimise ja seadistamise marginaali."
        : "Prices are recalculated daily from Estonian listings and include a 15% assembly/setup margin.",
  };

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

  const {
    gpus,
    cpus,
    prebuilts,
    ramKits,
    powerSupplies,
    cases,
    motherboards,
    compactAiSystems,
    storageDrives,
    cpuCoolers,
    profileBuilds,
  } = getHomeCatalogView();
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
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/about" className="label-pill inline-block">
                About
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
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            {copy.headingLead}
            <span className="ml-2 text-[color:var(--accent)]">{copy.headingAccent}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[color:var(--muted)]">
            {copy.preorderDescription}
          </p>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--muted)]">
            {copy.pricingDescription}
          </p>
        </header>

        <ProfileBuildsBrowser profiles={profileCards} builds={browserBuilds} />

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
                  <span className="font-semibold">Preorder €{prebuilt.preorderPriceEur}</span>
                  <span className="label-pill">{prebuilt.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="wireframe-panel mt-6 p-6 stagger-in" style={{ animationDelay: "900ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-3xl font-semibold">Compact AI Systems (Mac mini)</h3>
            <span className="label-pill">{compactAiSystems.length} listed</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {compactAiSystems.map((system) => (
              <article key={system.id} className="rounded-lg border border-[color:var(--panel-border)] p-4">
                <p className="font-display text-xl font-semibold">{system.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{system.vendor}</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">{system.bestFor}</p>
                <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">Chip: {system.chip}</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">Memory: {system.memoryGb}GB unified</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">Storage: {system.storageGb}GB SSD</p>
                <p className="font-mono text-xs text-[color:var(--muted)]">Software: {system.installedSoftware}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">Preorder €{system.preorderPriceEur}</span>
                  <span className="label-pill">{system.inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "350ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">GPU Catalog</h3>
                <span className="label-pill">{gpus.length} listed</span>
              </summary>
              <div className="space-y-3">
                {gpus.map((gpu) => (
                  <div key={gpu.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{gpu.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {gpu.brand} | {gpu.vramGb}GB VRAM | {gpu.architecture} | AI {gpu.aiScore}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{gpu.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "450ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">CPU Catalog</h3>
                <span className="label-pill">{cpus.length} listed</span>
              </summary>
              <div className="space-y-3">
                {cpus.map((cpu) => (
                  <div key={cpu.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{cpu.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {cpu.brand} | {cpu.cores}C/{cpu.threads}T | {cpu.socket} | AI {cpu.aiScore}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{cpu.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "620ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">RAM Kits</h3>
                <span className="label-pill">{ramKits.length} listed</span>
              </summary>
              <div className="space-y-3">
                {ramKits.map((ramKit) => (
                  <div key={ramKit.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{ramKit.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {ramKit.modules} | {ramKit.ddrGen} {ramKit.speedMtS} | {ramKit.casLatency}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">Profiles: {ramKit.profileSupport}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{ramKit.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "690ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">Motherboards</h3>
                <span className="label-pill">{motherboards.length} listed</span>
              </summary>
              <div className="space-y-3">
                {motherboards.map((motherboard) => (
                  <div key={motherboard.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{motherboard.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {motherboard.socket} | {motherboard.chipset} | {motherboard.memorySupport}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Max memory: {motherboard.maxMemoryGb}GB | PCIe Gen5: {motherboard.pcieGen5Support ? "Yes" : "No"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{motherboard.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "760ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">Power Supplies</h3>
                <span className="label-pill">{powerSupplies.length} listed</span>
              </summary>
              <div className="space-y-3">
                {powerSupplies.map((psu) => (
                  <div key={psu.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{psu.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {psu.wattage}W | {psu.efficiencyRating} | {psu.atxStandard}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      {psu.modularity} | 12V-2x6/PCIe5: {psu.pcie5Support ? "Supported" : "No"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{psu.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "830ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">Cases</h3>
                <span className="label-pill">{cases.length} listed</span>
              </summary>
              <div className="space-y-3">
                {cases.map((pcCase) => (
                  <div key={pcCase.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{pcCase.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {pcCase.formFactor} | Max GPU: {pcCase.maxGpuMm}mm
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Radiator: {pcCase.radiatorSupport} | Fans: {pcCase.includedFans}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{pcCase.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "970ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">Storage Drives</h3>
                <span className="label-pill">{storageDrives.length} listed</span>
              </summary>
              <div className="space-y-3">
                {storageDrives.map((drive) => (
                  <div key={drive.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{drive.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {drive.driveType} | {drive.interface} | {drive.capacityGb}GB
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Read: {drive.seqReadMbS} MB/s | TBW: {drive.enduranceTbw === 0 ? "n/a" : drive.enduranceTbw}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{drive.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "1040ms" }}>
            <details open>
              <summary className="mb-4 flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-3xl font-semibold">CPU Coolers</h3>
                <span className="label-pill">{cpuCoolers.length} listed</span>
              </summary>
              <div className="space-y-3">
                {cpuCoolers.map((cooler) => (
                  <div key={cooler.id} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                    <p className="font-semibold">{cooler.name}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
                      {cooler.coolerType} | Size: {cooler.radiatorOrHeightMm}mm | Max TDP: {cooler.maxTdpW}W
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Sockets: {cooler.socketSupport} | Noise: {cooler.noiseDb}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{cooler.preorderPriceEur}</p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

      </section>
    </main>
  );
}
