'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function ClientDashboard() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const jobs = useQuery(api.jobs.listMine)
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

  if (isLoading || user === undefined || jobs === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const activeJobs = jobs.filter((job) => job.status === 'open').length
  const completedJobs = jobs.filter((job) => job.status === 'completed').length
  const totalSpent = jobs.length * 5 // 5 credits per job

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
              <span className="hidden sm:inline font-medium text-gray-600">Client Dashboard</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/my-jobs" className="text-gray-600 hover:text-green-600 font-medium">
                My Jobs
              </Link>
              <Link href="/freelancers" className="text-gray-600 hover:text-green-600 font-medium">
                Browse Freelancers
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
              {!menuOpen && ((!!unread && unread > 0) || (!!notifUnread && notifUnread > 0)) && (
                <span className="absolute top-1 right-1 bg-green-500 w-2.5 h-2.5 rounded-full" />
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col space-y-1">
              <Link href="/my-jobs" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">My Jobs</Link>
              <Link href="/freelancers" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">Browse Freelancers</Link>
              <Link href="/messages" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">
                Messages {!!unread && unread > 0 && <span className="ml-1 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">{unread}</span>}
              </Link>
              <Link href="/notifications" className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium">
                🔔 Notifications {!!notifUnread && notifUnread > 0 && <span className="ml-1 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">{notifUnread}</span>}
              </Link>
              <button onClick={handleSignOut} className="text-left px-2 py-2 rounded hover:bg-green-50 text-gray-500">Sign out</button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">Manage your projects and find the perfect freelancers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Credits</p>
                <p className="text-2xl font-bold text-gray-900">{user.credits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{totalSpent} credits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/post-job"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">📝</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Post a New Job</p>
                <p className="text-sm text-gray-600">5 credits per job</p>
              </div>
            </Link>

            <Link
              href="/freelancers"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Browse Freelancers</p>
                <p className="text-sm text-gray-600">Find professionals</p>
              </div>
            </Link>

            <Link
              href="/buy-credits"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Buy More Credits</p>
                <p className="text-sm text-gray-600">Top up your balance</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Jobs</h2>
            <Link href="/post-job" className="text-green-600 hover:text-green-800 font-medium">
              Post New Job →
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-600 mb-6">Start by posting your first job to find the perfect freelancer</p>
              <Link
                href="/post-job"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{job.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Budget: £{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}</span>
                        <span>•</span>
                        <span>{job.currentBids} bids</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          job.status === 'open' ? 'bg-green-100 text-green-800' :
                          job.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/jobs/${job._id}`}
                      className="ml-4 text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
