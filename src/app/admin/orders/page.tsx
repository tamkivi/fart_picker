import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getAdminOrdersView, getSessionUser } from "@/lib/server/order-service";

export default async function AdminOrdersPage() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = await getSessionUser(token);

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const orders = await getAdminOrdersView();

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
              <Link href="/orders" className="label-pill inline-block">
                My Orders
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">Admin Orders</h1>
          <p className="mt-3 text-sm text-[color:var(--muted)]">Monitor all customer orders and payment lifecycle states.</p>
        </header>

        <section className="wireframe-panel p-6">
          {orders.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No orders in the system yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--panel-border)]">
                    <th className="px-2 py-2">Order</th>
                    <th className="px-2 py-2">Customer</th>
                    <th className="px-2 py-2">Build</th>
                    <th className="px-2 py-2">Amount</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-[color:var(--panel-border)]">
                      <td className="px-2 py-2">#{order.id}</td>
                      <td className="px-2 py-2">{order.userEmail}</td>
                      <td className="px-2 py-2">{order.buildName}</td>
                      <td className="px-2 py-2">€{order.amountEur}</td>
                      <td className="px-2 py-2">{order.status}</td>
                      <td className="px-2 py-2">{order.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
