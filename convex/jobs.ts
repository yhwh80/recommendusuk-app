import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { notify } from "./notifications";

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

// Job leads for the current freelancer: open jobs, with the ones matching their
// skills (or area) shown first and flagged. Powers the "Job Leads for you" feed.
export const leadsForMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const me = await ctx.db.get(userId);
    const mySkills = (me?.skills ?? []).map((s) => s.toLowerCase());
    const myArea = (me?.location ?? "").toLowerCase().trim();

    const open = await ctx.db
      .query("jobs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      open.map(async (job) => {
        const jobSkills = (job.skills ?? []).map((s) => s.toLowerCase());
        const skillMatch =
          mySkills.length > 0 && jobSkills.some((s) => mySkills.includes(s));
        const areaMatch =
          !!myArea &&
          !!job.location &&
          job.location.toLowerCase().includes(myArea);
        return {
          ...job,
          clientName: (await ctx.db.get(job.clientId))?.name ?? null,
          matchesYou: skillMatch || areaMatch,
        };
      }),
    );
    // Matching leads first (recency preserved within each group).
    enriched.sort((a, b) => Number(b.matchesYou) - Number(a.matchesYou));
    return enriched;
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
        categoryName: job.categoryId
          ? ((await ctx.db.get(job.categoryId))?.name ?? null)
          : null,
      })),
    );
  },
});

// Single job + poster name + category (job detail page).
export const getWithClient = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    const job = await ctx.db.get(id);
    if (!job) return null;
    return {
      ...job,
      clientName: (await ctx.db.get(job.clientId))?.name ?? null,
      categoryName: job.categoryId
        ? ((await ctx.db.get(job.categoryId))?.name ?? null)
        : null,
    };
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
    location: v.optional(v.string()),
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
      location: args.location,
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
    if (job.status === "completed") throw new Error("Job is already completed");
    if (job.selectedProfessionalId) {
      throw new Error("You've already hired a freelancer for this job");
    }

    const bid = await ctx.db.get(bidId);
    if (!bid || bid.jobId !== jobId) throw new Error("Bid not found for this job");

    await ctx.db.patch(bidId, { status: "accepted" });
    await ctx.db.patch(jobId, {
      status: "closed",
      acceptedBidId: bidId,
      selectedProfessionalId: bid.professionalId,
    });
    await notify(ctx, {
      userId: bid.professionalId,
      type: "bid_accepted",
      message: `Your proposal for "${job.title}" was accepted 🎉`,
      link: `/jobs/${jobId}`,
    });
  },
});

// Mark a job complete (owner only; only after a freelancer has been hired).
export const complete = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");
    if (!job.selectedProfessionalId) {
      throw new Error("Accept a freelancer's proposal before marking complete");
    }
    if (job.status === "completed") throw new Error("Job is already completed");
    await ctx.db.patch(jobId, { status: "completed", completedAt: Date.now() });
    await notify(ctx, {
      userId: job.selectedProfessionalId,
      type: "job_completed",
      message: `"${job.title}" was marked complete — leave it on your record!`,
      link: `/jobs/${jobId}`,
    });
  },
});

// Edit an OPEN job (owner only). Once a job is closed/completed it's locked.
export const update = mutation({
  args: {
    jobId: v.id("jobs"),
    title: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
    budgetMin: v.number(),
    budgetMax: v.number(),
    skills: v.optional(v.array(v.string())),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");
    if (job.status !== "open") {
      throw new Error("Only open jobs can be edited");
    }
    const { jobId, ...fields } = args;
    await ctx.db.patch(jobId, fields);
  },
});

// Delete/cancel a job (owner only). Removes the job and any bids on it.
// Refunds the 5-credit posting cost ONLY if no one has bid yet — otherwise a
// client could post, read proposals, delete for a refund, and repost for free.
export const remove = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");

    const refundEligible = job.currentBids === 0;

    // Remove any bids attached to the job first (avoid orphans).
    const bids = await ctx.db
      .query("bids")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();
    for (const b of bids) await ctx.db.delete(b._id);

    await ctx.db.delete(jobId);

    if (refundEligible) {
      const user = await ctx.db.get(userId);
      if (user) {
        await ctx.db.patch(userId, {
          credits: (user.credits ?? 0) + job.costCredits,
        });
        // No jobId on the ledger row — the job no longer exists.
        await ctx.db.insert("creditTransactions", {
          userId,
          amount: job.costCredits,
          reason: "refund",
        });
      }
    }
    return { refunded: refundEligible ? job.costCredits : 0 };
  },
});
