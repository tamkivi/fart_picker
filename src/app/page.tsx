import { getHomeCatalogView } from "@/lib/server/catalog-service";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
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
        ? "Vali ehitusprofiil, tee ettetellimus ja saa täielikult seadistatud AI tööjaam. Komponente otsitakse Eesti kuulutustest iga päev."
        : "Choose a build profile, place a preorder, and receive a fully configured AI workstation. Parts are sourced from Estonian listings daily.",
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
    {
      key: "workstation-ai",
      name: "AI Workstation",
      target: "Threadripper / Xeon + 48GB+ VRAM",
      priority: "Maximum throughput & RAM",
    },
  ];

  const {
    gpus,
    cpus,
    ramKits,
    powerSupplies,
    cases,
    motherboards,
    storageDrives,
    cpuCoolers,
  } = getHomeCatalogView();

  return (
    <main className="min-h-screen px-6 py-16 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="stagger-in mb-14" style={{ animationDelay: "80ms" }}>
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
          <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            {copy.headingLead}
            <span className="ml-2 text-[color:var(--accent)]">{copy.headingAccent}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-[color:var(--muted)]">
            {copy.preorderDescription}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/faq"
              className="glow-pulse inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-8 py-4 text-base font-bold text-white"
            >
              Why AI-ready builds? →
            </Link>
            <Link
              href="/about"
              className="inline-block rounded-full border border-[color:var(--panel-border)] px-6 py-3 text-sm font-semibold text-[color:var(--muted)]"
            >
              About us
            </Link>
          </div>
        </header>

        <ProfileBuildsBrowser profiles={profileCards} />

        <div className="mt-14 grid items-start gap-10 md:grid-cols-2">
          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "350ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">GPU Catalog</h3>
                <span className="label-pill">{gpus.length} listed</span>
              </summary>
              <div className="space-y-6">
                {gpus.map((gpu) => (
                  <div key={gpu.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{gpu.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {gpu.brand} | {gpu.vramGb}GB VRAM | {gpu.architecture} | AI {gpu.aiScore}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{gpu.preorderPriceEur}</p>
                    <Link href={`/catalog/gpu/${gpu.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "450ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">CPU Catalog</h3>
                <span className="label-pill">{cpus.length} listed</span>
              </summary>
              <div className="space-y-6">
                {cpus.map((cpu) => (
                  <div key={cpu.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{cpu.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {cpu.brand} | {cpu.cores}C/{cpu.threads}T | {cpu.socket} | AI {cpu.aiScore}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{cpu.preorderPriceEur}</p>
                    <Link href={`/catalog/cpu/${cpu.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "620ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">RAM Kits</h3>
                <span className="label-pill">{ramKits.length} listed</span>
              </summary>
              <div className="space-y-6">
                {ramKits.map((ramKit) => (
                  <div key={ramKit.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{ramKit.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {ramKit.modules} | {ramKit.ddrGen} {ramKit.speedMtS} | {ramKit.casLatency}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">Profiles: {ramKit.profileSupport}</p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{ramKit.preorderPriceEur}</p>
                    <Link href={`/catalog/ram_kit/${ramKit.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "690ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">Motherboards</h3>
                <span className="label-pill">{motherboards.length} listed</span>
              </summary>
              <div className="space-y-6">
                {motherboards.map((motherboard) => (
                  <div key={motherboard.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{motherboard.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {motherboard.socket} | {motherboard.chipset} | {motherboard.memorySupport}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Max memory: {motherboard.maxMemoryGb}GB | PCIe Gen5: {motherboard.pcieGen5Support ? "Yes" : "No"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{motherboard.preorderPriceEur}</p>
                    <Link href={`/catalog/motherboard/${motherboard.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "760ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">Power Supplies</h3>
                <span className="label-pill">{powerSupplies.length} listed</span>
              </summary>
              <div className="space-y-6">
                {powerSupplies.map((psu) => (
                  <div key={psu.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{psu.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {psu.wattage}W | {psu.efficiencyRating} | {psu.atxStandard}
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      {psu.modularity} | 12V-2x6/PCIe5: {psu.pcie5Support ? "Supported" : "No"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{psu.preorderPriceEur}</p>
                    <Link href={`/catalog/power_supply/${psu.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "830ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">Cases</h3>
                <span className="label-pill">{cases.length} listed</span>
              </summary>
              <div className="space-y-6">
                {cases.map((pcCase) => (
                  <div key={pcCase.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{pcCase.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {pcCase.formFactor} | Max GPU: {pcCase.maxGpuMm}mm
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Radiator: {pcCase.radiatorSupport} | Fans: {pcCase.includedFans}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{pcCase.preorderPriceEur}</p>
                    <Link href={`/catalog/case/${pcCase.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "970ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">Storage Drives</h3>
                <span className="label-pill">{storageDrives.length} listed</span>
              </summary>
              <div className="space-y-6">
                {storageDrives.map((drive) => (
                  <div key={drive.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{drive.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {drive.driveType} | {drive.interface} | {drive.capacityGb}GB
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Read: {drive.seqReadMbS} MB/s | TBW: {drive.enduranceTbw === 0 ? "n/a" : drive.enduranceTbw}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{drive.preorderPriceEur}</p>
                    <Link href={`/catalog/storage_drive/${drive.id}`} className="mt-5 inline-block label-pill">View more details</Link>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="wireframe-panel p-8 stagger-in" style={{ animationDelay: "1040ms" }}>
            <details className="catalog-dropdown">
              <summary className="catalog-summary mb-8 flex cursor-pointer list-none items-center justify-between">
                <h3 className="font-display text-3xl font-semibold">CPU Coolers</h3>
                <span className="label-pill">{cpuCoolers.length} listed</span>
              </summary>
              <div className="space-y-6">
                {cpuCoolers.map((cooler) => (
                  <div key={cooler.id} className="inner-card rounded-lg border border-[color:var(--panel-border)] p-6">
                    <p className="font-semibold">{cooler.name}</p>
                    <p className="mt-2 font-mono text-xs text-[color:var(--muted)]">
                      {cooler.coolerType} | Size: {cooler.radiatorOrHeightMm}mm | Max TDP: {cooler.maxTdpW}W
                    </p>
                    <p className="font-mono text-xs text-[color:var(--muted)]">
                      Sockets: {cooler.socketSupport} | Noise: {cooler.noiseDb}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Preorder: €{cooler.preorderPriceEur}</p>
                    <Link href={`/catalog/cpu_cooler/${cooler.id}`} className="mt-5 inline-block label-pill">View more details</Link>
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
