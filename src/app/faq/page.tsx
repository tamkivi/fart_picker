import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";

const faqs = [
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
    a: "Only gustavpaul@tamkivi.com can become ADMIN on signup, and only with ADMIN_SETUP_CODE. All other signups become USER accounts.",
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

export default function FaqPage() {
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
            </div>
            <AuthPanel />
          </div>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">FAQ</h1>
          <p className="mt-4 max-w-4xl text-lg text-[color:var(--muted)]">
            Answers to common questions about profile builds, account behavior, and database-backed recommendations.
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
