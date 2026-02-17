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
            q: "Kust riistvara andmed tulevad?",
            a: "Rakendus lisab kohaliku kataloogi andmed avalike tootjaspetsifikatsioonide põhjal ja teenindab neid kirjeid SQLite kaudu. Kohandatud kirjeid saad lisada andmebaasi otse.",
          },
          {
            q: "Kuidas admin-konto määratakse?",
            a: "Admin-konto registreerimiseks on vaja ADMIN_SETUP_CODE väärtust. Tavalised registreerimised saavad USER rolli.",
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
            q: "Where does the hardware data come from?",
            a: "The app seeds local catalog data using public vendor spec references and then serves those records from SQLite. You can edit the DB directly for custom entries.",
          },
          {
            q: "How is the admin account determined?",
            a: "Admin signup requires ADMIN_SETUP_CODE. Standard signups become USER accounts.",
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
              ? "Vastused levinud küsimustele profiiliehituste, kontokäitumise ja andmebaasipõhiste soovituste kohta."
              : "Answers to common questions about profile builds, account behavior, and database-backed recommendations."}
          </p>
        </header>

        <div className="space-y-4">
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
