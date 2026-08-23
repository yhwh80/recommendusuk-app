import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { JOB_POST_COST_CREDITS } from "./pricing";
import { notify } from "./notifications";

const MAX_BIDS = 3;

// Posting is free, so nothing naturally limits how many jobs one account can
// open. This is not really an anti-spam measure — it is there to protect the
// product professionals are paying for. Every junk lead is money a pro spent
// for nothing, and pros who feel burned do not buy a second pack.
// Nobody legitimately needs more than a handful of live jobs at once.
const MAX_OPEN_JOBS_PER_CLIENT = 5;

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

// Post a job. Free for customers — professionals pay for the leads instead
// (see convex/pricing.ts). Charging the customer to ask for a quote is the
// quickest way to end up with no jobs, and therefore no professionals.
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

    const openJobs = await ctx.db
      .query("jobs")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();
    if (openJobs.length >= MAX_OPEN_JOBS_PER_CLIENT) {
      throw new Error(
        `You can have up to ${MAX_OPEN_JOBS_PER_CLIENT} open jobs at once. ` +
          `Close or complete one before posting another.`,
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
      costCredits: JOB_POST_COST_CREDITS,
      status: "open",
      maxBids: MAX_BIDS,
      currentBids: 0,
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
// Deleting a job refunds every professional who paid to bid on it. They spent
// credits on a lead that has now evaporated through no fault of their own, and
// nothing erodes trust in a leads marketplace faster than charging for those.
// The client pays nothing to post, so there is nothing to refund them.
export const remove = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.clientId !== userId) throw new Error("Not your job");

    const bids = await ctx.db
      .query("bids")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    // Refund each bidder what they actually paid, then remove the bid.
    let refundedCredits = 0;
    for (const bid of bids) {
      const cost = bid.costCredits ?? 0;
      if (cost > 0) {
        const bidder = await ctx.db.get(bid.professionalId);
        if (bidder) {
          await ctx.db.patch(bid.professionalId, {
            credits: (bidder.credits ?? 0) + cost,
          });
          // No jobId on the ledger row — the job is about to stop existing.
          await ctx.db.insert("creditTransactions", {
            userId: bid.professionalId,
            amount: cost,
            reason: "refund",
          });
          refundedCredits += cost;
          await notify(ctx, {
            userId: bid.professionalId,
            type: "bid_refunded",
            message: `"${job.title}" was withdrawn by the customer — your ${cost} ${
              cost === 1 ? "credit has" : "credits have"
            } been refunded`,
            link: "/my-bids",
          });
        }
      }
      await ctx.db.delete(bid._id);
    }

    await ctx.db.delete(jobId);

    return { refundedBidders: bids.length, refundedCredits };
  },
});
