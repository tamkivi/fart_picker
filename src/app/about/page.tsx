import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";

export default function AboutPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
              <Link href="/faq" className="label-pill inline-block">
                FAQ
              </Link>
            </div>
            <AuthPanel />
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">About fart_picker</h1>
          <p className="mt-4 max-w-4xl text-lg text-[color:var(--muted)]">
            fart_picker is an AI-first PC build planner focused on local LLM workloads. Instead of recommending generic
            gaming rigs, it prioritizes VRAM, memory headroom, compatibility constraints, and realistic local inference
            expectations for different model sizes.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">What It Solves</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              <li>Maps AI workload goals to practical CPU/GPU/RAM/storage combinations.</li>
              <li>Shows multiple build options under each AI profile with estimated budgets.</li>
              <li>Surfaces compatibility and upgrade path thinking early in planning.</li>
              <li>Helps users avoid under-specced builds for LLM inference and tuning.</li>
            </ul>
          </section>

          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">How Recommendations Work</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              <li>Hardware specs are seeded into a local SQLite catalog.</li>
              <li>Profile-specific build options are grouped by intended workload class.</li>
              <li>Each build stores target model range, estimated cost, and notes.</li>
              <li>Build cards expose CPU/GPU pairings and expected local usage tier.</li>
            </ul>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">Project Scope</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            The current product is a functional prototype: account auth, role-aware admin logic, database-backed part
            catalogs, and clickable profile build browsing. Next milestones include benchmark ingestion, richer pricing
            feeds, and deeper compatibility constraints.
          </p>
        </section>
      </section>
    </main>
  );
}
