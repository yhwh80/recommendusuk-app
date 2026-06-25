'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConvexAuth } from 'convex/react'
import { useCurrentUser } from '@/lib/useCurrentUser'

// Routes a signed-in user to the dashboard matching their role.
export default function DashboardRedirect() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/auth')
      return
    }
    if (user === undefined) return // profile still loading
    if (user === null) {
      router.replace('/auth')
      return
    }
    router.replace(
      user.role === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client',
    )
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  )
}
