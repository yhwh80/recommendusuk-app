import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

type NotifType = "bid_accepted" | "new_bid" | "new_review" | "job_completed";

// Shared helper — called from other mutations (acceptBid, complete, bids.create,
// ratings.create) to drop a notification for a user. Not a public function.
export async function notify(
  ctx: MutationCtx,
  args: { userId: Id<"users">; type: NotifType; message: string; link?: string },
) {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    message: args.message,
    link: args.link,
  });
}

// Current user's notifications, newest first.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// Unread count — for the 🔔 badge.
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return 0;
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.filter((n) => n.readAt === undefined).length;
  },
});

// Mark all of the current user's notifications read (called when they open the page).
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .collect();
    const now = Date.now();
    for (const n of unread) await ctx.db.patch(n._id, { readAt: now });
  },
});
