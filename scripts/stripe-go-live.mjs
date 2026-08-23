/**
 * One-shot live setup: verifies the key belongs to the RIGHT Stripe account,
 * then creates the live Products/Prices and the live webhook endpoint.
 *
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/stripe-go-live.mjs
 *
 * Prints the `npx convex env set --prod` commands to finish. Nothing is written
 * to Convex by this script, and the key is never stored anywhere.
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
const CONVEX_SITE = 'https://fearless-newt-271.convex.site'
const WEBHOOK_URL = `${CONVEX_SITE}/stripe/webhook`
const EVENTS = ['checkout.session.completed', 'payment_intent.payment_failed']

if (!key) {
  console.error('STRIPE_SECRET_KEY is not set.')
  process.exit(1)
}
if (!key.startsWith('sk_live_')) {
  console.error('This script is for LIVE keys only (sk_live_...).')
  console.error('For test mode use: npm run stripe:products / npm run stripe:webhook')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' })

// --- Guard: is this actually the RecommendUsUK account? -------------------
// Same login owns the Passplussom account. Charging RecommendUsUK customers
// through it would put the driving school's name on their bank statements.
const account = await stripe.accounts.retrieve()
const name =
  account.settings?.dashboard?.display_name ??
  account.business_profile?.name ??
  ''
const site = account.business_profile?.url ?? ''
const descriptor = account.settings?.payments?.statement_descriptor ?? ''

console.log('\nAccount this key belongs to')
console.log(`  name       : ${name || '(not set)'}`)
console.log(`  website    : ${site || '(not set)'}`)
console.log(`  descriptor : ${descriptor || '(not set)'}`)
console.log(`  country    : ${account.country}   currency: ${account.default_currency}`)
console.log(`  charges    : ${account.charges_enabled}   payouts: ${account.payouts_enabled}`)

const looksRight = `${name} ${site}`.toLowerCase().includes('recommendus')
if (!looksRight) {
  console.error('\nSTOP — this does not look like the RecommendUsUK account.')
  console.error('Neither the name nor the website mentions "recommendus".')
  console.error('You are probably in the wrong account in the Stripe dashboard.')
  console.error('Switch accounts, copy the live key again, and re-run.\n')
  process.exit(1)
}
if (!account.charges_enabled) {
  console.error('\nSTOP — this account cannot take charges yet.')
  console.error('Finish activation in the Stripe dashboard first.\n')
  process.exit(1)
}
if (!descriptor) {
  console.log('\n  ! No statement descriptor set. Customers will see a Stripe')
  console.log('    default on their bank statement, which drives chargebacks.')
  console.log('    Set it to RECOMMENDUSUK in Settings > Business.')
}
console.log('\nAccount looks right. Continuing.\n')

// --- Products + prices ----------------------------------------------------
const PACKAGES = [
  { packageId: 'credits_10',  credits: 10,  amount: 500,  envVar: 'STRIPE_PRICE_CREDITS_10' },
  { packageId: 'credits_25',  credits: 25,  amount: 1000, envVar: 'STRIPE_PRICE_CREDITS_25' },
  { packageId: 'credits_50',  credits: 50,  amount: 1800, envVar: 'STRIPE_PRICE_CREDITS_50' },
  { packageId: 'credits_100', credits: 100, amount: 3200, envVar: 'STRIPE_PRICE_CREDITS_100' },
]

const existing = new Map()
for await (const p of stripe.products.list({ limit: 100 })) {
  if (p.active && p.metadata?.packageId) existing.set(p.metadata.packageId, p)
}

const envLines = []
for (const pkg of PACKAGES) {
  let product = existing.get(pkg.packageId)
  if (!product) {
    product = await stripe.products.create({
      name: `${pkg.credits} Credits`,
      description: `${pkg.credits} credits for posting jobs on RecommendUsUK`,
      metadata: { packageId: pkg.packageId, credits: String(pkg.credits) },
    })
  }
  let price = null
  for await (const p of stripe.prices.list({ product: product.id, limit: 100 })) {
    if (p.active && p.unit_amount === pkg.amount && p.currency === 'gbp') { price = p; break }
  }
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: pkg.amount,
      metadata: { packageId: pkg.packageId, credits: String(pkg.credits) },
    })
  }
  console.log(`  ${pkg.packageId.padEnd(12)} ${price.id}`)
  envLines.push(`npx convex env set --prod ${pkg.envVar} ${price.id}`)
}

// --- Webhook --------------------------------------------------------------
let endpoint = null
for await (const ep of stripe.webhookEndpoints.list({ limit: 100 })) {
  if (ep.url === WEBHOOK_URL) { endpoint = ep; break }
}

if (endpoint) {
  console.log(`\n  webhook already exists: ${endpoint.id}`)
  console.log('  Stripe only reveals the signing secret at creation. Copy it from')
  console.log('  Developers > Webhooks, or delete the endpoint and re-run.\n')
} else {
  const ep = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    description: 'RecommendUsUK credit purchases -> Convex (live)',
  })
  console.log(`\n  webhook created: ${ep.id} -> ${WEBHOOK_URL}`)
  envLines.push(`npx convex env set --prod STRIPE_WEBHOOK_SECRET ${ep.secret}`)
}

console.log('\nRun these to finish (the secret key line is yours to fill in):\n')
console.log('npx convex env set --prod STRIPE_SECRET_KEY sk_live_...')
envLines.forEach((l) => console.log(l))
console.log('')
