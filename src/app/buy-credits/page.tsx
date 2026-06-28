'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useMutation } from 'convex/react'
import { stripePromise, CREDIT_PACKAGES } from '@/lib/stripe'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { SiteHeader } from '@/components/SiteHeader'

export default function BuyCreditsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const purchaseMock = useMutation(api.creditTransactions.purchaseMock)
  const [processingPackage, setProcessingPackage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  const handlePurchase = async (packageId: string) => {
    if (!user) return
    setProcessingPackage(packageId)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, userId: user._id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Mock mode (no real Stripe keys): credit the account directly via Convex.
      if (sessionId.includes('mock')) {
        const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId)
        if (selectedPackage) {
          await purchaseMock({ credits: selectedPackage.credits })
          router.push(`/buy-credits/success?session_id=${sessionId}&mock=true`)
          return
        }
      }

      // Production Stripe checkout.
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) throw error
    } catch (error: unknown) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to process payment')
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

        {/* Current Credit Usage */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How Credits Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-semibold text-green-900">Post a Job</div>
              <div className="text-sm text-green-700">5 credits</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-green-900">Get 3 Proposals</div>
              <div className="text-sm text-green-700">Included with job post</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎁</div>
              <div className="font-semibold text-green-900">Free Credits</div>
              <div className="text-sm text-green-700">25 for clients, 10 for freelancers</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-yellow-900">Best Value</div>
              <div className="text-sm text-yellow-700">Bulk packages save up to 20%</div>
            </div>
          </div>
        </div>

        {/* Credit Packages */}
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
                    Post {Math.floor(pkg.credits / 5)} jobs
                  </div>

                  {pkg.credits >= 50 && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {pkg.credits >= 100 ? '20%' : '10%'}!
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={processingPackage === pkg.id}
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
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

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
