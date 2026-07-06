import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// Generic transactional email sender (scheduled from notify()). Runs as an
// action because sending email is a network call.
export const sendUserEmail = internalAction({
  args: { to: v.string(), subject: v.string(), text: v.string() },
  handler: async (_ctx, { to, subject, text }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [to],
      subject,
      text,
    });
  },
});
