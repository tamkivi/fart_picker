# fart_picker

> An AI-focused PC build configurator — curated profiles, Estonian market pricing, and a clean opinionated catalog.

---

## What it is

A Next.js catalog app for people who want to run AI workloads locally and don't want to waste time figuring out which parts actually matter for that.

Instead of a generic PC part picker, this is a curated set of **build profiles** grouped by use case:

- **Local LLM Inference** — 7B to 70B quantized models, maximum VRAM per euro
- **LLM Fine-Tune Starter** — enough system RAM and stable thermals for LoRA runs
- **Hybrid AI + Gaming** — balanced compute for daytime AI work, high-refresh gaming at night
- **AI Workstation** — Threadripper and Xeon platforms with ECC RAM for serious multi-session serving
- **macOS Based Systems** — Apple Silicon Mac minis pre-configured with Ollama and LM Studio

Each profile links to specific builds with estimated token throughput, system power draw, PSU recommendations, and a price computed from live Estonian market data.

---

## Why

Most PC configurators optimize for gaming. AI workloads have completely different bottlenecks — VRAM bandwidth matters more than clock speed, ECC matters for long training runs, and thermals under sustained inference loads are nothing like a gaming session. This tries to make those tradeoffs legible without burying the user in spec sheets.

The Estonian focus is practical: components are sourced and priced from local vendors, not Amazon DE.

---

## Stack

- **Next.js 15** (App Router, server + client components)
- **TypeScript**
- **Tailwind CSS v4** — `@theme inline`, `color-mix()` for theming, dark/light toggle
- **SQLite** via Node.js built-in `DatabaseSync` — no ORM, no external DB dependency in dev
- **Stripe** — checkout sessions, webhook signature verification
- **Nodemailer** — order confirmation emails
- **Vercel** — hosting + cron for daily Estonian pricing refresh

---

## Project structure

```
src/
  app/
    page.tsx                        # Homepage — build profile browser
    profiles/[key]/page.tsx         # Per-profile build listing
    builds/[id]/page.tsx            # Individual build detail + purchase
    catalog/[type]/[id]/page.tsx    # Component detail pages
    faq/page.tsx                    # FAQ including "which profile is right for me"
    about/page.tsx
    orders/page.tsx                 # Order history (authenticated)
    admin/orders/page.tsx           # Admin order view
    api/
      auth/                         # Register, login, logout, session check
      payments/                     # Stripe checkout, session status, webhook
      cron/estonian-pricing/        # Daily price refresh job
  components/
    auth-panel.tsx
    back-button.tsx
    language-switch.tsx
    masthead.tsx
    profile-builds-browser.tsx
    purchase-build-button.tsx
    theme-toggle.tsx
  lib/
    catalog-db.ts                   # SQLite schema + seed data
    server/catalog-service.ts       # Read-only catalog queries
    server/estonian-pricing-service.ts
    server/lang.ts                  # ET/EN language detection
    auth-session.ts
    stripe.ts
data/
  catalog.db                        # Auto-generated, gitignored
```

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The SQLite database auto-creates and seeds on first run. Delete `data/catalog.db` to force a re-seed (e.g. after adding new builds or components to `catalog-db.ts`).

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```
ADMIN_SETUP_CODE       # one-time code to register the admin account
DATABASE_URL           # Postgres URL for production (accounts/orders persist here)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL    # e.g. https://your-domain.com — needed for Stripe return URLs
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
SMTP_FROM_EMAIL
CRON_SECRET            # authorizes manual cron calls
ESTONIAN_PRICE_MAX_ITEMS   # max components per cron run (default: 120)
ESTONIAN_PRICE_CONCURRENCY # concurrent listing checks (default: 6)
```

You can run the app locally without any of these — auth and payments just won't work.

---

## Estonian pricing

A Vercel cron job runs daily at 03:00 UTC (`/api/cron/estonian-pricing`). It checks Estonian retailer listings for each component, computes a per-part market average, and applies a 15% assembly/setup buffer. Updated prices feed into the preorder display.

---

## i18n

The app is bilingual — Estonian (`et`) and English (`en`). Language is detected server-side per request and passed down via `getRequestLanguage()`. All UI strings use a simple `lang === "et" ? ... : ...` ternary pattern; no external i18n library.

---

## Auth

- SQLite-backed `users` and `sessions` tables (dev), Postgres in production
- Password hashing via Node.js built-in `scrypt`
- HTTP-only cookie sessions
- Roles: `USER`, `DEV`, `ADMIN`
