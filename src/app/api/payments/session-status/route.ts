import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { getOrderByCheckoutSessionForUser, getUserFromSessionToken } from "@/lib/catalog-db";

export async function GET(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserFromSessionToken(token);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ message: "Missing session_id." }, { status: 400 });
  }

  const order = getOrderByCheckoutSessionForUser({
    userId: user.id,
    checkoutSessionId: sessionId,
  });

  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      buildName: order.build_name,
      amountEur: (order.amount_eur_cents / 100).toFixed(2),
      status: order.status,
      createdAt: order.created_at,
    },
  });
}
