import { NextResponse } from "next/server";
import { createSessionForCredentials } from "@/lib/catalog-db";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth-session";
import { sanitizeIpAddress, checkRateLimit } from "@/lib/request-utils";

export async function POST(request: Request) {
  try {
    const ipAddress = sanitizeIpAddress(request.headers.get("x-forwarded-for"));
    const rateLimitKey = `login:${ipAddress ?? "unknown"}`;
    if (!checkRateLimit(rateLimitKey, 10, 60_000)) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          email?: string;
          password?: string;
        }
      | null;

    if (!body?.email || !body?.password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const auth = await createSessionForCredentials({
      email: body.email,
      password: body.password,
      ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: 401 });
    }

    const response = NextResponse.json({ user: auth.user });
    response.cookies.set(SESSION_COOKIE_NAME, auth.token, sessionCookieOptions(auth.expiresAt));
    return response;
  } catch {
    return NextResponse.json({ message: "Login failed due to a server error." }, { status: 500 });
  }
}
