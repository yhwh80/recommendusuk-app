import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { notify } from "./notifications";

// Ratings received by a user (their reputation).
export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", userId))
      .order("desc")
      .collect();
  },
});

// Reviews left on a specific job (used to show/lock the review form).
export const forJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();
  },
});

// Leave a 5-star rating + "I recommend" flag, and roll it into the reviewee's totals.
export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    revieweeId: v.id("users"),
    rating: v.number(),
    reviewText: v.string(),
    recommended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const reviewerId = await getAuthUserId(ctx);
    if (reviewerId === null) throw new Error("Not authenticated");
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // One review per reviewer per job.
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .filter((q) => q.eq(q.field("reviewerId"), reviewerId))
      .first();
    if (existing) throw new Error("You've already reviewed this job");

    const ratingId = await ctx.db.insert("ratings", {
      jobId: args.jobId,
      reviewerId,
      revieweeId: args.revieweeId,
      rating: args.rating,
      reviewText: args.reviewText,
      recommended: args.recommended,
    });

    // Recompute the reviewee's aggregate rating + completed count.
    const all = await ctx.db
      .query("ratings")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", args.revieweeId))
      .collect();
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    const reviewee = await ctx.db.get(args.revieweeId);
    await ctx.db.patch(args.revieweeId, {
      totalRating: avg,
      totalJobsCompleted: (reviewee?.totalJobsCompleted ?? 0) + 1,
      isRecommended: args.recommended || (reviewee?.isRecommended ?? false),
    });
    await notify(ctx, {
      userId: args.revieweeId,
      type: "new_review",
      message: `You received a ${args.rating}-star review ⭐`,
      link: `/profile/${args.revieweeId}`,
    });
    return ratingId;
  },
});

// Reviewee responds to a review they received.
export const respond = mutation({
  args: { ratingId: v.id("ratings"), responseText: v.string() },
  handler: async (ctx, { ratingId, responseText }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const rating = await ctx.db.get(ratingId);
    if (!rating) throw new Error("Rating not found");
    if (rating.revieweeId !== userId) {
      throw new Error("Not your review to respond to");
    }
    await ctx.db.patch(ratingId, { responseText });
  },
});
