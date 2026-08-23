/**
 * Creates the credit packages as real Stripe Products + Prices.
 *
 * Test and live mode are separate datasets, so this must be run once per mode.
 * It is idempotent: products are matched on the `packageId` metadata field, so
 * re-running reuses what already exists rather than creating duplicates.
 *
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/setup-stripe-products.mjs
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-products.mjs
 *
 * Prints the env lines to set afterwards.
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('STRIPE_SECRET_KEY is not set.')
  process.exit(1)
}

const mode = key.startsWith('sk_live_') ? 'LIVE' : 'TEST'
const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' })

// Kept deliberately in step with CREDIT_PACKAGES in src/lib/stripe.ts.
// Amounts are in pence.
const PACKAGES = [
  { packageId: 'credits_10',  credits: 10,  amount: 500,  envVar: 'STRIPE_PRICE_CREDITS_10' },
  { packageId: 'credits_25',  credits: 25,  amount: 1000, envVar: 'STRIPE_PRICE_CREDITS_25' },
  { packageId: 'credits_50',  credits: 50,  amount: 1800, envVar: 'STRIPE_PRICE_CREDITS_50' },
  { packageId: 'credits_100', credits: 100, amount: 3200, envVar: 'STRIPE_PRICE_CREDITS_100' },
]

// Stripe has no "find product by metadata" lookup, so page the catalogue once
// and index it ourselves.
async function existingProductsByPackageId() {
  const found = new Map()
  for await (const product of stripe.products.list({ limit: 100 })) {
    const id = product.metadata?.packageId
    if (id && product.active) found.set(id, product)
  }
  return found
}

// Reuse a price only if it still matches the amount and currency we want —
// Stripe prices are immutable, so a price change means a new price object.
async function findMatchingPrice(productId, amount) {
  for await (const price of stripe.prices.list({ product: productId, limit: 100 })) {
    if (price.active && price.unit_amount === amount && price.currency === 'gbp') {
      return price
    }
  }
  return null
}

console.log(`\nSetting up credit packages in ${mode} mode...\n`)

const existing = await existingProductsByPackageId()
const results = []

for (const pkg of PACKAGES) {
  let product = existing.get(pkg.packageId)

  if (product) {
    console.log(`  ${pkg.packageId.padEnd(12)} product exists  ${product.id}`)
  } else {
    product = await stripe.products.create({
      name: `${pkg.credits} Credits`,
      description: `${pkg.credits} credits for posting jobs on RecommendUsUK`,
      metadata: { packageId: pkg.packageId, credits: String(pkg.credits) },
    })
    console.log(`  ${pkg.packageId.padEnd(12)} product created ${product.id}`)
  }

  let price = await findMatchingPrice(product.id, pkg.amount)

  if (price) {
    console.log(`  ${''.padEnd(12)} price exists    ${price.id}`)
  } else {
    price = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: pkg.amount,
      metadata: { packageId: pkg.packageId, credits: String(pkg.credits) },
    })
    console.log(`  ${''.padEnd(12)} price created   ${price.id}`)
  }

  results.push({ ...pkg, priceId: price.id })
}

console.log(`\n${mode} price IDs — set these on the matching Convex deployment:\n`)
const target = mode === 'LIVE' ? ' --prod' : ''
for (const r of results) {
  console.log(`npx convex env set${target} ${r.envVar} ${r.priceId}`)
}
console.log('')
