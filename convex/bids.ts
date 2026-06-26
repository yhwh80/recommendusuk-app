import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { notify } from "./notifications";

// Bids on a job (job detail page).
export const listByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db
      .query("bids")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .order("desc")
      .collect();
  },
});

// Bids on a job enriched with the bidder's name/rating/recommended flag
// (replaces the Supabase `users!bids_professional_id_fkey(...)` join).
export const listByJobWithUser = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .order("desc")
      .collect();
    return await Promise.all(
      bids.map(async (bid) => {
        const pro = await ctx.db.get(bid.professionalId);
        return {
          ...bid,
          professionalName: pro?.name ?? null,
          professionalRating: pro?.totalRating ?? 0,
          professionalRecommended: pro?.isRecommended ?? false,
        };
      }),
    );
  },
});

// Current freelancer's bids (freelancer dashboard), each joined with its job.
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_professional", (q) => q.eq("professionalId", userId))
      .order("desc")
      .collect();
    return await Promise.all(
      bids.map(async (bid) => ({
        ...bid,
        job: await ctx.db.get(bid.jobId),
      })),
    );
  },
});

// Submit a bid: enforces the 3-bid max and bumps the job's bid counter.
export const create = mutation({
  args: {
    jobId: v.id("jobs"),
    amount: v.number(),
    message: v.string(),
  },
  handler: async (ctx, { jobId, amount, message }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.status !== "open") throw new Error("Job is not open for bids");
    if (job.clientId === userId) throw new Error("You cannot bid on your own job");
    if (job.currentBids >= job.maxBids) {
      throw new Error("This job has reached its maximum of 3 bids");
    }

    const existing = await ctx.db
      .query("bids")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .filter((q) => q.eq(q.field("professionalId"), userId))
      .first();
    if (existing) throw new Error("You have already bid on this job");

    const bidId = await ctx.db.insert("bids", {
      jobId,
      professionalId: userId,
      amount,
      message,
      status: "pending",
    });
    // Bump the counter and auto-close once the 3-bid cap is hit
    // (matches the original behaviour in the job detail page).
    const newCount = job.currentBids + 1;
    await ctx.db.patch(jobId, {
      currentBids: newCount,
      status: newCount >= job.maxBids ? "closed" : job.status,
    });
    await notify(ctx, {
      userId: job.clientId,
      type: "new_bid",
      message: `New proposal on "${job.title}"`,
      link: `/jobs/${jobId}`,
    });
    return bidId;
  },
});

// Edit your own pending bid (amount + message).
export const update = mutation({
  args: { bidId: v.id("bids"), amount: v.number(), message: v.string() },
  handler: async (ctx, { bidId, amount, message }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const bid = await ctx.db.get(bidId);
    if (!bid) throw new Error("Bid not found");
    if (bid.professionalId !== userId) throw new Error("Not your bid");
    if (bid.status !== "pending") {
      throw new Error("Only pending bids can be edited");
    }
    await ctx.db.patch(bidId, { amount, message });
  },
});

// Withdraw (delete) your own pending bid. Frees a slot — if the job had
// auto-closed at the bid cap and no one's hired, it re-opens for new bids.
export const withdraw = mutation({
  args: { bidId: v.id("bids") },
  handler: async (ctx, { bidId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const bid = await ctx.db.get(bidId);
    if (!bid) throw new Error("Bid not found");
    if (bid.professionalId !== userId) throw new Error("Not your bid");
    if (bid.status !== "pending") {
      throw new Error("Only pending bids can be withdrawn");
    }
    const job = await ctx.db.get(bid.jobId);
    await ctx.db.delete(bidId);
    if (job) {
      const newCount = Math.max(0, job.currentBids - 1);
      const reopen =
        job.status === "closed" &&
        !job.selectedProfessionalId &&
        newCount < job.maxBids;
      await ctx.db.patch(job._id, {
        currentBids: newCount,
        status: reopen ? "open" : job.status,
      });
    }
  },
});
