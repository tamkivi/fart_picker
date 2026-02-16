import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { getProfileBuildById } from "@/lib/catalog-db";

export default async function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const buildId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(buildId)) {
    notFound();
  }

  const build = getProfileBuildById(buildId);
  if (!build) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
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

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{build.build_name}</h1>
          <p className="mt-3 text-lg text-[color:var(--muted)]">{build.best_for}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Profile: {build.profile_label}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">Core Configuration</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>CPU: {build.cpu_name}</p>
              <p>GPU: {build.gpu_name}</p>
              <p>RAM: {build.ram_gb}GB</p>
              <p>Storage: {build.storage_gb}GB</p>
              <p>Model target: {build.target_model}</p>
            </div>
          </section>

          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">Performance & Power</h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-[color:var(--muted)]">
              <p>Estimated throughput: {build.estimated_tokens_per_sec}</p>
              <p>Estimated system power: ~{build.estimated_system_power_w}W</p>
              <p>Recommended PSU: {build.recommended_psu_w}W</p>
              <p>Cooling profile: {build.cooling_profile}</p>
              <p className="pt-2 text-base font-semibold text-[color:var(--foreground)]">Estimated price: €{build.estimated_price_eur}</p>
            </div>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">Build Notes</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{build.notes}</p>
          <p className="mt-3 font-mono text-xs text-[color:var(--muted)]">Source references: {build.source_refs}</p>
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
