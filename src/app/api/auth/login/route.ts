import { NextResponse } from "next/server";
import { createSessionForCredentials } from "@/lib/catalog-db";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          email?: string;
          password?: string;
        }
      | null;

    if (!body?.email || !body?.password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    const auth = createSessionForCredentials({
      email: body.email,
      password: body.password,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
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
