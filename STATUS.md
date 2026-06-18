# RecommendUsUK — Status & Next Steps

_Last updated: 2026-06-18_

## Where we are ✅

A working **Next.js 15 + Convex** freelance marketplace, rebuilt from the old
Supabase project. Runs locally end-to-end.

- **Backend:** Convex (dev deployment `pleasant-warbler-150`). 7 tables — users,
  categories, jobs, bids, ratings, creditTransactions (credit ledger), messages —
  plus Convex Auth tables. Demo data seeded.
- **Auth:** Convex Auth (email/password), replaces Supabase Auth.
- **Frontend:** all 9 pages working — landing, auth, client + freelancer
  dashboards, browse jobs, job detail + bidding, post-job, buy-credits + success.
- **Landing page:** the **green** design (ported from the `static-marketplace`
  repo) — animated gradient, floating service images, fade-in animations.
- **Payments:** Stripe in **mock mode** (credits added directly via Convex) until
  real keys are added.

### Run locally
```bash
npm install
npm run dev:backend     # terminal 1 — Convex
npm run dev             # terminal 2 — http://localhost:3000
npm run seed            # one-time demo data
```

## Known gaps / decisions pending

- [ ] **Inner pages are still BLUE** (auth, dashboards, jobs, post-job, buy-credits)
      — only the landing is green. Decide: restyle the whole app green for cohesion?
- [ ] `/profile` and `/my-bids` links on the freelancer dashboard 404 (never built).
- [ ] Floating landing images are ~2.5 MB each — **compress before deploy**.
- [ ] Stripe: add real keys (publishable, secret, webhook secret, price IDs) for
      live payments. Until then, mock mode is used.

## Deployment plan → GitHub + Coolify (Hostinger)

Same overall flow as the Driving Instructor Directory. **Important:** the Convex
backend is hosted by Convex (cloud) — Coolify only hosts the Next.js frontend.

1. **Push to GitHub** — new repo (name + public/private TBD). `git init` + commit
   already done locally; `.env*`, `node_modules`, `.next` are gitignored.
2. **Provision a PROD Convex deployment:**
   ```bash
   npx convex deploy            # creates/uses prod deployment
   npx @convex-dev/auth --prod  # sets JWT keys + SITE_URL on PROD
   ```
   Set `SITE_URL` (prod) to the real domain.
3. **Coolify app (Hostinger VPS):**
   - Source: the GitHub repo. Build: `npm run build`. Start: `npm run start`
     (both keep `NODE_OPTIONS=--no-experimental-webstorage`).
   - Env vars in Coolify: `NEXT_PUBLIC_CONVEX_URL` = **prod** Convex URL
     (`https://<prod>.convex.cloud`), plus Stripe keys when ready.
4. **Build-time gotcha:** `NEXT_PUBLIC_CONVEX_URL` must be present at build time
   (it's inlined into the client bundle).
5. **Point domain/subdomain** at the Coolify app; confirm Convex Auth `SITE_URL`
   matches it.

## Key references

- Backend deployment dashboard: https://dashboard.convex.dev/d/pleasant-warbler-150
- Original design source: `yhwh80/static-marketplace` (green) — landing only ported.
- Original full app source: `yhwh80/freelance-marketplace` (Supabase, blue theme).
