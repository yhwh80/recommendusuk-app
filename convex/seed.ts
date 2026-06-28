import { internalMutation } from "./_generated/server";

// Grandfather existing accounts (created before email verification was added)
// as verified, so they can still log in. New signups still verify by code.
//   npx convex run seed:grandfatherVerified --prod
export const grandfatherVerified = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let n = 0;
    for (const u of users) {
      if (u.emailVerificationTime === undefined && u.email) {
        await ctx.db.patch(u._id, { emailVerificationTime: Date.now() });
        n++;
      }
    }
    return `Grandfathered ${n} existing user(s) as verified.`;
  },
});

// Categories only — safe for production (no demo users/jobs). Idempotent.
//   npx convex run seed:categoriesOnly --prod
export const categoriesOnly = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) return "Categories already exist — skipping.";
    const CATEGORIES = [
      ["Home & Garden", "home-garden", "Cleaning, gardening, handyman, decorating"],
      ["Trades", "trades", "Plumbing, electrical, building, roofing"],
      ["Digital & Creative", "digital-creative", "Web, design, video, marketing"],
      ["Business Services", "business-services", "Admin, bookkeeping, consulting"],
      ["Events", "events", "Photography, catering, entertainment"],
      ["Tuition & Lessons", "tuition-lessons", "Driving, music, academic tutoring"],
    ] as const;
    for (const [name, slug, description] of CATEGORIES) {
      await ctx.db.insert("categories", { name, slug, description });
    }
    return `Seeded ${CATEGORIES.length} categories.`;
  },
});

// Wipes demo + reference data (NOT real auth users). Run with:
//   npx convex run seed:reset
// Then re-seed with seed:run.
export const reset = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const table of [
      "categories",
      "jobs",
      "bids",
      "ratings",
      "creditTransactions",
      "messages",
    ] as const) {
      for (const doc of await ctx.db.query(table).collect()) {
        await ctx.db.delete(doc._id);
      }
    }
    // Profile-only demo users (identified by their demo email domain).
    for (const u of await ctx.db.query("users").collect()) {
      if (u.email?.endsWith("@demo.recommendusuk.com")) {
        await ctx.db.delete(u._id);
      }
    }
    return "Cleared demo + reference data.";
  },
});

// Seeds reference + demo data. Run with:  npx convex run seed:run
// Idempotent-ish: skips if categories already exist.
//
// NOTE: demo users are inserted as profile-only rows (no auth credentials),
// so they populate listings/dashboards but cannot log in. Real users come
// through the Convex Auth signup flow. Safe to delete demo rows anytime.
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").first();
    if (existing) {
      return "Already seeded — skipping.";
    }

    const CATEGORIES = [
      ["Home & Garden", "home-garden", "Cleaning, gardening, handyman, decorating"],
      ["Trades", "trades", "Plumbing, electrical, building, roofing"],
      ["Digital & Creative", "digital-creative", "Web, design, video, marketing"],
      ["Business Services", "business-services", "Admin, bookkeeping, consulting"],
      ["Events", "events", "Photography, catering, entertainment"],
      ["Tuition & Lessons", "tuition-lessons", "Driving, music, academic tutoring"],
    ] as const;

    const categoryIds: Record<string, any> = {};
    for (const [name, slug, description] of CATEGORIES) {
      categoryIds[slug] = await ctx.db.insert("categories", {
        name,
        slug,
        description,
      });
    }

    // Demo client + freelancer (profile-only).
    const clientId = await ctx.db.insert("users", {
      name: "Demo Client",
      email: "client@demo.recommendusuk.com",
      role: "client",
      credits: 20,
      totalRating: 0,
      totalJobsCompleted: 0,
      isRecommended: false,
    });
    await ctx.db.insert("creditTransactions", {
      userId: clientId,
      amount: 25,
      reason: "signup_bonus",
    });

    const proId = await ctx.db.insert("users", {
      name: "Demo Freelancer",
      email: "pro@demo.recommendusuk.com",
      role: "freelancer",
      credits: 10,
      totalRating: 5,
      totalJobsCompleted: 1,
      isRecommended: true,
      bio: "Full-stack web developer specialising in fast, modern sites for UK small businesses. 8+ years building React/Next.js apps.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind", "Stripe"],
      hourlyRate: 45,
      location: "Brighton, UK",
    });
    await ctx.db.insert("creditTransactions", {
      userId: proId,
      amount: 10,
      reason: "signup_bonus",
    });

    // A posted job (client spent 5 credits) + the matching ledger row.
    const jobId = await ctx.db.insert("jobs", {
      clientId,
      categoryId: categoryIds["digital-creative"],
      title: "Build a small business website",
      description:
        "Need a 5-page responsive site for a local UK trades business. Modern, fast, with a contact form.",
      budgetMin: 40000, // stored in pence → £400
      budgetMax: 80000, // → £800
      costCredits: 5,
      status: "open",
      maxBids: 3,
      currentBids: 1,
    });
    await ctx.db.insert("creditTransactions", {
      userId: clientId,
      amount: -5,
      reason: "job_post",
      jobId,
    });

    // A bid on that job.
    await ctx.db.insert("bids", {
      jobId,
      professionalId: proId,
      amount: 65000, // £650 in pence
      message:
        "I build fast Next.js sites for UK small businesses — happy to share a portfolio. Can deliver in 2 weeks.",
      status: "pending",
    });

    // A completed rating for the freelancer.
    await ctx.db.insert("ratings", {
      jobId,
      reviewerId: clientId,
      revieweeId: proId,
      rating: 5,
      reviewText: "Excellent work, fast and professional. Highly recommend.",
      recommended: true,
    });

    return "Seeded: 6 categories, 2 demo users, 1 job, 1 bid, 1 rating, 3 ledger rows.";
  },
});
