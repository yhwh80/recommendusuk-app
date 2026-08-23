// Single source of truth for "can we actually take a payment right now?".
//
// Both the secret key AND the webhook secret are required: without the webhook
// secret we could charge a customer and then have no verified way to credit
// their account. Refusing checkout is always better than taking money we
// cannot honour.
const secret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const isPlaceholder = (value: string | undefined) =>
  !value || value.includes('mock') || value.includes('your_')

export const STRIPE_CONFIGURED =
  !isPlaceholder(secret) && !isPlaceholder(webhookSecret)

// Every package needs a real Stripe Price. Test and live mode hold separate
// price objects, so these IDs differ per deployment and are set by
// `npm run stripe:products`.
export const PRICES_CONFIGURED = [
  process.env.STRIPE_PRICE_CREDITS_10,
  process.env.STRIPE_PRICE_CREDITS_25,
  process.env.STRIPE_PRICE_CREDITS_50,
  process.env.STRIPE_PRICE_CREDITS_100,
].every((id) => id?.startsWith('price_'))

// Credits are granted from a Convex internal mutation that must be reached via
// a signature-verifying Convex httpAction. Until that refactor lands there is
// no safe path from a paid Stripe session to a credit balance, so checkout
// stays closed even if the keys above are present.
export const CREDIT_FULFILMENT_WIRED = false

export const PAYMENTS_ENABLED =
  STRIPE_CONFIGURED && PRICES_CONFIGURED && CREDIT_FULFILMENT_WIRED
