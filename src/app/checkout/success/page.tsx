import Link from "next/link";
import { cookies } from "next/headers";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getOrderByCheckoutSessionForUser, getUserFromSessionToken } from "@/lib/catalog-db";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserFromSessionToken(token);

  const order = user && sessionId
    ? await getOrderByCheckoutSessionForUser({ userId: user.id, checkoutSessionId: sessionId })
    : null;

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-3xl wireframe-panel p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="label-pill inline-block">Home</Link>
            <Link href="/about" className="label-pill inline-block">About</Link>
            <Link href="/faq" className="label-pill inline-block">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthPanel />
          </div>
        </div>

        <h1 className="font-display text-4xl font-semibold">Payment Submitted</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Your preorder has been received. We will build and configure your system after payment confirmation.
        </p>

        {order ? (
          <div className="mt-5 rounded-lg border border-[color:var(--panel-border)] p-4">
            <p className="font-semibold">Order #{order.id}</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">Build: {order.build_name}</p>
            <p className="text-sm text-[color:var(--muted)]">Amount: €{(order.amount_eur_cents / 100).toFixed(2)}</p>
            <p className="text-sm text-[color:var(--muted)]">Status: {order.status}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Order details are not available in this session.</p>
        )}

        <div className="mt-6">
          <Link href="/" className="label-pill inline-block">Back to builds</Link>
        </div>
      </section>
    </main>
  );
}
