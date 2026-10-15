import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
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

// A worker's past customer reviewing them through the worker's "review me"
// link. The reviewer must be signed in with a hirer account, which is also how
// these customers end up on the site to post their own jobs. These reviews
// count towards the star average but not towards jobs completed or the
// Recommended badge, which are earned only through jobs booked on the site.
export const createInvited = mutation({
  args: {
    revieweeId: v.id("users"),
    rating: v.number(),
    reviewText: v.string(),
    recommended: v.boolean(),
  },
  handler: async (ctx, args) => {
    const reviewerId = await getAuthUserId(ctx);
    if (reviewerId === null) throw new ConvexError("Not authenticated");
    if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5) {
      throw new ConvexError("Rating must be between 1 and 5");
    }
    const reviewText = args.reviewText.trim();
    if (reviewText.length < 10) {
      throw new ConvexError("Please write a few words about the work");
    }
    if (reviewText.length > 2000) throw new ConvexError("Review is too long");

    const reviewer = await ctx.db.get(reviewerId);
    if (reviewer?.role !== "client") {
      throw new ConvexError("Reviews must come from a customer (hirer) account");
    }
    const reviewee = await ctx.db.get(args.revieweeId);
    if (!reviewee || reviewee.role !== "freelancer") {
      throw new ConvexError("That worker could not be found");
    }

    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", args.revieweeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("reviewerId"), reviewerId),
          q.eq(q.field("source"), "invited"),
        ),
      )
      .first();
    if (existing) throw new ConvexError("You've already reviewed this worker");

    const ratingId = await ctx.db.insert("ratings", {
      revieweeId: args.revieweeId,
      reviewerId,
      rating: args.rating,
      reviewText,
      recommended: args.recommended,
      source: "invited",
    });

    const all = await ctx.db
      .query("ratings")
      .withIndex("by_reviewee", (q) => q.eq("revieweeId", args.revieweeId))
      .collect();
    await ctx.db.patch(args.revieweeId, {
      totalRating: all.reduce((s, r) => s + r.rating, 0) / all.length,
    });
    await notify(ctx, {
      userId: args.revieweeId,
      type: "new_review",
      message: `A past customer left you a ${args.rating}-star review ⭐`,
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
