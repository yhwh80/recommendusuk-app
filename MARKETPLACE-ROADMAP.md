# Marketplace Roadmap — deferred by design

Ideas parked deliberately, not forgotten. Each has a **trigger**: the signal
that says it's now worth building. Building any of these before its trigger is
solving a problem you don't have yet.

Current model (decided 2026-08-23): **professionals pay for leads, customers
post free** — the Bark / MyBuilder / Rated People model. Prices live in
`convex/pricing.ts`, which is the single place to change them.

| Thing | Status | Trigger |
|---|---|---|
| Open-jobs cap (5 per client) | ✅ Done | — |
| Report a bad lead → refund | ⏳ Deferred | Before pushing hard on pro recruitment |
| Phone verification on posting | ⏳ Deferred | Junk leads become a measurable problem |
| Charge only when customer replies | 💡 Reserve | If pro conversion is the bottleneck |
| Expiry refund on dead jobs | 💡 Reserve | Complaints about unanswered jobs |

---

## 1. Report a bad lead → refund credits

**The one to do next.** A professional flags a lead as uncontactable or fake and
gets their credits back. Manual review at first — at low volume that's minutes a
week.

This is a **retention** feature, not an anti-spam one. Revenue depends entirely
on pros buying a *second* pack. The difference between a pro who got burned once
and left, and one who got burned, got refunded, and stayed, is the whole
business. Pros who feel cheated don't churn quietly — they tell other trades.
It is Bark's single biggest reputational problem.

**Trigger:** before actively recruiting professionals at any scale.
**Effort:** ~half a day. `creditTransactions.recordRefund` already exists.
**Sketch:** `leadReports` table (bidId, reason, status) → admin view → approve
triggers refund. Reuse the `bid_refunded` notification already added.

## 2. Phone verification before a job goes live

What Bark uses, and it works — a real mobile means a real, contactable customer.

**Deliberately not done yet:** costs money per SMS, and adds friction to the
customer side, which is the side that can least afford it right now. Note there
may be reusable SMS plumbing in the Driving Instructor Directory project.

**Trigger:** junk leads are measurable, not hypothetical — e.g. bad-lead reports
above ~5% of bids.
**Effort:** ~1 day plus SMS costs.

## 3. Charge only when the customer replies

The strong alternative positioning. The pro pays nothing until a customer
actually engages with their proposal. Zero risk for the pro, and "you only pay
when the customer replies" is a genuinely sharp pitch against Bark, whose
reputation problem is exactly the opposite.

**Why not now:** bigger build, and it ties revenue to customer responsiveness.
**Trigger:** professionals sign up but don't buy — i.e. trust, not traffic, is
what's blocking conversion.

## 4. Expiry refund on jobs nobody ever accepts

Auto-refund bidders when a job goes stale with no acceptance. Generous, and
hard to game (the client gains nothing by stalling). Needs a Convex cron.

**Trigger:** pros complaining about jobs that just went quiet.

---

## Watch these numbers

The metrics that tell you which of the above to reach for:

- **Repeat purchase rate** — what fraction of pros buy a second credit pack.
  The single most important number. If it's low, leads aren't worth the price.
- **Bid-to-win rate** — if a pro pays for 10 leads, how many convert? Below
  ~1 in 10 and the pricing is wrong, not the product.
- **Jobs per client** — are customers coming back, or posting once and leaving?
- **Bad-lead reports as a share of bids** — the trigger for item 2.

## Pricing notes

- Changing `SIGNUP_BONUS_FREELANCER` affects **new signups only**; existing
  balances are untouched.
- Changing bid tiers applies **immediately to everyone** — cost is computed at
  bid time.
- Past bids are unaffected either way: `bids.costCredits` records what was
  actually paid, so refunds always return the real amount.
- Current tiers are deliberately cheap for launch (~£0.32–£3.00 per lead).
  Raise once there's evidence leads convert.
