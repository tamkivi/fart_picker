import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLanguage } from "@/lib/server/lang";

export default async function FaqPage() {
  const lang = await getRequestLanguage();
  const faqs =
    lang === "et"
      ? [
          {
            q: "Kuidas ma ehitusprofiile kasutan?",
            a: "Vali avalehel üks AI-profiil. Iga profiili all on andmebaasist mitu eelseadistatud ehitusvarianti, mis on häälestatud konkreetse töökoormuse jaoks.",
          },
          {
            q: "Miks mõned ehitused maksavad oodatust rohkem?",
            a: "Ehituste hinnad on hinnangulised kogusummad, mis põhinevad valitud komponentidel ja profiili eesmärgil. Need ei ole reaalajas poe hinnapakkumised.",
          },
          {
            q: "Kas ma saan rohkem ehitusvariante lisada?",
            a: "Jah. Lisa read profile_builds tabelisse ja seotud CPU/GPU read andmebaasi ning värskenda lehte.",
          },
          {
            q: "Kas ehituste sirvimiseks on kontot vaja?",
            a: "Ei. Sirvimine on avalik. Kontod on mõeldud profiiliga seotud funktsioonide ja tulevaste personaalsemate võimaluste jaoks.",
          },
        ]
      : [
          {
            q: "How do I use the build profiles?",
            a: "Pick one of the AI profiles on the home page. Each profile has multiple preloaded build options from the database, tuned for that workload style.",
          },
          {
            q: "Why do some builds cost more than expected?",
            a: "Build costs are estimated totals based on configured parts and profile intent. They are not live retailer quotes unless pricing integration is added.",
          },
          {
            q: "Can I add more build options?",
            a: "Yes. Add rows to the profile_builds table and related CPU/GPU rows in data/catalog.db, then refresh the page.",
          },
          {
            q: "Do I need an account to browse builds?",
            a: "No. Browsing is public. Accounts are for profile identity and future personalized features.",
          },
        ];

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
              <Link href="/about" className="label-pill inline-block">
                About
              </Link>
              <LanguageSwitch lang={lang} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">FAQ</h1>
          <p className="mt-4 max-w-4xl text-lg text-[color:var(--muted)]">
            {lang === "et"
              ? "Vastused levinud küsimustele profiiliehituste, hinnastuse ja kohaliku AI-arenduse kohta."
              : "Answers to common questions about build profiles, pricing, and local AI workflows."}
          </p>
        </header>

        <div className="space-y-4">
          <section
            className="wireframe-panel border-2 border-[color:var(--accent)] p-7 md:p-8"
            style={{
              boxShadow:
                "0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 18px rgba(255, 0, 120, 0.12), 0 0 24px rgba(0, 180, 255, 0.1), 0 0 30px rgba(120, 255, 120, 0.1)",
            }}
          >
            <h2 className="font-display text-2xl font-semibold">Why AI builds?</h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              {lang === "et"
                ? "Kohalikuks AI-ks ehitatud arvuti annab sulle suurema privaatsuse, sest andmed ei lahku sinu masinast, ning väiksema viiteaja igapäevaseks arenduseks. Spetsiaalselt valitud VRAM, mälu, salvestus ja toite-/jahutusvaru aitavad hoida mudelid stabiilselt töös ka pikemate sessioonide ajal ning jätavad ruumi tulevasteks uuendusteks."
                : "A PC built for local AI gives you better privacy because your data stays on your machine, and lower latency for day-to-day development. Matching VRAM, memory, storage, PSU headroom, and cooling to model workloads keeps inference stable during long sessions and leaves room for future upgrades."}
            </p>
          </section>
          {faqs.map((item) => (
            <section key={item.q} className="wireframe-panel p-6">
              <h2 className="font-display text-2xl font-semibold">{item.q}</h2>
              <p className="mt-3 text-sm text-[color:var(--muted)]">{item.a}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
