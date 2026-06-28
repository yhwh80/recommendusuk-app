'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { SiteHeader } from '@/components/SiteHeader'

export default function JobsPage() {
  const [filter, setFilter] = useState<'all' | 'open'>('all')
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [skill, setSkill] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const allJobs = useQuery(api.jobs.listWithClient, filter === 'open' ? { status: 'open' } : {})
  const categories = useQuery(api.categories.list)

  // Client-side filtering on the fetched list.
  const jobs = (allJobs ?? []).filter((job) => {
    const q = search.trim().toLowerCase()
    if (q) {
      const hay = [
        job.title,
        job.description,
        job.location ?? '',
        (job.skills ?? []).join(' '),
        job.categoryName ?? '',
      ].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (area.trim() && !(job.location ?? '').toLowerCase().includes(area.trim().toLowerCase())) {
      return false
    }
    if (skill.trim()) {
      const s = skill.trim().toLowerCase()
      if (!(job.skills ?? []).some((sk) => sk.toLowerCase().includes(s))) return false
    }
    if (categoryId && job.categoryId !== categoryId) return false
    return true
  })

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

  if (allJobs === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        label="Browse Jobs"
        links={[
          { href: '/auth', label: 'Sign in' },
          { href: '/auth?signup=true', label: 'Join now', primary: true },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">Find the perfect project for your skills</p>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8 space-y-4">
          {/* Search bar */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title, description, skill, area…"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="📍 Area (e.g. Crawley)"
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="🛠 Skill (e.g. Plumbing)"
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">All categories</option>
              {(categories ?? []).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'open' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Open only
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{jobs.length} job{jobs.length === 1 ? '' : 's'}</span>
              {(search || area || skill || categoryId) && (
                <button
                  onClick={() => { setSearch(''); setArea(''); setSkill(''); setCategoryId('') }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
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
                        {job.categoryName && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            {job.categoryName}
                          </span>
                        )}
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
