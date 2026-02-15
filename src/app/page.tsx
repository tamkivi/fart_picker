export default function Home() {
  const profileCards = [
    {
      name: "Local LLM Inference",
      target: "7B-70B quantized models",
      priority: "Max VRAM per dollar",
    },
    {
      name: "LLM Fine-Tune Starter",
      target: "LoRA and adapter tuning",
      priority: "RAM + cooling stability",
    },
    {
      name: "Hybrid AI + Gaming",
      target: "Daytime dev, nighttime play",
      priority: "Balanced CPU/GPU spend",
    },
  ];

  const parts = [
    { slot: "GPU", pick: "RTX 4080 SUPER 16GB", score: "A+", note: "Strong local inference" },
    { slot: "CPU", pick: "Ryzen 9 7900", score: "A", note: "Great perf-per-watt" },
    { slot: "RAM", pick: "64GB DDR5-6000", score: "A+", note: "Fits 13B+ workflows" },
    { slot: "Storage", pick: "2TB Gen4 NVMe", score: "A", note: "Fast model loading" },
    { slot: "PSU", pick: "850W Gold ATX 3.0", score: "A", note: "Transient-safe for GPUs" },
  ];

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="stagger-in mb-8">
          <p className="label-pill inline-block">fart_picker wireframes</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Pick AI-ready PC parts with
            <span className="ml-2 text-[color:var(--accent)]">LLM capability mode</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[color:var(--muted)]">
            Early product layout for the core builder flow: profile selection, parts scoring, compatibility validation,
            and model-size readiness output.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {profileCards.map((profile, index) => (
            <article
              key={profile.name}
              className="wireframe-panel stagger-in p-5"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="label-pill inline-block">AI Build Profile</p>
              <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
              <p className="mt-3 font-mono text-sm text-[color:var(--muted)]">Target: {profile.target}</p>
              <p className="mt-2 font-mono text-sm text-[color:var(--muted)]">Priority: {profile.priority}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "350ms" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Parts Selection</h3>
              <span className="label-pill">Budget: $1,800</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="font-mono text-xs uppercase text-[color:var(--muted)]">
                    <th className="border-b border-[color:var(--panel-border)] p-3">Slot</th>
                    <th className="border-b border-[color:var(--panel-border)] p-3">Recommended Part</th>
                    <th className="border-b border-[color:var(--panel-border)] p-3">AI Score</th>
                    <th className="border-b border-[color:var(--panel-border)] p-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => (
                    <tr key={part.slot}>
                      <td className="border-b border-[color:var(--panel-border)] p-3 font-medium">{part.slot}</td>
                      <td className="border-b border-[color:var(--panel-border)] p-3">{part.pick}</td>
                      <td className="border-b border-[color:var(--panel-border)] p-3 font-mono">{part.score}</td>
                      <td className="border-b border-[color:var(--panel-border)] p-3 text-[color:var(--muted)]">
                        {part.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "450ms" }}>
            <h3 className="text-2xl font-semibold">Compatibility</h3>
            <ul className="mt-4 space-y-3 font-mono text-sm">
              <li className="rounded-lg border border-[color:var(--panel-border)] p-3">CPU socket: AM5 matches board</li>
              <li className="rounded-lg border border-[color:var(--panel-border)] p-3">PSU headroom: 31% spare at spike</li>
              <li className="rounded-lg border border-[color:var(--panel-border)] p-3">GPU clearance: 8mm margin in case</li>
              <li className="rounded-lg border border-[color:var(--panel-border)] p-3">Thermals: add 2 top exhaust fans</li>
            </ul>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "550ms" }}>
            <h3 className="text-2xl font-semibold">LLM Capability Mode</h3>
            <div className="mt-4 grid gap-4 font-mono text-sm">
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3">Estimated model fit: up to 34B (4-bit)</p>
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3">Expected throughput: 35-62 tok/s (13B q4)</p>
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3">Suggested runtimes: Ollama, llama.cpp, vLLM</p>
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3">Risk: context length over 16k may become RAM-bound</p>
            </div>
          </section>

          <section className="wireframe-panel p-6 stagger-in" style={{ animationDelay: "650ms" }}>
            <h3 className="text-2xl font-semibold">Saved Build Snapshot</h3>
            <div className="mt-4 space-y-4">
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3 font-mono text-sm">
                Build name: Budget Local LLM Box v1
              </p>
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3 font-mono text-sm">Total: $1,786</p>
              <p className="rounded-lg border border-[color:var(--panel-border)] p-3 font-mono text-sm">
                Upgrade path: move to 24GB VRAM GPU for 70B q4 workflows
              </p>
              <button className="w-full rounded-lg bg-[color:var(--accent-2)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                Export Build + Capability Report
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
