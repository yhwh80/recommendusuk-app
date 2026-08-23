import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// DEV-ONLY mock top-up. This hands out free credits, so it is hard-disabled
// unless the deployment explicitly opts in with ALLOW_MOCK_CREDITS=true.
// NEVER set that variable on the production deployment.
export const purchaseMock = mutation({
  args: { credits: v.number() },
  handler: async (ctx, { credits }) => {
    if (process.env.ALLOW_MOCK_CREDITS !== "true") {
      throw new Error("Mock credit purchases are disabled on this deployment");
    }
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { credits: (user.credits ?? 0) + credits });
    await ctx.db.insert("creditTransactions", {
      userId,
      amount: credits,
      reason: "purchase",
      stripeReference: "mock",
    });
  },
});

// Current user's credit history (transaction list / receipts view).
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Credits a confirmed Stripe purchase. INTERNAL ONLY — it takes a userId and an
// amount with no auth check, so exposing it publicly would let anyone mint
// credits from the browser. It must be called from a Convex action/httpAction
// that has already verified the Stripe webhook signature.
//
// Idempotent: Stripe delivers `checkout.session.completed` more than once (and
// retries on any non-2xx), so a repeat delivery for a session we have already
// credited is a no-op rather than a second top-up.
// Balance + ledger update atomically.
export const recordPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    stripeReference: v.string(),
  },
  handler: async (ctx, { userId, amount, stripeReference }) => {
    const already = await ctx.db
      .query("creditTransactions")
      .withIndex("by_stripeReference", (q) =>
        q.eq("stripeReference", stripeReference),
      )
      .first();
    if (already) return { credited: false, reason: "already_processed" };

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { credits: (user.credits ?? 0) + amount });
    await ctx.db.insert("creditTransactions", {
      userId,
      amount,
      reason: "purchase",
      stripeReference,
    });
    return { credited: true };
  },
});

// Refund a job-post (or any) credit charge.
export const recordRefund = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    jobId: v.optional(v.id("jobs")),
    stripeReference: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, jobId, stripeReference }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { credits: (user.credits ?? 0) + amount });
    await ctx.db.insert("creditTransactions", {
      userId,
      amount,
      reason: "refund",
      jobId,
      stripeReference,
    });
  },
});
