'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function FreelancerDashboard() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const availableJobs = useQuery(api.jobs.listOpen)
  const myBids = useQuery(api.bids.listMine)
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
    availableJobs === undefined ||
    myBids === undefined
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const wonBids = myBids.filter((bid) => bid.status === 'accepted').length
  const pendingBids = myBids.filter((bid) => bid.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-gray-600">Freelancer Dashboard</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-600 hover:text-purple-600 font-medium">
                Browse Jobs
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {user.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bids</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBids}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jobs Won</p>
                <p className="text-2xl font-bold text-gray-900">{wonBids}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{(user.totalRating ?? 0).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/jobs"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Browse Jobs</p>
                <p className="text-sm text-gray-600">Find new opportunities</p>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
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
          {/* Available Jobs */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Latest Jobs</h2>
              <Link href="/jobs" className="text-purple-600 hover:text-purple-800 font-medium">
                View All →
              </Link>
            </div>

            {availableJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-600">No jobs available right now</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableJobs.slice(0, 5).map((job) => (
                  <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>£{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}</span>
                        <span>•</span>
                        <span>{job.currentBids}/{job.maxBids} bids</span>
                      </div>
                      <Link
                        href={`/jobs/${job._id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                      >
                        View & Bid →
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
              <Link href="/my-bids" className="text-purple-600 hover:text-purple-800 font-medium">
                View All →
              </Link>
            </div>

            {myBids.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-600 mb-4">No proposals submitted yet</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
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
