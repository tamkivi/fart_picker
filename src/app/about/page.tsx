import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLanguage } from "@/lib/server/lang";

export default async function AboutPage() {
  const lang = await getRequestLanguage();
  const copy = {
    title: lang === "et" ? "Meist" : "About fart_picker",
    intro:
      lang === "et"
        ? "fart_picker on tehisintellekti esmane arvutiehituse planeerija kohalike LLM-töökoormuste jaoks. Üldiste mänguriarvutite soovitamise asemel seab see esikohale VRAM-i, mälureservi, ühilduvuspiirangud ja realistlikud lokaalse inferentsi ootused eri mudelisuuruste jaoks."
        : "fart_picker is an AI-first PC build planner focused on local LLM workloads. Instead of recommending generic gaming rigs, it prioritizes VRAM, memory headroom, compatibility constraints, and realistic local inference expectations for different model sizes.",
    solvesTitle: lang === "et" ? "Mida see lahendab" : "What It Solves",
    solvesItems:
      lang === "et"
        ? [
            "Seob AI töökoormuse eesmärgid praktiliste CPU/GPU/RAM/salvestus kombinatsioonidega.",
            "Kuvab iga AI-profiili all mitu ehitusvarianti koos hinnavahemiku hinnanguga.",
            "Toob ühilduvuse ja uuendustee küsimused planeerimisse varakult.",
            "Aitab vältida aladimensioneeritud masinaid LLM inferentsi ja peenhäälestuse jaoks.",
          ]
        : [
            "Maps AI workload goals to practical CPU/GPU/RAM/storage combinations.",
            "Shows multiple build options under each AI profile with estimated budgets.",
            "Surfaces compatibility and upgrade path thinking early in planning.",
            "Helps users avoid under-specced builds for LLM inference and tuning.",
          ],
    recommendationTitle: lang === "et" ? "Kuidas soovitused töötavad" : "How Recommendations Work",
    recommendationItems:
      lang === "et"
        ? [
            "Riistvara andmed lisatakse kohalikku SQLite kataloogi algandmetena.",
            "Profiilipõhised ehitusvalikud grupeeritakse kasutusjuhtumi klassi järgi.",
            "Iga ehitus sisaldab sihtmudeli vahemikku, hinnangulist hinda ja märkusi.",
            "Ehituskaardid näitavad CPU/GPU paare ja eeldatavat kohaliku kasutuse taset.",
          ]
        : [
            "Hardware specs are seeded into a local SQLite catalog.",
            "Profile-specific build options are grouped by intended workload class.",
            "Each build stores target model range, estimated cost, and notes.",
            "Build cards expose CPU/GPU pairings and expected local usage tier.",
          ],
    scopeTitle: lang === "et" ? "Projekti ulatus" : "Project Scope",
    scopeDescription:
      lang === "et"
        ? "Praegune toode on toimiv prototüüp: konto autentimine, rollipõhine admin-loogika, andmebaasipõhised komponentide kataloogid ja klikitav profiilipõhine ehituste sirvimine. Järgmised verstapostid on benchmark-ide automaatne lisamine, rikkalikumad hinnavoogud ja sügavamad ühilduvuspiirangud."
        : "The current product is a functional prototype: account auth, role-aware admin logic, database-backed part catalogs, and clickable profile build browsing. Next milestones include benchmark ingestion, richer pricing feeds, and deeper compatibility constraints.",
  };

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
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
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-4xl text-lg text-[color:var(--muted)]">{copy.intro}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">{copy.solvesTitle}</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              {copy.solvesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="wireframe-panel p-6">
            <h2 className="font-display text-3xl font-semibold">{copy.recommendationTitle}</h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              {copy.recommendationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">{copy.scopeTitle}</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">{copy.scopeDescription}</p>
        </section>
      </section>
    </main>
  );
}
