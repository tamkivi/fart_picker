"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type AuthUser = {
  id: number;
  email: string;
  role: "ADMIN" | "DEV" | "USER";
  createdAt: string;
};

type MeResponse = {
  user: AuthUser | null;
};

type AuthMode = "login" | "register";

export function AuthPanel() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSetupCode, setAdminSetupCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          adminSetupCode,
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Registration failed.");
        return;
      }

      setMessage("Account created and signed in.");
      await refreshMe();
    } catch {
      setMessage("Signup request failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Login failed.");
        return;
      }

      setMessage("Signed in successfully.");
      await refreshMe();
    } catch {
      setMessage("Login request failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage(null);

    await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    setMessage("Signed out.");
    await refreshMe();
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative z-[200]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="label-pill cursor-pointer"
      >
        {me?.user ? `Profile (${me.user.role})` : "Profile"}
      </button>

      {open ? (
        <div className="wireframe-panel absolute right-0 top-9 z-[1000] w-[min(92vw,360px)] p-4">
          {message ? <p className="mb-3 text-xs text-[color:var(--muted)]">{message}</p> : null}
          {me?.user ? (
            <div>
              <p className="font-semibold">Signed in</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{me.user.email}</p>
              <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">Role: {me.user.role}</p>
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
            <div>
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-md border px-3 py-1 text-sm ${mode === "login" ? "border-transparent bg-[color:var(--accent-2)] text-white" : "border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--foreground)]"}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-md border px-3 py-1 text-sm ${mode === "register" ? "border-transparent bg-[color:var(--accent)] text-white" : "border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--foreground)]"}`}
                >
                  Register
                </button>
              </div>

              {mode === "register" ? (
                <form onSubmit={handleRegister} className="space-y-2">
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
                    placeholder="Password (12+ chars)"
                    className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
                    type="password"
                    required
                  />
                  <input
                    value={adminSetupCode}
                    onChange={(event) => setAdminSetupCode(event.target.value)}
                    placeholder="ADMIN_SETUP_CODE (admin signup only)"
                    className="w-full rounded-md border border-[color:var(--panel-border)] px-3 py-2 text-sm"
                    type="password"
                  />
                  <button
                    className="w-full rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                    disabled={loading}
                  >
                    Create account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-2">
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
                  <button
                    className="w-full rounded-md bg-[color:var(--accent-2)] px-4 py-2 text-sm font-semibold text-white"
                    disabled={loading}
                  >
                    Login
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
