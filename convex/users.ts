import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Current logged-in user's profile (replaces: select * from users where id = session.user.id)
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

// Public profile view — curated fields only (no email/credits), plus a couple of
// derived stats. Powers /profile/[id].
export const getPublicProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const u = await ctx.db.get(id);
    if (!u) return null;
    const bidCount = (
      await ctx.db
        .query("bids")
        .withIndex("by_professional", (q) => q.eq("professionalId", id))
        .collect()
    ).length;
    return {
      _id: u._id,
      name: u.name ?? null,
      role: u.role ?? null,
      bio: u.bio ?? null,
      skills: u.skills ?? [],
      hourlyRate: u.hourlyRate ?? null,
      location: u.location ?? null,
      profilePictureUrl: u.profilePictureUrl ?? null,
      totalRating: u.totalRating ?? 0,
      totalJobsCompleted: u.totalJobsCompleted ?? 0,
      isRecommended: u.isRecommended ?? false,
      bidCount,
    };
  },
});

// Directory of freelancers (role freelancer or both). Powers /freelancers.
export const listFreelancers = query({
  args: {},
  handler: async (ctx) => {
    const freelancers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "freelancer"))
      .collect();
    const both = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "both"))
      .collect();
    return [...freelancers, ...both].map((u) => ({
      _id: u._id,
      name: u.name ?? null,
      profilePictureUrl: u.profilePictureUrl ?? null,
      bio: u.bio ?? null,
      skills: u.skills ?? [],
      hourlyRate: u.hourlyRate ?? null,
      location: u.location ?? null,
      totalRating: u.totalRating ?? 0,
      totalJobsCompleted: u.totalJobsCompleted ?? 0,
      isRecommended: u.isRecommended ?? false,
    }));
  },
});

// Step 1 of photo upload: get a short-lived URL to PUT the image bytes to.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: save the uploaded file as the user's profile picture.
export const setProfileImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const url = await ctx.storage.getUrl(storageId);
    await ctx.db.patch(userId, { profilePictureUrl: url ?? undefined });
  },
});

// Update own profile (name, picture, bio, skills, hourly rate, location).
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    await ctx.db.patch(userId, args);
  },
});
