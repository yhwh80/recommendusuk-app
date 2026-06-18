# RecommendUsUK Marketplace

UK freelance marketplace — Next.js 15 frontend on a **Convex** backend (migrated
from the original Supabase build). Auth, jobs, bidding, ratings, a credit ledger,
and messaging, with Stripe credit purchases.

- **Convex deployment (dev):** `pleasant-warbler-150`
- **Dashboard:** https://dashboard.convex.dev/d/pleasant-warbler-150

## Run it

```bash
npm install
npm run dev:backend     # terminal 1 — Convex (watch + push functions)
npm run dev             # terminal 2 — Next.js at http://localhost:3000
npm run seed            # one-time: load demo data (idempotent)
```

`npm run dev` / `build` / `start` set `NODE_OPTIONS=--no-experimental-webstorage`
— Node 22+ exposes a broken global `localStorage` that breaks Convex Auth during
SSR; the flag hides it so the server uses cookies and the browser uses real
localStorage. (The project's `.nvmrc` pins Node 18, where this isn't needed.)

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind v4
- **Backend:** Convex (`convex/`) — document DB + serverless functions
- **Auth:** Convex Auth (`@convex-dev/auth`) — email/password, replaces Supabase Auth
- **Payments:** Stripe (mock mode by default; set keys for production)

## Pages

| Route | Purpose | Convex functions used |
|---|---|---|
| `/` | Landing + live stats | `stats.overview` |
| `/auth` | Sign up / sign in | `auth` (useAuthActions) |
| `/dashboard` | Role-aware redirect | `users.getMe` |
| `/dashboard/client` | Client dashboard | `users.getMe`, `jobs.listMine` |
| `/dashboard/freelancer` | Freelancer dashboard | `users.getMe`, `jobs.listOpen`, `bids.listMine` |
| `/jobs` | Browse jobs (+ status filter) | `jobs.listWithClient` |
| `/jobs/[id]` | Job detail + submit proposal | `jobs.getWithClient`, `bids.listByJobWithUser`, `bids.create` |
| `/post-job` | Post a job (costs 5 credits) | `jobs.create` |
| `/buy-credits` + `/success` | Buy credit packages | `creditTransactions.purchaseMock`, Stripe routes |

## Backend tables (`convex/schema.ts`)

`users` (auth + profile), `categories`, `jobs`, `bids`, `ratings`,
`creditTransactions` (credit ledger — source of truth), `messages` — plus Convex
Auth tables. See per-table notes in `schema.ts`.

## Notes vs. the Supabase original

- **Atomic credits.** Posting a job inserts the job, debits credits, and writes a
  ledger row in **one transactional mutation** — the original did two separate
  Supabase calls that could drift.
- **Stripe → Convex.** The webhook (`/api/stripe-webhook`) verifies the Stripe
  signature, then calls `creditTransactions.recordPurchase`. Without Stripe keys,
  buy-credits runs in mock mode and credits the account directly via Convex.
  For production hardening, move the webhook into a Convex `httpAction`.
- **Demo users** (`*@demo.recommendusuk.com`) are profile-only and can't log in;
  real accounts come through signup. `npx convex run seed:reset` clears demo data.
