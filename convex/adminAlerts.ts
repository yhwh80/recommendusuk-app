import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// Where new-signup alerts go. Override by setting ADMIN_EMAIL in Convex env.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "sgpyhwh1980@gmail.com";

// Emails Simon whenever someone new joins. Scheduled from the auth signup hook.
export const newSignup = internalAction({
  args: { name: v.string(), email: v.string(), role: v.string() },
  handler: async (_ctx, { name, email, role }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [ADMIN_EMAIL],
      subject: `🎉 New ${role} signup: ${name || email}`,
      text:
        `Someone just joined RecommendUsJobsUK:\n\n` +
        `Name:  ${name || "(not given)"}\n` +
        `Email: ${email}\n` +
        `Role:  ${role}\n\n` +
        `https://recommendusjobsuk.com`,
    });
  },
});
