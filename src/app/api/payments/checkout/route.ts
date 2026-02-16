import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import {
  createPendingOrderForBuild,
  getRecentOpenOrderForBuild,
  getUserFromSessionToken,
  markOrderCheckoutCreationFailed,
  setOrderCheckoutSession,
} from "@/lib/catalog-db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function resolveBaseUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL
    ? process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`
    : null;
  const fallback = appUrl ?? vercelUrl;
  if (!fallback) {
    return null;
  }
  return new URL(fallback).origin;
}

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    const user = await getUserFromSessionToken(token);

    if (!user) {
      return NextResponse.json({ message: "Please log in before purchasing." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { buildId?: unknown } | null;
    const buildId = Number.parseInt(String(body?.buildId ?? ""), 10);
    if (!Number.isFinite(buildId) || buildId <= 0) {
      return NextResponse.json({ message: "Invalid build selection." }, { status: 400 });
    }

    const originHeader = request.headers.get("origin");
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { message: "Missing app URL configuration. Set NEXT_PUBLIC_APP_URL." },
        { status: 500 },
      );
    }

    if (originHeader) {
      let requestOrigin: string;
      try {
        requestOrigin = new URL(originHeader).origin;
      } catch {
        return NextResponse.json({ message: "Invalid request origin." }, { status: 400 });
      }
      if (requestOrigin !== baseUrl) {
        return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
      }
    }

    const stripe = getStripe();
    const reusableOrder = await getRecentOpenOrderForBuild({
      userId: user.id,
      buildId,
    });

    if (reusableOrder?.stripe_checkout_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(reusableOrder.stripe_checkout_session_id);
      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ checkoutUrl: existingSession.url, reused: true });
      }
    }

    const order = await createPendingOrderForBuild({
      userId: user.id,
      buildId,
    });

    if (!order.ok) {
      return NextResponse.json({ message: order.message }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email,
      billing_address_collection: "auto",
      submit_type: "pay",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: order.amountEurCents,
            product_data: {
              name: order.buildName,
              description: "AI build preorder (assembled and configured after purchase)",
            },
          },
        },
      ],
      metadata: {
        order_id: String(order.orderId),
        user_id: String(user.id),
        profile_build_id: String(buildId),
      },
      client_reference_id: String(order.orderId),
    }, {
      idempotencyKey: `checkout_order_${order.orderId}`,
    });

    if (!session.id || !session.url) {
      await markOrderCheckoutCreationFailed(order.orderId);
      return NextResponse.json({ message: "Failed to create payment session." }, { status: 502 });
    }

    await setOrderCheckoutSession({
      orderId: order.orderId,
      checkoutSessionId: session.id,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout initialization failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
