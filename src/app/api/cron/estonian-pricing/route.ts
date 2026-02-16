import { NextResponse } from "next/server";
import { refreshEstonianMarketPricing } from "@/lib/server/estonian-pricing-service";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader === "1") {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await refreshEstonianMarketPricing();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price refresh failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
