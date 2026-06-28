import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// A user's portfolio items (photos + videos), newest first.
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("portfolio")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Add an uploaded file (image or video) to the current user's portfolio.
export const add = mutation({
  args: {
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { storageId, mediaType, caption }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Upload not found");
    return await ctx.db.insert("portfolio", {
      userId,
      storageId,
      url,
      mediaType,
      caption,
    });
  },
});

// Remove one of your own portfolio items (also deletes the stored file).
export const remove = mutation({
  args: { itemId: v.id("portfolio") },
  handler: async (ctx, { itemId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not your item");
    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(itemId);
  },
});
