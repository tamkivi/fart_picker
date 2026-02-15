import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAccountSummary, getAdminEmail, getUserFromSessionToken } from "@/lib/catalog-db";
import { SESSION_COOKIE_NAME } from "@/lib/auth-session";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const user = getUserFromSessionToken(token);

  if (!user) {
    return NextResponse.json({ user: null, adminEmail: getAdminEmail() });
  }

  const summary = user.role === "ADMIN" || user.role === "DEV" ? getAccountSummary() : null;
  return NextResponse.json({ user, summary, adminEmail: getAdminEmail() });
}
