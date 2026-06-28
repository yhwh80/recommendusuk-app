import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./ResendOTP";
import { internal } from "./_generated/api";

// Email/password auth, replacing Supabase Auth. The `profile` callback runs on
// sign-up: it captures name + role and grants the free signup credits the old
// app gave (clients 25, freelancers 10 — per the README's signup bonuses).
// `verify: ResendOTP` requires the user to confirm their email with a code.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      verify: ResendOTP,
      profile(params) {
        const role =
          (params.role as "client" | "freelancer" | "both") ?? "client";
        return {
          email: params.email as string,
          name: (params.name as string) ?? "",
          role,
          credits: role === "client" ? 25 : 10,
          totalRating: 0,
          totalJobsCompleted: 0,
          isRecommended: false,
        };
      },
    }),
  ],
  callbacks: {
    // On first creation only, record the signup credits in the ledger so the
    // balance set above has a matching history row from day one.
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      const user = await ctx.db.get(userId);
      const bonus = user?.credits ?? 0;
      if (bonus > 0) {
        await ctx.db.insert("creditTransactions", {
          userId,
          amount: bonus,
          reason: "signup_bonus",
        });
      }
      // Email Simon that someone new joined (runs as an action — can't fetch
      // from inside a mutation, so we schedule it).
      await ctx.scheduler.runAfter(0, internal.adminAlerts.newSignup, {
        name: user?.name ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "user",
      });
    },
  },
});
