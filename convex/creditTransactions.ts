import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// DEV-ONLY mock top-up: credits the CURRENTLY authenticated user (so it can't
// be abused to credit others). Used by the buy-credits page when Stripe is in
// mock mode. Production purchases go through `recordPurchase` from the webhook.
export const purchaseMock = mutation({
  args: { credits: v.number() },
  handler: async (ctx, { credits }) => {
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

// Called server-side from the Stripe webhook (via ConvexHttpClient) once a
// payment is confirmed. Public so the trusted Next.js route can call it — that
// route verifies the Stripe signature first. For full production hardening,
// move this logic into a Convex httpAction so the secret never leaves Convex.
// Balance + ledger update atomically.
export const recordPurchase = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    stripeReference: v.string(),
  },
  handler: async (ctx, { userId, amount, stripeReference }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { credits: (user.credits ?? 0) + amount });
    await ctx.db.insert("creditTransactions", {
      userId,
      amount,
      reason: "purchase",
      stripeReference,
    });
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
