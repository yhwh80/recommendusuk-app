// Display-only copy for the buy-credits page.
//
// Nothing here is trusted: the amount charged comes from the Stripe Price ID
// held in Convex env, and the credits granted come from the PACKAGES table in
// convex/stripe.ts. Editing these values in the browser changes the label and
// nothing else. Keep them in step with the server when prices change.
export const CREDIT_PACKAGES = [
  { id: 'credits_10', name: '10 Credits', credits: 10, price: 5.0, popular: false },
  { id: 'credits_25', name: '25 Credits', credits: 25, price: 10.0, popular: true },
  { id: 'credits_50', name: '50 Credits', credits: 50, price: 18.0, popular: false },
  { id: 'credits_100', name: '100 Credits', credits: 100, price: 32.0, popular: false },
]
