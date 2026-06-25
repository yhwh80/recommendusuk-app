'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import { useCurrentUser } from '@/lib/useCurrentUser'

export const dynamic = 'force-dynamic'

function PaymentSuccessInner() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

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

  // Credits are added by the purchase flow (mock mutation or Stripe webhook);
  // useCurrentUser is reactive, so the balance below updates automatically.
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-gray-600">Payment Successful</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href={`/dashboard/${user.role === 'client' ? 'client' : 'freelancer'}`} className="text-gray-600 hover:text-green-600 font-medium">
                Dashboard
              </Link>
              <div className="text-sm text-gray-600">
                Credits: <span className="font-medium">{user.credits}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your credits have been added to your account.
          </p>

          {/* Current Credits */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {user.credits}
              </div>
              <div className="text-gray-600">
                Current Credits
              </div>
              <div className="text-sm text-gray-500 mt-2">
                You can post {Math.floor((user.credits ?? 0) / 5)} jobs
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/post-job"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Post a Job
            </Link>
            <Link
              href={`/dashboard/${user.role === 'client' ? 'client' : 'freelancer'}`}
              className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/buy-credits"
              className="text-green-600 hover:text-green-800 font-medium px-8 py-3"
            >
              Buy More Credits
            </Link>
          </div>

          {/* Receipt Info */}
          {sessionId && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                Transaction ID: {sessionId.substring(0, 20)}...
              </p>
              <p className="text-gray-500 text-sm mt-1">
                A receipt has been sent to your email address
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  )
}
