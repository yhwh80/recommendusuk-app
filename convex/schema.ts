import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// RecommendUsUK Marketplace — recreated in Convex from the Supabase schema,
// extended with categories, a credit ledger, and messaging (data layer first;
// UI can be wired on top later). Convex auto-adds `_id` and `_creationTime`,
// so the old `id` / `created_at` columns are dropped. Postgres foreign keys
// become `v.id("table")` refs.
export default defineSchema({
  // Convex Auth tables (authSessions, authAccounts, etc.). We override `users`
  // below so a single table holds BOTH the auth identity and the app profile —
  // mirroring the original where `users.id` was the Supabase Auth UID.
  ...authTables,

  users: defineTable({
    // --- auth identity fields (populated by Convex Auth) ---
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    // --- app profile fields (set on signup, optional so auth can create first) ---
    role: v.optional(
      v.union(v.literal("client"), v.literal("freelancer"), v.literal("both")),
    ),
    profilePictureUrl: v.optional(v.string()),
    // Cached running balance — the creditTransactions ledger is the source of
    // truth; this field is updated in the SAME atomic mutation so it can't drift.
    credits: v.optional(v.number()),
    totalRating: v.optional(v.number()),
    totalJobsCompleted: v.optional(v.number()),
    isRecommended: v.optional(v.boolean()),
    // --- public profile (parity with the green static-marketplace version) ---
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    location: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_role", ["role"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  jobs: defineTable({
    clientId: v.id("users"),
    categoryId: v.optional(v.id("categories")),
    title: v.string(),
    description: v.string(),
    budgetMin: v.number(),
    budgetMax: v.number(),
    costCredits: v.number(),
    location: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    deadline: v.optional(v.number()),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("completed"),
    ),
    maxBids: v.number(),
    currentBids: v.number(),
    selectedProfessionalId: v.optional(v.id("users")),
    acceptedBidId: v.optional(v.id("bids")),
    completedAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_category", ["categoryId"]),

  bids: defineTable({
    jobId: v.id("jobs"),
    professionalId: v.id("users"),
    amount: v.number(),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
  })
    .index("by_job", ["jobId"])
    .index("by_professional", ["professionalId"]),

  ratings: defineTable({
    jobId: v.id("jobs"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    rating: v.number(),
    reviewText: v.string(),
    recommended: v.boolean(),
    responseText: v.optional(v.string()),
  })
    .index("by_job", ["jobId"])
    .index("by_reviewee", ["revieweeId"]),

  // Append-only money trail. Every balance change (signup bonus, the 5-credit
  // job-post deduction, Stripe top-ups, refunds) writes a row here in the same
  // atomic mutation that updates users.credits — so balance and history agree.
  creditTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // positive = credit, negative = debit
    reason: v.union(
      v.literal("signup_bonus"),
      v.literal("job_post"),
      v.literal("purchase"),
      v.literal("refund"),
    ),
    jobId: v.optional(v.id("jobs")),
    stripeReference: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Direct messages between users, optionally tied to a job.
  messages: defineTable({
    jobId: v.optional(v.id("jobs")),
    senderId: v.id("users"),
    recipientId: v.id("users"),
    body: v.string(),
    readAt: v.optional(v.number()),
  })
    .index("by_job", ["jobId"])
    .index("by_recipient", ["recipientId"])
    .index("by_sender", ["senderId"]),
});
