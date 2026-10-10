// Marketplace pricing — the single place to change what anything costs.
//
// Deliberately free of Convex imports so the browser can import it too and the
// prices shown to users cannot drift from the prices actually charged.
//
// Model: professionals pay for leads, customers post for free. This is how the
// established UK marketplaces work (Bark, MyBuilder, Rated People), and for a
// good reason — a customer asking for quotes will not pay for the privilege,
// and without customers there are no jobs for professionals to bid on.

/** Posting a job is free. Customers are the scarce side; do not tax them. */
export const JOB_POST_COST_CREDITS = 0;

/**
 * Cost to submit a proposal, by the top end of the customer's stated budget.
 * Bigger jobs are worth more to win, so they cost more to chase.
 */
export const BID_COST_TIERS = [
  { upToBudget: 100, credits: 1 },
  { upToBudget: 500, credits: 2 },
  { upToBudget: 2000, credits: 4 },
  { upToBudget: Infinity, credits: 6 },
];

/**
 * Credits a professional pays to bid on a job with this budget. Jobs store
 * budgets in pence; the tiers above are in pounds, as shown to users.
 */
export function bidCostForBudget(budgetMaxPence: number): number {
  const budgetMax = budgetMaxPence / 100;
  const safeBudget = Number.isFinite(budgetMax) && budgetMax > 0 ? budgetMax : 0;
  const tier = BID_COST_TIERS.find((t) => safeBudget < t.upToBudget);
  // The final tier is unbounded, so this fallback is unreachable in practice.
  return tier?.credits ?? BID_COST_TIERS[BID_COST_TIERS.length - 1].credits;
}

/**
 * Free credits on sign-up. Professionals get enough to win work before paying;
 * customers get none because there is nothing for them to spend credits on.
 */
export const SIGNUP_BONUS_FREELANCER = 20;
export const SIGNUP_BONUS_CLIENT = 0;
