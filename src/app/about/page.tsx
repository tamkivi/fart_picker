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
        ? "fart_picker on AI-esmane arvutiehituse planeerija kohalike LLM-töökoormuste jaoks. Erinevalt üldistest mänguriarvutite soovitustest valib see komponendid VRAM-i, mälu, ühilduvuse ja jahutuse järgi — lähtuvalt mudelist, mida kavatsed käitada."
        : "fart_picker is an AI-first PC build planner for people who want to run large language models locally. Instead of adapting gaming recommendations, it selects components based on VRAM, memory, compatibility, and cooling matched to the model sizes you actually intend to run.",
    solvesTitle: lang === "et" ? "Mida see lahendab" : "What It Solves",
    solvesItems:
      lang === "et"
        ? [
            "Seob AI töökoormuse eesmärgid praktiliste riistvarakombinatsiooniega.",
            "Näitab mitu ehitusvarianti iga profiili all koos hinnangulise eelarvega.",
            "Toob ühilduvuse ja uuendustee küsimused planeerimisse varakult.",
            "Aitab vältida aladimensioneeritud masinaid LLM inferentsi ja peenhäälestuse jaoks.",
          ]
        : [
            "Matches AI workload goals to practical hardware combinations.",
            "Shows multiple build options per profile with estimated budgets.",
            "Surfaces compatibility and upgrade path decisions early in planning.",
            "Helps avoid under-specced machines for LLM inference and fine-tuning.",
          ],
    recommendationTitle: lang === "et" ? "Kuidas soovitused töötavad" : "How Recommendations Work",
    recommendationItems:
      lang === "et"
        ? [
            "Komponendid on valitud AI töökoormuste jaoks, mitte laenatud mängurisoovitustest.",
            "Ehitused on grupeeritud kasutusjuhtumi järgi — inferents, peenhäälestus või hübriid.",
            "Iga ehitus näitab, milliseid mudelisuurusi see toetab ja mida võid realistlikult oodata.",
            "Näed täielikku CPU/GPU paari, nii et midagi ei tule üllatusena.",
          ]
        : [
            "Parts are curated for AI workloads, not repurposed gaming specs.",
            "Builds are grouped by use case — local inference, fine-tuning, or hybrid.",
            "Each build shows which model sizes it supports and what you can realistically expect to run.",
            "You see the full component pairing so nothing comes as a surprise.",
          ],
    processTitle: lang === "et" ? "Kuidas protsess töötab" : "How The Process Works",
    processDescription:
      lang === "et"
        ? "Otsin Eesti turult sinu valitud ehituse jaoks kõige soodsamad komponendid, tellin need ära, komplekteerin arvuti ning paigaldan kogu vajaliku tarkvara lokaalsete mudelite käitamiseks."
        : "I find the cheapest available parts in Estonia for your selected build, order them, assemble the PC, and install all required software for running models locally.",
  };

  return (
    <main className="min-h-screen px-6 py-16 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-14 stagger-in" style={{ animationDelay: "80ms" }}>
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
          <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight md:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-[color:var(--muted)]">{copy.intro}</p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 stagger-in" style={{ animationDelay: "200ms" }}>
          <section className="wireframe-panel p-8">
            <h2 className="font-display text-2xl font-semibold">{copy.solvesTitle}</h2>
            <ul className="arrow-list mt-6 space-y-3 text-sm text-[color:var(--muted)]">
              {copy.solvesItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="wireframe-panel p-8">
            <h2 className="font-display text-2xl font-semibold">{copy.recommendationTitle}</h2>
            <ul className="arrow-list mt-6 space-y-3 text-sm text-[color:var(--muted)]">
              {copy.recommendationItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="wireframe-panel mt-8 p-8 stagger-in" style={{ animationDelay: "320ms" }}>
          <h2 className="font-display text-2xl font-semibold">{copy.processTitle}</h2>
          <p className="mt-4 max-w-2xl text-[color:var(--muted)]">{copy.processDescription}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white"
              style={{ boxShadow: "0 0 24px color-mix(in srgb, var(--accent) 45%, transparent)" }}
            >
              Browse builds →
            </Link>
            <Link href="/faq" className="label-pill inline-flex items-center px-5 py-2.5 text-sm">
              Read the FAQ
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
