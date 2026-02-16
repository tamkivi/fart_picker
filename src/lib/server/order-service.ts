import "server-only";
import {
  getOrderByCheckoutSessionForUser,
  getUserFromSessionToken,
  listAllOrdersForAdmin,
  listOrdersForUser,
  type PublicUser,
} from "@/lib/catalog-db";

export type PublicOrder = {
  id: number;
  buildName: string;
  amountEur: string;
  status: string;
  createdAt: string;
  checkoutSessionId: string | null;
};

export type PublicAdminOrder = {
  id: number;
  userEmail: string;
  buildName: string;
  amountEur: string;
  status: string;
  createdAt: string;
};

export async function getSessionUser(token: string | undefined): Promise<PublicUser | null> {
  return getUserFromSessionToken(token);
}

export async function getUserOrdersView(userId: number): Promise<PublicOrder[]> {
  const orders = await listOrdersForUser(userId);
  return orders.map((order) => ({
    id: order.id,
    buildName: order.build_name,
    amountEur: (order.amount_eur_cents / 100).toFixed(2),
    status: order.status,
    createdAt: order.created_at,
    checkoutSessionId: order.stripe_checkout_session_id,
  }));
}

export async function getAdminOrdersView(): Promise<PublicAdminOrder[]> {
  const orders = await listAllOrdersForAdmin();
  return orders.map((order) => ({
    id: order.id,
    userEmail: order.user_email,
    buildName: order.build_name,
    amountEur: (order.amount_eur_cents / 100).toFixed(2),
    status: order.status,
    createdAt: order.created_at,
  }));
}

export async function getCheckoutOrderView(userId: number, sessionId: string) {
  const order = await getOrderByCheckoutSessionForUser({ userId, checkoutSessionId: sessionId });
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    buildName: order.build_name,
    amountEur: (order.amount_eur_cents / 100).toFixed(2),
    status: order.status,
  };
}
