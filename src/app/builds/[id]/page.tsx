import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
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

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
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

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{build.buildName}</h1>
          <p className="mt-3 text-lg text-[color:var(--muted)]">{build.bestFor}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Profile: {build.profileLabel}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">Core Configuration</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>CPU: {build.cpuName}</p>
              <p>GPU: {build.gpuName}</p>
              <p>RAM: {build.ramGb}GB</p>
              <p>Storage: {build.storageGb}GB</p>
              <p>Model target: {build.targetModel}</p>
            </div>
          </section>

          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">Performance & Power</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>Estimated throughput: {build.estimatedTokensPerSec}</p>
              <p>Estimated system power: ~{build.estimatedSystemPowerW}W</p>
              <p>Recommended PSU: {build.recommendedPsuW}W</p>
              <p>Cooling profile: {build.coolingProfile}</p>
              <p className="pt-2 text-base font-semibold text-[color:var(--foreground)]">Estimated price: €{build.estimatedPriceEur}</p>
            </div>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">Build Notes</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{build.notes}</p>
          <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">Source references: {build.sourceRefs}</p>
          <PurchaseBuildButton buildId={build.id} priceEur={build.estimatedPriceEur} />
          <div className="mt-5">
            <Link href="/" className="label-pill inline-block">
              Back to build profiles
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
