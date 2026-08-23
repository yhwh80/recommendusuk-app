import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { webhook as stripeWebhook } from "./stripe";

// Wires up the Convex Auth HTTP routes (sign-in, token refresh, etc.).
const http = httpRouter();
auth.addHttpRoutes(http);

// Stripe posts payment events straight to Convex, so the signing secret and
// API key stay in Convex env and never reach the web host.
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhook,
});

export default http;
