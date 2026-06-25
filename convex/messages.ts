import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// All messages involving the current user (both sent and received).
async function myMessages(ctx: QueryCtx, userId: Id<"users">) {
  const received = await ctx.db
    .query("messages")
    .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
    .collect();
  const sent = await ctx.db
    .query("messages")
    .withIndex("by_sender", (q) => q.eq("senderId", userId))
    .collect();
  return [...received, ...sent];
}

// Inbox: one row per person the current user has a conversation with, newest
// first, with the last message snippet and how many are unread.
export const conversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const all = await myMessages(ctx, userId);

    // Group by the OTHER participant.
    const byOther = new Map<string, typeof all>();
    for (const m of all) {
      const other = m.senderId === userId ? m.recipientId : m.senderId;
      const arr = byOther.get(other) ?? [];
      arr.push(m);
      byOther.set(other, arr);
    }

    const rows = await Promise.all(
      [...byOther.entries()].map(async ([otherId, msgs]) => {
        msgs.sort((a, b) => b._creationTime - a._creationTime);
        const last = msgs[0];
        const unread = msgs.filter(
          (m) => m.recipientId === userId && m.readAt === undefined,
        ).length;
        const other = await ctx.db.get(otherId as Id<"users">);
        return {
          otherId: otherId as Id<"users">,
          otherName: other?.name ?? "User",
          lastBody: last.body,
          lastAt: last._creationTime,
          lastFromMe: last.senderId === userId,
          unread,
        };
      }),
    );
    rows.sort((a, b) => b.lastAt - a.lastAt);
    return rows;
  },
});

// Full thread between the current user and another user (both directions).
export const thread = query({
  args: { otherId: v.id("users") },
  handler: async (ctx, { otherId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const all = await myMessages(ctx, userId);
    const msgs = all
      .filter((m) => m.senderId === otherId || m.recipientId === otherId)
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((m) => ({
        _id: m._id,
        body: m.body,
        at: m._creationTime,
        fromMe: m.senderId === userId,
      }));
    const other = await ctx.db.get(otherId);
    return { otherName: other?.name ?? "User", messages: msgs };
  },
});

// Total unread messages — for the nav badge / notifications.
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return 0;
    const received = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .collect();
    return received.filter((m) => m.readAt === undefined).length;
  },
});

// Send a message. Sender identity comes from the session, never the client.
export const send = mutation({
  args: {
    recipientId: v.id("users"),
    body: v.string(),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, { recipientId, body, jobId }) => {
    const senderId = await getAuthUserId(ctx);
    if (senderId === null) throw new Error("Not authenticated");
    if (senderId === recipientId) throw new Error("Cannot message yourself");
    if (!body.trim()) throw new Error("Message is empty");
    return await ctx.db.insert("messages", {
      senderId,
      recipientId,
      body: body.trim(),
      jobId,
    });
  },
});

// Mark every message from `otherId` to me as read (open a conversation).
export const markThreadRead = mutation({
  args: { otherId: v.id("users") },
  handler: async (ctx, { otherId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("senderId"), otherId),
          q.eq(q.field("readAt"), undefined),
        ),
      )
      .collect();
    for (const m of unread) await ctx.db.patch(m._id, { readAt: Date.now() });
  },
});
