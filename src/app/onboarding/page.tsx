'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function OnboardingPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const completeOnboarding = useMutation(api.users.completeOnboarding)
  const router = useRouter()
  const [saving, setSaving] = useState<'client' | 'freelancer' | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/auth')
  }, [isLoading, isAuthenticated, router])

  // Already have a role? Straight to the dashboard.
  useEffect(() => {
    if (user && user.role) {
      router.replace(user.role === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client')
    }
  }, [user, router])

  const pick = async (role: 'client' | 'freelancer') => {
    setSaving(role)
    try {
      await completeOnboarding({ role })
      router.replace(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')
    } catch {
      setSaving(null)
    }
  }

  if (isLoading || user === undefined || (user && user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center space-x-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <span className="text-xl font-bold text-gray-800">RecommendUsUK</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">One quick thing…</h1>
        <p className="text-gray-600 mb-8">What brings you to RecommendUsUK?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => pick('client')}
            disabled={saving !== null}
            className="p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
          >
            <div className="text-4xl mb-3">💼</div>
            <div className="font-semibold text-lg text-gray-900">Hire</div>
            <div className="text-sm text-gray-600">Post jobs & hire pros</div>
            <div className="text-xs text-green-600 mt-2 font-medium">
              {saving === 'client' ? 'Setting up…' : '25 free credits'}
            </div>
          </button>
          <button
            onClick={() => pick('freelancer')}
            disabled={saving !== null}
            className="p-6 rounded-2xl border-2 border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50"
          >
            <div className="text-4xl mb-3">🎯</div>
            <div className="font-semibold text-lg text-gray-900">Work</div>
            <div className="text-sm text-gray-600">Find jobs & get hired</div>
            <div className="text-xs text-green-600 mt-2 font-medium">
              {saving === 'freelancer' ? 'Setting up…' : '10 free credits'}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
