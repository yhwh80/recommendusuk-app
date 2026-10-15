'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useAction } from 'convex/react'
import { CREDIT_PACKAGES } from '@/lib/stripe'
import { BID_COST_TIERS } from '../../../convex/pricing'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { SiteHeader } from '@/components/SiteHeader'

export default function BuyCreditsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession)
  const [processingPackage, setProcessingPackage] = useState<string | null>(null)
  const [paymentsDisabled, setPaymentsDisabled] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  const handlePurchase = async (packageId: string) => {
    if (!user) return
    setProcessingPackage(packageId)

    setPurchaseError(null)

    try {
      // Convex decides the price and the credit amount; we only name a package.
      const { url } = await createCheckoutSession({ packageId })
      window.location.href = url
      return
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : ''

      // Payments are switched off until Stripe is set up — show a calm notice
      // rather than an error.
      if (message.includes('not enabled yet')) {
        setPaymentsDisabled(true)
        return
      }

      console.error('Error:', error)
      setPurchaseError(
        'Something went wrong starting your payment. Please try again.',
      )
    } finally {
      setProcessingPackage(null)
    }
  }

  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        label="Buy Credits"
        links={[
          {
            href: `/dashboard/${user.role === 'client' ? 'client' : 'freelancer'}`,
            label: 'Dashboard',
          },
        ]}
        rightExtra={
          <span className="text-sm text-gray-600">
            Credits: <span className="font-medium">{user.credits}</span>
          </span>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Buy Credits</h1>
          <p className="text-xl text-gray-600 mb-2">
            Choose the perfect credit package for your needs
          </p>
          <p className="text-gray-500">
            You currently have <span className="font-semibold text-green-600">{user.credits} credits</span>
          </p>
        </div>

        {/* Clients never spend credits — say so rather than selling to them. */}
        {user.role === 'client' && (
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="font-semibold text-blue-900 mb-1">
              You&apos;re signed in with a hirer account, so you don&apos;t need credits
            </h3>
            <p className="text-sm text-blue-800">
              Posting a job is free, and always will be. Credits are only bought by
              workers, to send proposals on jobs.{' '}
              <Link href="/post-job" className="font-medium underline">
                Post a job
              </Link>
              .
            </p>
            <p className="text-sm text-blue-800 mt-2">
              Want to quote for work yourself?{' '}
              <Link href="/auth?type=freelancer" className="font-medium underline">
                Create a worker account
              </Link>{' '}
              with a different email address.
            </p>
          </div>
        )}

        {/* Current Credit Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How Credits Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">📩</div>
              <div className="font-semibold text-green-900">Send a Proposal</div>
              <div className="text-sm text-green-700">1–6 credits by job size</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-green-900">Only 3 Per Job</div>
              <div className="text-sm text-green-700">You&apos;re never one of fifty</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">↩️</div>
              <div className="font-semibold text-green-900">Refunded</div>
              <div className="text-sm text-green-700">If the customer withdraws the job</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-semibold text-green-900">Posting Is Free</div>
              <div className="text-sm text-green-700">Customers never pay</div>
            </div>
          </div>

          {/* Priced from the same table the server charges from, so the two
              can never disagree. */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Cost to send a proposal
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {BID_COST_TIERS.map((tier, i) => {
                const from = i === 0 ? 0 : BID_COST_TIERS[i - 1].upToBudget
                const label = Number.isFinite(tier.upToBudget)
                  ? `£${from.toLocaleString()}–£${(tier.upToBudget - 1).toLocaleString()}`
                  : `£${from.toLocaleString()}+`
                return (
                  <div key={i} className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="text-xs text-gray-600">{label}</div>
                    <div className="font-semibold text-gray-900">
                      {tier.credits} {tier.credits === 1 ? 'credit' : 'credits'}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Based on the customer&apos;s stated budget.
            </p>
          </div>
        </div>

        {paymentsDisabled && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h3 className="font-semibold text-amber-900 mb-1">
              Card payments are coming soon
            </h3>
            <p className="text-sm text-amber-800">
              We&apos;re finishing our payment setup. Credit packages aren&apos;t on sale
              just yet — your existing credits are unaffected. Please check back shortly.
            </p>
          </div>
        )}

        {purchaseError && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="font-semibold text-red-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-red-800">{purchaseError}</p>
          </div>
        )}

        {/* Credit Packages */}
        {user.role !== 'client' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                pkg.popular
                  ? 'border-green-500 shadow-lg'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  £{pkg.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  £{(pkg.price / pkg.credits).toFixed(2)} per credit
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">💳</span>
                    <span className="font-semibold">{pkg.credits} Credits</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    ≈ {Math.floor(pkg.credits / 2)} proposals
                  </div>

                  {pkg.credits >= 50 && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {pkg.credits >= 100 ? '20%' : '10%'}!
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={processingPackage === pkg.id || paymentsDisabled}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    pkg.popular
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingPackage === pkg.id ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      <span>Processing...</span>
                    </div>
                  ) : paymentsDisabled ? (
                    'Coming soon'
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Security Notice */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-gray-600 text-sm">
                Your payment is processed securely through Stripe. We never store your payment information.
                All transactions are encrypted and PCI-compliant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
