'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

function timeAgo(ts: number) {
  const h = Math.floor((Date.now() - ts) / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function MessagesPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const conversations = useQuery(api.messages.conversations)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || conversations === undefined) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">
              Message a freelancer from their profile, or a client from a job you&apos;ve bid on.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-green-100 divide-y divide-gray-100 overflow-hidden">
            {conversations.map((c) => (
              <Link
                key={c.otherId}
                href={`/messages/${c.otherId}`}
                className="flex items-center gap-4 p-4 hover:bg-green-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-lg">
                    {c.otherName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 truncate">{c.otherName}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${c.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {c.lastFromMe && <span className="text-gray-400">You: </span>}
                    {c.lastBody}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 shrink-0">
                    {c.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
