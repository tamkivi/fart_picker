import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getOrderById,
  markOrderCanceledFromCheckoutSession,
  markOrderFailedFromCheckoutSession,
  markOrderPaidFromCheckoutSession,
  recordStripeWebhookEvent,
} from "@/lib/catalog-db";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const isNewEvent = recordStripeWebhookEvent(event.id, event.type);
    if (!isNewEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const handleCheckoutSessionEvent = (session: Stripe.Checkout.Session): boolean => {
      const orderIdRaw = session.metadata?.order_id;
      const orderId = Number.parseInt(orderIdRaw ?? "", 10);
      if (!Number.isFinite(orderId)) {
        return false;
      }

      const order = getOrderById(orderId);
      if (!order) {
        return false;
      }

      if (order.stripe_checkout_session_id !== session.id) {
        return false;
      }

      if (typeof session.amount_total === "number" && session.amount_total !== order.amount_eur_cents) {
        return false;
      }

      return true;
    };

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!handleCheckoutSessionEvent(session)) {
        return NextResponse.json({ message: "Order/session verification failed." }, { status: 400 });
      }
      markOrderPaidFromCheckoutSession({
        checkoutSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!handleCheckoutSessionEvent(session)) {
        return NextResponse.json({ message: "Order/session verification failed." }, { status: 400 });
      }
      markOrderCanceledFromCheckoutSession(session.id);
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!handleCheckoutSessionEvent(session)) {
        return NextResponse.json({ message: "Order/session verification failed." }, { status: 400 });
      }
      markOrderFailedFromCheckoutSession({
        checkoutSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
