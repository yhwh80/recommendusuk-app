'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function FreelancersPage() {
  const freelancers = useQuery(api.users.listFreelancers)

  if (freelancers === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-gray-600">Browse Freelancers</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/jobs" className="text-gray-600 hover:text-green-500 font-medium">Browse Jobs</Link>
              <Link href="/auth?signup=true" className="bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors">Join now</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Freelancers</h1>
          <p className="text-gray-600">Find recommended professionals for your project</p>
        </div>

        {freelancers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No freelancers yet</h3>
            <p className="text-gray-600">Check back soon as professionals join the platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.map((f) => (
              <Link
                key={f._id}
                href={`/profile/${f._id}`}
                className="bg-white rounded-2xl border border-green-100 p-6 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4 mb-4">
                  {f.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.profilePictureUrl} alt={f.name ?? 'Freelancer'} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-white text-xl font-semibold">
                        {f.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{f.name || 'Freelancer'}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>⭐ {f.totalRating.toFixed(1)}</span>
                      <span>•</span>
                      <span>{f.totalJobsCompleted} jobs</span>
                    </div>
                  </div>
                </div>

                {f.isRecommended && (
                  <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full mb-3">
                    ✓ Recommended
                  </span>
                )}

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {f.bio || 'No bio yet.'}
                </p>

                {f.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {f.skills.slice(0, 4).map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                  <span>{f.location || 'UK'}</span>
                  {f.hourlyRate != null && (
                    <span className="font-medium text-green-600">£{f.hourlyRate}/hr</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
