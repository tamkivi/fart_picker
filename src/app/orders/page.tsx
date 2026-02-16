import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getUserFromSessionToken, listOrdersForUser } from "@/lib/catalog-db";

export default async function OrdersPage() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserFromSessionToken(token);

  if (!user) {
    redirect("/");
  }

  const orders = listOrdersForUser(user.id);

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
                  <p className="mt-2 text-sm text-[color:var(--muted)]">Build: {order.build_name}</p>
                  <p className="text-sm text-[color:var(--muted)]">Amount: €{(order.amount_eur_cents / 100).toFixed(2)}</p>
                  <p className="text-xs text-[color:var(--muted)]">Created: {order.created_at}</p>
                  {order.stripe_checkout_session_id ? (
                    <Link
                      href={`/checkout/success?session_id=${encodeURIComponent(order.stripe_checkout_session_id)}`}
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
