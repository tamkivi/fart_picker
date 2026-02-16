import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRequestLanguage } from "@/lib/server/lang";

export default async function CheckoutCancelPage() {
  const lang = await getRequestLanguage();

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-3xl wireframe-panel p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="label-pill inline-block">Home</Link>
            <Link href="/about" className="label-pill inline-block">About</Link>
            <Link href="/faq" className="label-pill inline-block">FAQ</Link>
            <LanguageSwitch lang={lang} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthPanel />
          </div>
        </div>

        <h1 className="font-display text-4xl font-semibold">Checkout Canceled</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          No payment was captured. You can return to the build page and start checkout again at any time.
        </p>

        <div className="mt-6">
          <Link href="/" className="label-pill inline-block">Back to builds</Link>
        </div>
      </section>
    </main>
  );
}
