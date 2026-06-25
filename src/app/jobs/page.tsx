'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function JobsPage() {
  const [filter, setFilter] = useState<'all' | 'open'>('all')
  const jobs = useQuery(api.jobs.listWithClient, filter === 'open' ? { status: 'open' } : {})

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const getTimeAgo = (ts: number) => {
    const now = Date.now()
    const diffInHours = Math.floor((now - ts) / (1000 * 60 * 60))
    if (diffInHours < 1) return 'Just posted'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(ts)
  }

  if (jobs === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

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
              <span className="font-medium text-gray-600">Browse Jobs</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-gray-600 hover:text-green-600 font-medium">
                Sign in
              </Link>
              <Link href="/auth?signup=true" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Join now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">Find the perfect project for your skills</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">Filter by status:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'open'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Open ({jobs.filter((job) => job.status === 'open').length})
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'open' ? 'bg-green-100 text-green-800' :
                          job.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{job.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>💰</span>
                        <span className="font-medium text-gray-900">
                          £{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📋</span>
                        <span>{job.currentBids}/{job.maxBids} proposals</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center space-x-1">
                          <span>📍</span>
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <span>👤</span>
                        <span>Posted by {job.clientName || 'Client'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🕒</span>
                        <span>{getTimeAgo(job._creationTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {job.currentBids >= job.maxBids ? (
                        <span className="text-red-600 font-medium">Maximum bids reached</span>
                      ) : job.status === 'open' ? (
                        <span className="text-green-600 font-medium">Accepting proposals</span>
                      ) : (
                        <span className="text-gray-500">Closed for bidding</span>
                      )}
                    </div>

                    <Link
                      href={`/jobs/${job._id}`}
                      className="inline-flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for non-users */}
        <div className="mt-12 bg-gradient-to-r from-green-500 to-green-400 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to start bidding?</h3>
          <p className="text-green-100 mb-6">Join RecommendUsUK and get 10 free credits to submit your first proposals</p>
          <Link
            href="/auth?type=freelancer"
            className="inline-flex items-center px-8 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Join as Freelancer
          </Link>
        </div>
      </div>
    </div>
  )
}
