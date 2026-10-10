import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

// Where admin emails go. Set ADMIN_EMAIL in the Convex env; it is not kept in
// code because this repo is public.
function adminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL is not set in the Convex environment");
  return email;
}

// Emails Simon whenever someone new joins. Scheduled from the auth signup hook.
export const newSignup = internalAction({
  args: { name: v.string(), email: v.string(), role: v.string() },
  handler: async (_ctx, { name, email, role }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "RecommendUsJobsUK <noreply@recommendusjobsuk.com>",
      to: [adminEmail()],
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
