import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Inbox: messages addressed to the current user, newest first.
export const inbox = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .order("desc")
      .collect();
  },
});

// Conversation thread attached to a job.
export const listByJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .order("asc")
      .collect();
  },
});

// Send a message. Sender identity is taken from the session, never the client.
export const send = mutation({
  args: {
    recipientId: v.id("users"),
    body: v.string(),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, { recipientId, body, jobId }) => {
    const senderId = await getAuthUserId(ctx);
    if (senderId === null) throw new Error("Not authenticated");
    if (senderId === recipientId) {
      throw new Error("Cannot message yourself");
    }
    return await ctx.db.insert("messages", {
      senderId,
      recipientId,
      body,
      jobId,
    });
  },
});

// Mark a received message as read.
export const markRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const message = await ctx.db.get(messageId);
    if (!message) throw new Error("Message not found");
    if (message.recipientId !== userId) {
      throw new Error("Not your message");
    }
    if (message.readAt === undefined) {
      await ctx.db.patch(messageId, { readAt: Date.now() });
    }
  },
});
