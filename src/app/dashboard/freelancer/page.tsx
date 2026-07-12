'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function FreelancerDashboard() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const jobLeads = useQuery(api.jobs.leadsForMe)
  const myBids = useQuery(api.bids.listMine)
  const unread = useQuery(api.messages.unreadCount)
  const notifUnread = useQuery(api.notifications.unreadCount)
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useAuthActions()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (
    isLoading ||
    user === undefined ||
    jobLeads === undefined ||
    myBids === undefined
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const wonBids = myBids.filter((bid) => bid.status === 'accepted').length
  const pendingBids = myBids.filter((bid) => bid.status === 'pending').length
  const totalEarned = myBids
    .filter((bid) => bid.status === 'accepted')
    .reduce((sum, bid) => sum + bid.amount, 0) / 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 min-w-0">
              <Link href="/" className="flex items-center space-x-2 shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
              </Link>
              <span className="hidden sm:inline text-gray-400">|</span>
              <span className="hidden sm:inline font-medium text-gray-600">Freelancer Dashboard</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-600 hover:text-green-600 font-medium">
                Browse Jobs
              </Link>
              <Link href="/messages" className="relative text-gray-600 hover:text-green-600 font-medium">
                Messages
                {!!unread && unread > 0 && (
                  <span className="absolute -top-2 -right-3 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">
                    {unread}
                  </span>
                )}
              </Link>
              <Link href="/notifications" className="relative text-gray-600 hover:text-green-600 text-xl" aria-label="Notifications">
                🔔
                {!!notifUnread && notifUnread > 0 && (
                  <span className="absolute -top-1 -right-2 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">
                    {notifUnread}
                  </span>
                )}
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 text-sm">
                Sign out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden relative p-2 text-gray-700"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
              {!menuOpen && !!unread && unread > 0 && (
                <span className="absolute top-1 right-1 bg-green-500 w-2.5 h-2.5 rounded-full" />
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col space-y-1">
              <Link href="/jobs" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">Browse Jobs</Link>
              <Link href="/messages" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">
                Messages {!!unread && unread > 0 && <span className="ml-1 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">{unread}</span>}
              </Link>
              <Link href="/notifications" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">
                🔔 Notifications {!!notifUnread && notifUnread > 0 && <span className="ml-1 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">{notifUnread}</span>}
              </Link>
              <Link href="/profile" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">My Profile</Link>
              <button onClick={handleSignOut} className="text-left px-2 py-2 rounded hover:bg-green-50 text-gray-500">Sign out</button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 💼
          </h1>
          <p className="text-gray-600">Find your next project and grow your business</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Link href="/my-bids" className="bg-white p-6 rounded-xl shadow-sm border hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💷</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">£{totalEarned.toLocaleString()}</p>
              </div>
            </div>
          </Link>

          <Link href="/buy-credits" className="bg-white p-6 rounded-xl shadow-sm border hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Credits</p>
                <p className="text-2xl font-bold text-gray-900">{user.credits}</p>
                <p className="text-xs text-green-600 font-medium">Tap to buy more →</p>
              </div>
            </div>
          </Link>

          <Link href="/my-bids" className="bg-white p-6 rounded-xl shadow-sm border hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bids</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBids}</p>
              </div>
            </div>
          </Link>

          <Link href="/my-bids" className="bg-white p-6 rounded-xl shadow-sm border hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jobs Won</p>
                <p className="text-2xl font-bold text-gray-900">{wonBids}</p>
              </div>
            </div>
          </Link>

          <Link href={`/profile/${user._id}`} className="bg-white p-6 rounded-xl shadow-sm border hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{(user.totalRating ?? 0).toFixed(1)}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/jobs"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Browse Jobs</p>
                <p className="text-sm text-gray-600">Find new opportunities</p>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">👤</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-600">Improve your profile</p>
              </div>
            </Link>

            <Link
              href="/my-bids"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">My Proposals</p>
                <p className="text-sm text-gray-600">Track your bids</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Leads */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Job Leads for you</h2>
                <p className="text-sm text-gray-500">Matches to your skills &amp; area show first</p>
              </div>
              <Link href="/jobs" className="text-green-600 hover:text-green-800 font-medium whitespace-nowrap">
                See all →
              </Link>
            </div>

            {jobLeads.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-600">No open job leads right now — check back soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobLeads.slice(0, 5).map((job) => (
                  <div key={job._id} className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${job.matchesYou ? 'border-green-300 bg-green-50/50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      {job.matchesYou && (
                        <span className="shrink-0 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Matches you</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <span>£{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}</span>
                        {job.location && <><span>•</span><span>📍 {job.location}</span></>}
                      </div>
                      <Link
                        href={`/jobs/${job._id}`}
                        className="text-green-600 hover:text-green-800 font-medium text-sm whitespace-nowrap"
                      >
                        View &amp; Bid →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Bids */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Recent Proposals</h2>
              <Link href="/my-bids" className="text-green-600 hover:text-green-800 font-medium">
                View All →
              </Link>
            </div>

            {myBids.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-600 mb-4">No proposals submitted yet</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBids.slice(0, 5).map((bid) => (
                  <div key={bid._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {bid.job?.title || 'Job Title'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">Bid Amount: £{(bid.amount / 100).toLocaleString()}</p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
