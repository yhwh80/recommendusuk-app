# RecommendUsUK — Status & Next Steps

_Last updated: 2026-06-18_

## Pick up here (last session: 2026-06-25)

**LIVE in production** at https://recommendusjobsuk.com (Coolify on VPS 72.62.133.181,
prod Convex `fearless-newt-271`, repo github.com/yhwh80/recommendusuk-app PUBLIC).

Done this session: green restyle, Area/Location on jobs, edit+delete jobs (refund only
if no bids), accept proposal + freelancer-profile links, complete→review loop (reviews
show on profile), and **1:1 messaging** (inbox, threads, unread badges; entry points on
profile/job/dashboards). Plus mobile hamburger on dashboard headers.

**NEXT SESSION — start here:** **#4 smaller batch** — profile photo upload (Convex file
storage; avatars are initials now), edit/withdraw a bid (freelancer side), earnings stat
on freelancer dashboard. THEN the **email layer** (pre-launch): email verification on
signup + email notifications via Resend — `notify()` in convex/notifications.ts is the
hook point; put RESEND_API_KEY in Convex env. SGP's call: do the email layer right before
inviting real users, not during solo testing.

DONE 2026-06-26: **#3 search/filter + categories** — browse page keyword search + Area +
Skill + Category filters + open-only + clear; categories wired (picker on post-job, badges
on cards/detail, listWithClient resolves categoryName); 6 categories seeded on prod.

DONE 2026-06-26: **🔔 notifications (#2)** — notifications table + notify() helper,
triggers on bid-accepted/new-bid/new-review/job-completed, /notifications page, 🔔 bell
w/ unread badge in both dashboards. Also finished client dashboard mobile hamburger.

⚠️ Deploy note: auto-deploy via Coolify GitHub App was being set up by SGP's browser
agent (Comet) — confirm it's connected. If yes, pushes deploy automatically; if not,
click Deploy in Coolify after each push. Backend changes (`npx convex deploy -y`) go
live instantly regardless; only FRONTEND needs the Coolify rebuild.

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

## Feature-parity TODOs (from the green `static-marketplace` version)

The green landing came from `yhwh80/static-marketplace` — which was a *separate,
actually-live* build (static HTML + Supabase, deployed via Coolify on VPS
207.180.207.13). It diverged from the Next.js `freelance-marketplace` codebase we
rebuilt on. Things the green LIVE version had that this app doesn't yet:

- [x] **Freelancer browse page** — `/freelancers` (`users.listFreelancers`), green-themed cards.
- [x] **Public profile page** — `/profile/[id]` (`users.getPublicProfile`), avatar + skill badges + stats.
- [x] **Own editable profile** — `/profile` (`users.updateProfile`), edit bio/skills/rate/location.
- [x] **My Bids page** — `/my-bids` (`bids.listMine`). `/my-bids` link no longer 404s.
- [x] **My Jobs page** — `/my-jobs` (`jobs.listMine`), linked from client dashboard.
- [x] **Profile fields on users** — added `bio`, `skills[]`, `hourlyRate`, `location` (+ `by_role` index).
- [x] **`skills` + `deadline` on jobs** — added to schema + `jobs.create`; post-job form has inputs;
      job detail shows skill badges + deadline.

Done 2026-06-19. Nav wired: client dashboard → My Jobs + Browse Freelancers (now `/freelancers`);
freelancer dashboard → Update Profile (`/profile`) + My Proposals (`/my-bids`) now resolve.

Note: the green version used a SINGLE `budget` (decimal) + `category` (text),
whereas our schema uses `budgetMin`/`budgetMax` (pence) + `categoryId`. We kept the
richer freelance-marketplace model — no change needed, just noting the divergence.

### Still open
- [x] **Full green restyle done (2026-06-25)** — converted all 9 blue/purple/indigo
      inner pages (auth, both dashboards, jobs, job detail, post-job, buy-credits +
      success, dashboard redirect) to green. Brand gradient → `from-green-500 to-green-400`,
      primary buttons `bg-green-600`, focus rings `green-500`; status badges (green/
      yellow/red/gray) left intact. Whole app is now cohesively green.
- [ ] **Email verification on signup (LATER).** Currently signup accepts any email,
      unverified. Convex Auth Password supports built-in email verification — wire a
      verification provider using **Resend** (SGP already uses Resend for outbound,
      see [[email_setup]]). Put `RESEND_API_KEY` in Convex env vars (secrets-in-Convex).
      Flow becomes: enter email → emailed code/link → verify → account active.

## DEPLOY PROGRESS (2026-06-25)

- [x] **GitHub repo:** https://github.com/yhwh80/recommendusuk-app (PUBLIC — flip to
      private once Coolify is connected). 5 commits pushed, `main`.
- [x] **Convex PRODUCTION deployed:** `https://fearless-newt-271.convex.cloud`
      (dev remains `pleasant-warbler-150`). Auth keys + `SITE_URL=https://recommendusjobsuk.com`
      set on prod vault.
- [x] **Coolify app DEPLOYED + LIVE** (2026-06-25) on VPS **72.62.133.181** (dashboard
      http://72.62.133.181:8000). Build var `NEXT_PUBLIC_CONVEX_URL=https://fearless-newt-271.convex.cloud`
      + `NODE_OPTIONS=--no-experimental-webstorage`. Verified: HTTPS 200, valid SSL, green
      site rendering, baked to PROD Convex. (72.62.210.209 / KVM 1 = Icecast/Urban Radio — untouched.)
      Build gotcha hit + fixed: Coolify breaks `nixpacks` if the Domains field has >1 domain
      (custom + auto sslip.io) → keep ONE domain in the field.
- [x] **DNS** — `recommendusjobsuk.com` root + www both resolve → **72.62.133.181**.
      ⚠️ www has no SSL cert yet (only root). Optional: add www in Coolify or www→root redirect.
- [ ] Flip GitHub repo to private after Coolify connected.
- [ ] (Later) Stripe→Convex refactor + real keys; email verification via Resend.

Domain: **recommendusjobsuk.com** (owned via Namecheap). Prod DB is EMPTY (no demo data);
users sign up fresh on the live site. Dev account sgp7@hotmail.co.uk lives in the DEV
deployment only.

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

## Secrets / keys — single secure home in Convex

Goal (SGP): keep all keys in Convex. Convex's secure store = **environment
variables** (encrypted, server-only) — set via dashboard (Settings → Environment
Variables) or `npx convex env set NAME value` (dev) / `... --prod` (prod).
Dev and prod have SEPARATE env vars.

To make Convex the single home for *secret* keys, move Stripe server logic out of
the Next.js API routes into **Convex httpActions/actions**. Then:

| Key | Lives in |
|---|---|
| `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` | Convex env 🔒 (already set on dev) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Convex env 🔒 (after Stripe→Convex refactor) |
| Stripe price IDs | Convex env (config) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Coolify (public by design) |
| `NEXT_PUBLIC_CONVEX_URL` | Coolify (public, build-time) |

After the refactor, the Coolify VPS holds ONLY public values — no secrets.
TODO when deploying: do the Stripe→Convex action refactor, then set the secret
keys with `npx convex env set ... --prod`.

## Key references

- Backend deployment dashboard: https://dashboard.convex.dev/d/pleasant-warbler-150
- Original design source: `yhwh80/static-marketplace` (green) — landing only ported.
- Original full app source: `yhwh80/freelance-marketplace` (Supabase, blue theme).
