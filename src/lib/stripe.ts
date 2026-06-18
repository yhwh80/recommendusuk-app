import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Client-side Stripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock'
)

// Server-side Stripe
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock'

export const stripe = new Stripe(stripeApiKey, {
  apiVersion: '2025-08-27.basil',
  host: process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE).hostname : undefined,
  port: process.env.STRIPE_API_BASE ? parseInt(new URL(process.env.STRIPE_API_BASE).port) : undefined,
  protocol: process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE).protocol.replace(':', '') as 'http' | 'https' : undefined,
})

// Credit packages configuration
export const CREDIT_PACKAGES = [
  {
    id: 'credits_10',
    name: '10 Credits',
    credits: 10,
    price: 5.00, // £5
    priceId: process.env.STRIPE_PRICE_CREDITS_10 || 'price_mock_credits_10',
    popular: false,
  },
  {
    id: 'credits_25',
    name: '25 Credits',
    credits: 25,
    price: 10.00, // £10
    priceId: process.env.STRIPE_PRICE_CREDITS_25 || 'price_mock_credits_25',
    popular: true,
  },
  {
    id: 'credits_50',
    name: '50 Credits',
    credits: 50,
    price: 18.00, // £18 (10% discount)
    priceId: process.env.STRIPE_PRICE_CREDITS_50 || 'price_mock_credits_50',
    popular: false,
  },
  {
    id: 'credits_100',
    name: '100 Credits',
    credits: 100,
    price: 32.00, // £32 (20% discount)
    priceId: process.env.STRIPE_PRICE_CREDITS_100 || 'price_mock_credits_100',
    popular: false,
  },
]