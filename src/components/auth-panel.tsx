"use client";

import { FormEvent, useEffect, useState } from "react";

type AuthUser = {
  id: number;
  email: string;
  role: "ADMIN" | "DEV" | "USER";
  createdAt: string;
};

type Summary = {
  total: number;
  admins: number;
  devs: number;
  users: number;
};

type MeResponse = {
  user: AuthUser | null;
  summary?: Summary | null;
  adminEmail: string;
};

export function AuthPanel() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"USER" | "DEV">("USER");
  const [devSignupCode, setDevSignupCode] = useState("");
  const [adminSetupCode, setAdminSetupCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refreshMe() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await response.json()) as MeResponse;
    setMe(data);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json() as Promise<MeResponse>)
      .then((data) => {
        if (!cancelled) {
          setMe(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("Failed to load account session.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        requestedRole,
        devSignupCode,
        adminSetupCode,
      }),
    });

    const data = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message ?? "Registration failed.");
      return;
    }

    setMessage("Account created and signed in.");
    await refreshMe();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as { message?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message ?? "Login failed.");
      return;
    }

    setMessage("Signed in successfully.");
    await refreshMe();
  }

  async function handleLogout() {
    setLoading(true);
    setMessage(null);

    await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    setMessage("Signed out.");
    await refreshMe();
  }

  return (
    <section className="wireframe-panel stagger-in mt-8 p-6" style={{ animationDelay: "250ms" }}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-3xl font-semibold">Accounts</h3>
        <span className="label-pill">Admin locked to {me?.adminEmail ?? "gustavpaul@tamkivi.com"}</span>
      </div>

      {me?.user ? (
        <div className="mb-4 rounded-lg border border-[color:var(--panel-border)] p-4">
          <p className="font-semibold">Signed in as {me.user.email}</p>
          <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Role: {me.user.role}</p>
          {me.summary ? (
            <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">
              Accounts: {me.summary.total} total | {me.summary.admins} admin | {me.summary.devs} dev | {me.summary.users} user
            </p>
          ) : null}
          <button
            className="mt-3 rounded-md bg-[color:var(--accent-2)] px-4 py-2 text-sm font-semibold text-white"
            onClick={handleLogout}
            type="button"
            disabled={loading}
          >
            Logout
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-[color:var(--muted)]">Create an account or sign in. Password minimum is 12 characters.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleRegister} className="space-y-3 rounded-lg border border-[color:var(--panel-border)] p-4">
          <p className="font-semibold">Create account</p>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
            type="password"
            required
          />
          <select
            value={requestedRole}
            onChange={(event) => setRequestedRole(event.target.value as "USER" | "DEV")}
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
          >
            <option value="USER">USER</option>
            <option value="DEV">DEV</option>
          </select>
          {requestedRole === "DEV" ? (
            <input
              value={devSignupCode}
              onChange={(event) => setDevSignupCode(event.target.value)}
              placeholder="DEV_SIGNUP_CODE"
              className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
              type="password"
            />
          ) : null}
          <input
            value={adminSetupCode}
            onChange={(event) => setAdminSetupCode(event.target.value)}
            placeholder="ADMIN_SETUP_CODE (only for gustavpaul@tamkivi.com)"
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
            type="password"
          />
          <button className="rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white" disabled={loading}>
            Create account
          </button>
        </form>

        <form onSubmit={handleLogin} className="space-y-3 rounded-lg border border-[color:var(--panel-border)] p-4">
          <p className="font-semibold">Sign in</p>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
            type="password"
            required
          />
          <button className="rounded-md bg-[color:var(--accent-2)] px-4 py-2 text-sm font-semibold text-white" disabled={loading}>
            Login
          </button>
        </form>
      </div>

      {message ? <p className="mt-4 text-sm text-[color:var(--muted)]">{message}</p> : null}
    </section>
  );
}
