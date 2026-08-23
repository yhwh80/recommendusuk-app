/**
 * Registers the Convex webhook endpoint with Stripe and prints its signing
 * secret.
 *
 * Stripe only reveals the signing secret at creation time, so if an endpoint
 * for this URL already exists the script reports it and stops. Pass --recreate
 * to delete and recreate it (which issues a fresh secret you must then set).
 *
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe-webhook.mjs \
 *     https://<deployment>.convex.site/stripe/webhook
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
const url = process.argv.find((a) => a.startsWith('http'))
const recreate = process.argv.includes('--recreate')

if (!key || !url) {
  console.error('Usage: STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe-webhook.mjs <url> [--recreate]')
  process.exit(1)
}

const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST'
const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' })

// Only the events we actually handle. Subscribing to everything just means
// paying attention to noise we then have to ignore.
const EVENTS = ['checkout.session.completed', 'payment_intent.payment_failed']

let existing = null
for await (const ep of stripe.webhookEndpoints.list({ limit: 100 })) {
  if (ep.url === url) { existing = ep; break }
}

if (existing && !recreate) {
  console.log(`\n${mode}: endpoint already exists — ${existing.id}`)
  console.log('Stripe only shows the signing secret once, at creation.')
  console.log('Re-run with --recreate for a fresh secret, or copy it from the')
  console.log('Stripe dashboard under Developers > Webhooks.\n')
  process.exit(0)
}

if (existing && recreate) {
  await stripe.webhookEndpoints.del(existing.id)
  console.log(`Deleted previous endpoint ${existing.id}`)
}

const ep = await stripe.webhookEndpoints.create({
  url,
  enabled_events: EVENTS,
  description: 'RecommendUsUK credit purchases -> Convex',
})

const target = mode === 'LIVE' ? ' --prod' : ''
console.log(`\n${mode}: created ${ep.id}`)
console.log(`  ${url}`)
console.log(`  events: ${EVENTS.join(', ')}\n`)
console.log('Set the signing secret on the matching Convex deployment:\n')
console.log(`npx convex env set${target} STRIPE_WEBHOOK_SECRET ${ep.secret}\n`)
