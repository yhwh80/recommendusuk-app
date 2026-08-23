import { v } from "convex/values";
import Stripe from "stripe";
import { action, internalQuery, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Credit amounts live here, on the server, so a tampered client cannot ask for
// a package that grants more credits than it pays for. The Price ID (and so the
// amount charged) comes from Convex env, set by `npm run stripe:products`.
// Test and live mode hold different Price IDs, hence separate deployments.
const PACKAGES: Record<string, { credits: number; envVar: string }> = {
  credits_10: { credits: 10, envVar: "STRIPE_PRICE_CREDITS_10" },
  credits_25: { credits: 25, envVar: "STRIPE_PRICE_CREDITS_25" },
  credits_50: { credits: 50, envVar: "STRIPE_PRICE_CREDITS_50" },
  credits_100: { credits: 100, envVar: "STRIPE_PRICE_CREDITS_100" },
};

// Convex's default runtime has no Node http stack, so Stripe must be told to
// use fetch. Signature checks likewise need the async/WebCrypto variants.
function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Card payments are not enabled yet");
  return new Stripe(key, {
    apiVersion: "2025-08-27.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const getUserEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.email;
  },
});

// Creates a Stripe-hosted Checkout session for the CURRENT user. The caller
// only names a package — never a price or a credit amount — so the browser has
// no say in what is charged or granted.
export const createCheckoutSession = action({
  args: { packageId: v.string() },
  handler: async (ctx, { packageId }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const pkg = PACKAGES[packageId];
    if (!pkg) throw new Error("Invalid package");

    const priceId = process.env[pkg.envVar];
    if (!priceId) throw new Error("Card payments are not enabled yet");

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) throw new Error("SITE_URL is not set on this deployment");

    const email = await ctx.runQuery(internal.stripe.getUserEmail, { userId });

    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/buy-credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/buy-credits?cancelled=true`,
      // Lets Stripe email the receipt the success page promises. Convex turns
      // a missing value into null on the way out of runQuery; Stripe wants
      // undefined.
      customer_email: email ?? undefined,
      allow_promotion_codes: true,
      // Read back by the webhook to decide who to credit, and how much.
      metadata: { userId, packageId, credits: String(pkg.credits) },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  },
});

// Stripe posts here directly. The signing secret never leaves Convex, so the
// VPS holds no Stripe credentials at all.
export const webhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return new Response("Stripe is not configured on this deployment", {
      status: 503,
    });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  // Must be the raw body — any reserialisation invalidates the signature.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") break;

      const { userId, credits } = session.metadata ?? {};
      const amount = Number(credits);
      if (!userId || !Number.isFinite(amount) || amount <= 0) {
        // The customer has paid and we cannot tell who to credit. Fail loudly
        // so it surfaces as a failed delivery in the Stripe dashboard rather
        // than disappearing.
        console.error(
          `Paid session ${session.id} has unusable metadata`,
          session.metadata,
        );
        return new Response("Unusable session metadata", { status: 500 });
      }

      // Idempotent on session.id — Stripe redelivers, and retries on non-2xx.
      await ctx.runMutation(internal.creditTransactions.recordPurchase, {
        userId: userId as Id<"users">,
        amount,
        stripeReference: session.id,
      });
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.error("Payment failed:", intent.id);
      break;
    }

    default:
      // Unhandled types are acknowledged so Stripe stops retrying them.
      break;
  }

  return new Response(null, { status: 200 });
});
