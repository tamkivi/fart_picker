"use client";

import { useState } from "react";

type Props = {
  buildId: number;
  priceEur: number;
};

async function parseApiMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    return data?.message ?? null;
  }

  const text = await response.text().catch(() => "");
  return text.trim() ? text.slice(0, 200) : null;
}

export function PurchaseBuildButton({ buildId, priceEur }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buildId }),
      });

      if (!response.ok) {
        const apiMessage = await parseApiMessage(response);
        setMessage(apiMessage ?? "Unable to start checkout.");
        return;
      }

      const data = (await response.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) {
        setMessage("Checkout session did not return a redirect URL.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setMessage("Checkout request failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Redirecting..." : `Purchase for €${priceEur}`}
      </button>
      <p className="mt-2 text-xs text-[color:var(--muted)]">Secure checkout via Stripe.</p>
      {message ? <p className="mt-2 text-xs text-red-400">{message}</p> : null}
    </div>
  );
}
