import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import {
  getOrderByCheckoutSessionForUser,
  getUserFromSessionToken,
  markOrderCanceledFromCheckoutSession,
  markOrderFailedFromCheckoutSession,
  markOrderPaidFromCheckoutSession,
} from "@/lib/catalog-db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserFromSessionToken(token);

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ message: "Missing session_id." }, { status: 400 });
  }

  const order = await getOrderByCheckoutSessionForUser({
    userId: user.id,
    checkoutSessionId: sessionId,
  });

  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  let session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ message: "Unable to verify payment session." }, { status: 502 });
  }
  const metadataUserId = Number.parseInt(session.metadata?.user_id ?? "", 10);
  if (!Number.isFinite(metadataUserId) || metadataUserId !== user.id) {
    return NextResponse.json({ message: "Session ownership mismatch." }, { status: 403 });
  }

  if (session.payment_status === "paid") {
    await markOrderPaidFromCheckoutSession({
      checkoutSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    });
  } else if (session.status === "expired") {
    await markOrderCanceledFromCheckoutSession(session.id);
  } else if (session.payment_status === "unpaid" && session.status === "complete") {
    await markOrderFailedFromCheckoutSession({
      checkoutSessionId: session.id,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    });
  }

  const refreshed = await getOrderByCheckoutSessionForUser({
    userId: user.id,
    checkoutSessionId: sessionId,
  });

  return NextResponse.json({
    order: {
      id: (refreshed ?? order).id,
      buildName: (refreshed ?? order).build_name,
      amountEur: ((refreshed ?? order).amount_eur_cents / 100).toFixed(2),
      status: (refreshed ?? order).status,
      createdAt: (refreshed ?? order).created_at,
    },
  });
}
