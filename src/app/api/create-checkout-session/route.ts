import { NextRequest, NextResponse } from 'next/server'
import { stripe, CREDIT_PACKAGES } from '@/lib/stripe'

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

    // Check if we're in mock mode
    const isMockMode = process.env.STRIPE_SECRET_KEY === 'sk_test_mock' || process.env.STRIPE_API_BASE

    if (isMockMode) {
      // In mock mode, return a fake session ID and redirect to success
      const mockSessionId = `cs_test_mock_${Date.now()}_${packageId}`
      return NextResponse.json({ sessionId: mockSessionId })
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