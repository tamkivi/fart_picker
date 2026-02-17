import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { ThemeToggle } from "@/components/theme-toggle";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getRequestLanguage } from "@/lib/server/lang";
import { getSessionUser, getUserOrdersView } from "@/lib/server/order-service";

export default async function OrdersPage() {
  const lang = await getRequestLanguage();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = await getSessionUser(token);

  if (!user) {
    redirect("/");
  }

  const orders = await getUserOrdersView(user.id);

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

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">My Orders</h1>
          <p className="mt-3 text-sm text-[color:var(--muted)]">Track payment and build status for your preorders.</p>
        </header>

        <section className="wireframe-panel p-6">
          {orders.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No orders yet. Pick a build and complete checkout to create your first order.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <article key={order.id} className="rounded-lg border border-[color:var(--panel-border)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">Order #{order.id}</p>
                    <span className="label-pill">{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">Build: {order.buildName}</p>
                  <p className="text-sm text-[color:var(--muted)]">Amount: €{order.amountEur}</p>
                  <p className="text-xs text-[color:var(--muted)]">Created: {order.createdAt}</p>
                  {order.checkoutSessionId ? (
                    <Link
                      href={`/checkout/success?session_id=${encodeURIComponent(order.checkoutSessionId)}`}
                      className="mt-3 inline-block rounded-md bg-[color:var(--accent-2)] px-3 py-1 text-xs font-semibold text-white"
                    >
                      View payment details
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
