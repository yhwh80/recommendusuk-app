import { query } from "./_generated/server";

// Marketplace headline numbers for the landing page.
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const jobs = await ctx.db.query("jobs").collect();
    return {
      totalJobs: jobs.length,
      totalFreelancers: users.filter(
        (u) => u.role === "freelancer" || u.role === "both",
      ).length,
      totalClients: users.filter(
        (u) => u.role === "client" || u.role === "both",
      ).length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
    };
  },
});
