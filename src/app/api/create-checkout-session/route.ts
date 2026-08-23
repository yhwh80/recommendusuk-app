import { NextRequest, NextResponse } from 'next/server'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'
import { PAYMENTS_ENABLED } from '@/lib/stripeConfig'

export async function POST(request: NextRequest) {
  try {
    const { packageId, userId } = await request.json()

    if (!packageId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Find the credit package
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId)
    if (!creditPackage) {
      return NextResponse.json(
        { error: 'Invalid package' },
        { status: 400 }
      )
    }

    // Card payments are switched off until real Stripe keys are set AND the
    // Convex fulfilment path is wired. Previously an unset STRIPE_SECRET_KEY
    // fell through to a live Stripe call with the literal string
    // 'sk_test_mock', which 500'd in production.
    if (!PAYMENTS_ENABLED) {
      return NextResponse.json(
        {
          error: 'Card payments are not enabled yet.',
          code: 'payments_disabled',
        },
        { status: 503 },
      )
    }

    // Create Stripe checkout session for production
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${creditPackage.name} - RecommendUsUK Marketplace`,
              description: `Purchase ${creditPackage.credits} credits for posting jobs`,
              images: ['https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=300&fit=crop&crop=center'],
            },
            unit_amount: Math.round(creditPackage.price * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/buy-credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/buy-credits?cancelled=true`,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits.toString(),
      },
      // TODO: pass the signed-in user's email so Stripe emails a receipt
      //       (the success page already tells them one was sent).
      customer_email: undefined,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}