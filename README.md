# AI Build Picker

A web app for building PC configurations optimized for AI and local LLM workloads.

## Overview
This project helps users choose compatible PC parts with a focus on machine learning and inference performance. Instead of generic gaming recommendations, the platform prioritizes components that matter most for AI use cases such as local LLM hosting, fine-tuning, and accelerated data workflows.

## Target Users
- AI enthusiasts running local language models
- Developers building LLM-powered applications
- Researchers assembling cost-efficient training or inference rigs
- Creators who need balanced compute for AI + content workflows

## Core Website Features

### 1. AI Build Profiles
Prebuilt intents that shape recommendations:
- Local LLM Inference (7B to 70B class guidance)
- LLM Fine-Tuning Starter Rig
- Hybrid AI + Gaming Build
- Workstation AI Build (multi-GPU capable)

### 2. Intelligent Part Selection
- GPU-first recommendations (VRAM, CUDA/ROCm support, tensor throughput)
- CPU recommendations by AI pipeline bottleneck type
- RAM sizing guidance based on model size and context length
- Storage recommendations for model libraries and datasets

### 3. Compatibility Engine
- Socket/chipset compatibility checks
- PSU headroom validation for GPU spikes
- Case clearance checks for large AI-class GPUs
- Thermals and airflow warnings for sustained inference loads

### 4. LLM Capability Mode
A dedicated mode that evaluates builds for LLM readiness:
- Estimated max model size by VRAM/system RAM
- Quantization strategy suggestions (e.g., 4-bit/8-bit)
- Expected token throughput ranges by hardware tier
- Recommendations for popular runtimes (Ollama, llama.cpp, vLLM, etc.)

### 5. Budget-Aware Optimization
- User-defined budget with intelligent tradeoff suggestions
- "Performance per euro" scoring for AI workloads
- Upgrade path suggestions (what to buy now vs later)

### 6. Explainable Recommendations
Each suggested part includes plain-language rationale:
- Why this part was selected
- AI-specific pros/cons
- Potential bottlenecks
- Alternative options at nearby price points

## Example User Flow
1. User selects "Local LLM Inference" profile.
2. User sets budget (e.g., €1,800).
3. Website proposes a full compatible build.
4. LLM Capability Mode reports likely supported model sizes and speed expectations.
5. User swaps parts and sees live compatibility + capability updates.

## Future Enhancements
- Live price aggregation from major retailers
- Region-based availability filters
- Community build sharing with benchmark submissions
- Power cost estimation for always-on inference systems
- Optional assistant chat for build guidance

## Mission
Make AI-capable PC building practical, transparent, and accessible by translating complex hardware constraints into clear, actionable recommendations.

## Current App Scope
The project includes a `Next.js + TypeScript + Tailwind CSS` frontend with production-ready catalog and account/payment flows for:
- AI build profile selection
- Parts recommendation table with AI scoring
- Compatibility check panel
- LLM capability mode output
- Saved build snapshot + export CTA
- Daily Estonian market pricing refresh (average listing price + 15% assembly/setup)

## Run Locally
```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Local Catalog Database
- Uses local SQLite at `data/catalog.db`
- Auto-creates tables for GPUs, CPUs, and prebuilts
- Auto-seeds starter records on first run
- Auto-seeds `profile_builds` options for each AI build profile
- Profile build recommendations are seeded from online vendor data (NVIDIA, AMD, Intel specs/pricing)
- Prices are stored and displayed in EUR

## Account System
- Adds SQLite-backed `users` and `sessions` tables
- Secure password hashing via Node `scrypt`
- HTTP-only cookie sessions
- Roles: `USER`, `DEV`, `ADMIN`
### Optional environment variables
- `ADMIN_SETUP_CODE` required to create the admin account
- `DATABASE_URL` strongly recommended in production for persistent accounts/sessions/orders
- `STRIPE_SECRET_KEY` required for checkout session creation
- `STRIPE_WEBHOOK_SECRET` required for webhook signature verification
- `NEXT_PUBLIC_APP_URL` required for Stripe success/cancel return URLs
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL` for payment confirmation emails
- `CRON_SECRET` to authorize manual cron calls
- `ESTONIAN_PRICE_MAX_ITEMS` max components to evaluate per cron run
- `ESTONIAN_PRICE_CONCURRENCY` concurrent outbound listing checks

## Daily Estonian Price Refresh
- Vercel cron runs `/api/cron/estonian-pricing` once daily (`03:00 UTC`) via `vercel.json`.
- The job checks Estonian store/search listings, computes per-part market average, then applies a 15% assembly/setup markup.
- Updated preorder prices are written into `estonian_price_checks` and displayed on the homepage.
