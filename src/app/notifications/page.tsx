'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ICON: Record<string, string> = {
  bid_accepted: '🎉',
  new_bid: '📩',
  new_review: '⭐',
  job_completed: '✅',
}

export default function NotificationsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const notifications = useQuery(api.notifications.list)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  // Mark everything read when the page opens.
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      markAllRead().catch(() => {})
    }
  }, [notifications, markAllRead])

  if (isLoading || notifications === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-green-600 font-medium">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">
              You&apos;ll be notified here when you get a bid, get hired, or receive a review.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-100 divide-y divide-gray-100 overflow-hidden">
            {notifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 p-4">
                  <div className="text-2xl shrink-0">{ICON[n.type] ?? '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.readAt === undefined ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n._creationTime)}</p>
                  </div>
                  {n.readAt === undefined && (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              )
              return n.link ? (
                <Link key={n._id} href={n.link} className="block hover:bg-green-50 transition-colors">
                  {inner}
                </Link>
              ) : (
                <div key={n._id}>{inner}</div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
