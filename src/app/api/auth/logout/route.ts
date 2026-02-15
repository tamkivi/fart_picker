import { NextResponse } from "next/server";
import { invalidateSessionToken } from "@/lib/catalog-db";
import { clearSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth-session";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));

  const token = match?.slice(SESSION_COOKIE_NAME.length + 1);
  invalidateSessionToken(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions());
  return response;
}
