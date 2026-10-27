import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Prompts and model outputs contain what customers typed about their homes
// and jobs. They are kept long enough to debug and evaluate the assistant,
// then deleted. Decided before launch rather than left to a platform default.
export const AI_LOG_RETENTION_DAYS = 90;

export const purgeOldAiCalls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - AI_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("aiCalls")
      .withIndex("by_creation_time", (q) => q.lt("_creationTime", cutoff))
      .take(1000);
    for (const row of old) await ctx.db.delete(row._id);
    return old.length;
  },
});

function stats(values: number[]) {
  if (values.length === 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
  return { mean, sd };
}

// The job post assistant's success measures, from the roadmap:
//   npx convex run aiMetrics:jobPostAssistant '{"sinceDays": 30}'
// Bid price spread is the real success metric: when professionals understand a
// job, their quotes cluster. Abandonment is the thing most likely to get worse;
// if posts-with-assistant complete less often than without, turn it off.
export const jobPostAssistant = internalQuery({
  args: { sinceDays: v.optional(v.number()) },
  handler: async (ctx, { sinceDays }) => {
    const since = Date.now() - (sinceDays ?? 30) * 24 * 60 * 60 * 1000;

    const sessions = await ctx.db
      .query("postFormSessions")
      .withIndex("by_creation_time", (q) => q.gt("_creationTime", since))
      .collect();
    const completed = sessions.filter((s) => s.jobId).length;

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_creation_time", (q) => q.gt("_creationTime", since))
      .collect();

    const byOutcome: Record<
      string,
      { jobs: number; avgBids: number; avgBidSpread: number | null }
    > = {};
    const groups = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const key = job.assistantOutcome ?? "pre-assistant";
      groups.set(key, [...(groups.get(key) ?? []), job]);
    }
    for (const [outcome, group] of groups) {
      // Coefficient of variation (sd / mean) of each job's bid amounts, so
      // spreads on £50 jobs and £5,000 jobs can be averaged together.
      const spreads: number[] = [];
      let bidTotal = 0;
      for (const job of group) {
        const bids = await ctx.db
          .query("bids")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .collect();
        bidTotal += bids.length;
        const s = stats(bids.map((b) => b.amount));
        if (bids.length >= 2 && s && s.mean > 0) spreads.push(s.sd / s.mean);
      }
      byOutcome[outcome] = {
        jobs: group.length,
        avgBids: bidTotal / group.length,
        avgBidSpread: stats(spreads)?.mean ?? null,
      };
    }

    const calls = await ctx.db
      .query("aiCalls")
      .withIndex("by_creation_time", (q) => q.gt("_creationTime", since))
      .collect();

    return {
      sinceDays: sinceDays ?? 30,
      postForm: {
        started: sessions.length,
        completed,
        abandonmentRate: sessions.length
          ? 1 - completed / sessions.length
          : null,
      },
      byOutcome,
      aiCalls: {
        total: calls.length,
        failed: calls.filter((c) => !c.ok).length,
        costUsd: calls.reduce((a, c) => a + c.costUsd, 0),
        recentErrors: calls
          .filter((c) => !c.ok)
          .slice(-5)
          .map((c) => c.error),
      },
    };
  },
});
