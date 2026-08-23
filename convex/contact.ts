import { mutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "resend";

// Where admin emails go. Set ADMIN_EMAIL in the Convex env; it is not kept in
// code because this repo is public.
function adminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL is not set in the Convex environment");
  return email;
}
const MAX_PER_HOUR = 3;

// Anyone can call this — visitors are not signed in — so it is validated and
// rate limited. A public mutation that sends email is otherwise a spam relay.
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
    // Honeypot: hidden in the UI, so only a bot fills it in.
    website: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, message, website }) => {
    // Pretend success rather than erroring, so bots get no signal to adapt to.
    if (website) return { ok: true };

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    if (!cleanName || cleanName.length > 100) {
      throw new Error("Please enter your name.");
    }
    if (cleanEmail.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (cleanMessage.length < 10) {
      throw new Error("Please tell us a little more — at least 10 characters.");
    }
    if (cleanMessage.length > 5000) {
      throw new Error("That message is too long (5000 characters max).");
    }

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recent = await ctx.db
      .query("contactMessages")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .filter((q) => q.gt(q.field("_creationTime"), oneHourAgo))
      .collect();
    if (recent.length >= MAX_PER_HOUR) {
      throw new Error(
        "You've sent a few messages already — we'll come back to you shortly.",
      );
    }

    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("contactMessages", {
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      userId: userId ?? undefined,
    });

    await ctx.scheduler.runAfter(0, internal.contact.notifyAdmin, {
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      signedIn: userId !== null,
    });

    return { ok: true };
  },
});

// Emails the message onward. Reply-to is the sender, so replying from the inbox
// goes straight back to them — no separate mailbox needed on the domain.
export const notifyAdmin = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
    signedIn: v.boolean(),
  },
  handler: async (_ctx, { name, email, message, signedIn }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [adminEmail()],
      replyTo: email,
      subject: `Contact form: ${name}`,
      text:
        `New message from the RecommendUsUK contact form.\n\n` +
        `Name:  ${name}\n` +
        `Email: ${email}\n` +
        `Signed in: ${signedIn ? "yes" : "no"}\n\n` +
        `-----------------------------------------\n` +
        `${message}\n` +
        `-----------------------------------------\n\n` +
        `Just hit Reply — it goes straight back to them.`,
    });
  },
});

// Admin read of the stored messages (nothing renders this yet; the table is
// the durable record if an email is ever missed).
export const listAll = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("contactMessages").order("desc").take(100),
});
