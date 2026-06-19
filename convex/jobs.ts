import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const JOB_COST_CREDITS = 5;
const MAX_BIDS = 3;

// All open jobs (jobs page) — newest first.
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();
  },
});

// All jobs, optionally filtered by status.
export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("completed")),
    ),
  },
  handler: async (ctx, { status }) => {
    if (status) {
      return await ctx.db
        .query("jobs")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("jobs").order("desc").collect();
  },
});

// Jobs posted by the current client (client dashboard).
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("jobs")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

// Jobs enriched with the poster's name (replaces the Supabase
// `users!jobs_client_id_fkey(name)` join used on the browse page).
export const listWithClient = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("closed"), v.literal("completed")),
    ),
  },
  handler: async (ctx, { status }) => {
    const jobs = status
      ? await ctx.db
          .query("jobs")
          .withIndex("by_status", (q) => q.eq("status", status))
          .order("desc")
          .collect()
      : await ctx.db.query("jobs").order("desc").collect();
    return await Promise.all(
      jobs.map(async (job) => ({
        ...job,
        clientName: (await ctx.db.get(job.clientId))?.name ?? null,
      })),
    );
  },
});

// Single job + poster name (job detail page).
export const getWithClient = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    const job = await ctx.db.get(id);
    if (!job) return null;
    return { ...job, clientName: (await ctx.db.get(job.clientId))?.name ?? null };
  },
});

// Post a job: costs 5 credits. The job insert, the balance update, and the
// ledger row all commit together in this one atomic mutation — the drift the
// original two-call Supabase code risked is impossible here.
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    budgetMin: v.number(),
    budgetMax: v.number(),
    skills: v.optional(v.array(v.string())),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if ((user.credits ?? 0) < JOB_COST_CREDITS) {
      throw new Error(
        `Insufficient credits. You need ${JOB_COST_CREDITS} credits to post a job.`,
      );
    }

    const jobId = await ctx.db.insert("jobs", {
      clientId: userId,
      categoryId: args.categoryId,
      title: args.title,
      description: args.description,
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      skills: args.skills,
      deadline: args.deadline,
      costCredits: JOB_COST_CREDITS,
      status: "open",
      maxBids: MAX_BIDS,
      currentBids: 0,
    });

    await ctx.db.patch(userId, {
      credits: (user.credits ?? 0) - JOB_COST_CREDITS,
    });
    await ctx.db.insert("creditTransactions", {
      userId,
      amount: -JOB_COST_CREDITS,
      reason: "job_post",
      jobId,
    });
    return jobId;
  },
});

// Client selects a winning bid and closes the job.
export const acceptBid = mutation({
  args: { jobId: v.id("jobs"), bidId: v.id("bids") },
  handler: async (ctx, { jobId, bidId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");

    const bid = await ctx.db.get(bidId);
    if (!bid || bid.jobId !== jobId) throw new Error("Bid not found for this job");

    await ctx.db.patch(bidId, { status: "accepted" });
    await ctx.db.patch(jobId, {
      status: "closed",
      acceptedBidId: bidId,
      selectedProfessionalId: bid.professionalId,
    });
  },
});

// Mark a job complete.
export const complete = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");
    await ctx.db.patch(jobId, { status: "completed" });
  },
});
