'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function MyBidsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const myBids = useQuery(api.bids.listMine)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || myBids === undefined) {
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
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-600 hover:text-green-500 font-medium">Browse Jobs</Link>
              <Link href="/dashboard/freelancer" className="text-gray-600 hover:text-green-500 font-medium">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proposals</h1>
          <p className="text-gray-600">Track the status of every bid you&apos;ve submitted</p>
        </div>

        {myBids.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-6">Browse open jobs and submit your first proposal.</p>
            <Link href="/jobs" className="inline-flex items-center px-6 py-3 bg-green-400 text-white font-medium rounded-lg hover:bg-green-500 transition-colors">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myBids.map((bid) => (
              <div key={bid._id} className="bg-white rounded-xl border border-green-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={bid.job ? `/jobs/${bid.job._id}` : '#'} className="font-semibold text-gray-900 hover:text-green-600">
                      {bid.job?.title || 'Job removed'}
                    </Link>
                    <p className="text-gray-600 text-sm mt-1">
                      Your bid: <span className="font-medium text-green-600">£{(bid.amount / 100).toLocaleString()}</span>
                    </p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{bid.message}</p>
                  </div>
                  <span className={`ml-4 inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bid.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
