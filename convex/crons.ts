import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "purge old AI call logs",
  { hourUTC: 3, minuteUTC: 0 },
  internal.aiMetrics.purgeOldAiCalls,
);

export default crons;
