'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function PublicProfilePage() {
  const params = useParams()
  const id = params.id as Id<'users'>
  const profile = useQuery(api.users.getPublicProfile, { id })
  const reviews = useQuery(api.ratings.listForUser, { userId: id })
  const me = useCurrentUser()

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <Link href="/freelancers" className="text-green-600 hover:text-green-700">← Back to freelancers</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
            </Link>
            <Link href="/freelancers" className="text-gray-600 hover:text-green-500 font-medium">
              ← All freelancers
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile header card */}
        <div className="bg-white rounded-2xl border border-green-100 p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center shadow-inner shrink-0">
              <span className="text-white text-4xl font-semibold">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name || 'Freelancer'}</h1>
                {profile.isRecommended && (
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    ✓ Recommended
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-3 capitalize">{profile.role || 'professional'} · {profile.location || 'UK'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-600">
                <span>⭐ <strong>{profile.totalRating.toFixed(1)}</strong> rating</span>
                <span><strong>{profile.totalJobsCompleted}</strong> jobs completed</span>
                <span><strong>{profile.bidCount}</strong> proposals</span>
                {profile.hourlyRate != null && (
                  <span className="text-green-600 font-medium">£{profile.hourlyRate}/hr</span>
                )}
              </div>
              {me && me._id !== id && (
                <Link
                  href={`/messages/${id}`}
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  💬 Message {profile.name?.split(' ')[0] || 'freelancer'}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-green-100 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{profile.bio || 'This freelancer has not added a bio yet.'}</p>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-green-100 p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
          {profile.skills.length === 0 ? (
            <p className="text-gray-500">No skills listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl border border-green-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
          </h2>
          {reviews === undefined ? (
            <p className="text-gray-400">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{'⭐'.repeat(r.rating)}</span>
                    {r.recommended && (
                      <span className="text-green-700 text-sm font-medium">✓ Recommended</span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{r.reviewText}</p>
                  {r.responseText && (
                    <p className="text-gray-500 text-sm mt-2 pl-3 border-l-2 border-green-200">
                      <span className="font-medium">Response:</span> {r.responseText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
