import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { STRIPE_CONFIGURED, CREDIT_FULFILMENT_WIRED } from '@/lib/stripeConfig'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  if (!STRIPE_CONFIGURED) {
    // No keys set, so no signature to verify and nothing legitimate to process.
    return NextResponse.json(
      { error: 'Stripe is not configured on this deployment' },
      { status: 503 },
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: unknown) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status === 'paid') {
          const { userId, credits } = session.metadata || {}

          if (!userId || !credits) {
            console.error('Missing metadata in session:', session.id)
            break
          }

          if (!CREDIT_FULFILMENT_WIRED) {
            // `recordPurchase` is an internalMutation and cannot be reached
            // from here — it must be called by a Convex httpAction that
            // verifies the Stripe signature itself. Fail loudly (Stripe will
            // retry and surface the failure in the dashboard) rather than
            // silently swallowing a paid session.
            console.error(
              `Paid session ${session.id} could not be credited: Convex fulfilment not wired`,
            )
            return NextResponse.json(
              { error: 'Credit fulfilment not wired' },
              { status: 500 },
            )
          }

          console.log(`Would add ${credits} credits to user ${userId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
