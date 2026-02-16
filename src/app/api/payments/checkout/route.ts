import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";
import { createPendingOrderForBuild, getUserFromSessionToken, setOrderCheckoutSession } from "@/lib/catalog-db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    const user = getUserFromSessionToken(token);

    if (!user) {
      return NextResponse.json({ message: "Please log in before purchasing." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { buildId?: unknown } | null;
    const buildId = Number.parseInt(String(body?.buildId ?? ""), 10);
    if (!Number.isFinite(buildId) || buildId <= 0) {
      return NextResponse.json({ message: "Invalid build selection." }, { status: 400 });
    }

    const order = createPendingOrderForBuild({
      userId: user.id,
      buildId,
    });

    if (!order.ok) {
      return NextResponse.json({ message: order.message }, { status: 404 });
    }

    const originHeader = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const vercelUrl = process.env.VERCEL_URL
      ? process.env.VERCEL_URL.startsWith("http")
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`
      : null;
    const origin = originHeader ?? appUrl ?? vercelUrl;

    if (!origin) {
      return NextResponse.json(
        { message: "Missing app URL configuration. Set NEXT_PUBLIC_APP_URL." },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: user.email,
      billing_address_collection: "auto",
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
    });

    if (!session.id || !session.url) {
      return NextResponse.json({ message: "Failed to create payment session." }, { status: 502 });
    }

    setOrderCheckoutSession({
      orderId: order.orderId,
      checkoutSessionId: session.id,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout initialization failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
