import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { PurchaseBuildButton } from "@/components/purchase-build-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getBuildDetailView } from "@/lib/server/catalog-service";
import { getRequestLanguage } from "@/lib/server/lang";

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getRequestLanguage();
  const resolvedParams = await params;
  const buildId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(buildId)) {
    notFound();
  }

  const build = getBuildDetailView(buildId);
  if (!build) {
    notFound();
  }

  const t = {
    profile: lang === "et" ? "Profiil" : "Profile",
    coreConfig: lang === "et" ? "Põhikonfiguratsioon" : "Core Configuration",
    perfPower: lang === "et" ? "Jõudlus & Võimsus" : "Performance & Power",
    buildNotes: lang === "et" ? "Ehituse märkmed" : "Build Notes",
    storage: lang === "et" ? "Salvestus" : "Storage",
    modelTarget: lang === "et" ? "Sihitmudel" : "Model target",
    throughput: lang === "et" ? "Hinnanguline läbilaskevõime" : "Estimated throughput",
    sysPower: lang === "et" ? "Hinnanguline süsteemivõimsus" : "Estimated system power",
    recPsu: lang === "et" ? "Soovitatav toiteplokk" : "Recommended PSU",
    cooling: lang === "et" ? "Jahutusprofiil" : "Cooling profile",
    estPrice: lang === "et" ? "Hinnanguline hind" : "Estimated price",
    sourceRefs: lang === "et" ? "Allikad" : "Source references",
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
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

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{build.buildName}</h1>
          <p className="mt-3 text-lg text-[color:var(--muted)]">{build.bestFor}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{t.profile}: {build.profileLabel}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">{t.coreConfig}</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>CPU: {build.cpuName}</p>
              <p>GPU: {build.gpuName}</p>
              <p>RAM: {build.ramGb}GB</p>
              <p>{t.storage}: {build.storageGb}GB</p>
              <p>{t.modelTarget}: {build.targetModel}</p>
            </div>
          </section>

          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">{t.perfPower}</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>{t.throughput}: {build.estimatedTokensPerSec}</p>
              <p>{t.sysPower}: ~{build.estimatedSystemPowerW}W</p>
              <p>{t.recPsu}: {build.recommendedPsuW}W</p>
              <p>{t.cooling}: {build.coolingProfile}</p>
              <p className="pt-2 text-base font-semibold text-[color:var(--foreground)]">{t.estPrice}: €{build.estimatedPriceEur}</p>
            </div>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">{t.buildNotes}</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{build.notes}</p>
          <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">{t.sourceRefs}: {build.sourceRefs}</p>
          <PurchaseBuildButton itemType="profile_build" itemId={build.id} priceEur={build.estimatedPriceEur} />
        </section>
      </section>
    </main>
  );
}
