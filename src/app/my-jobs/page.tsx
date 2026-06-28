'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function MyJobsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const jobs = useQuery(api.jobs.listMine)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || jobs === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        label="My Jobs"
        links={[
          { href: '/post-job', label: 'Post a Job' },
          { href: '/dashboard/client', label: 'Dashboard' },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-gray-600">Manage the projects you&apos;ve posted</p>
          </div>
          <Link href="/post-job" className="bg-green-400 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-500 transition-colors">
            + Post Job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs posted yet</h3>
            <p className="text-gray-600 mb-6">Post your first job to start receiving proposals.</p>
            <Link href="/post-job" className="inline-flex items-center px-6 py-3 bg-green-400 text-white font-medium rounded-lg hover:bg-green-500 transition-colors">
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="block bg-white rounded-xl border border-green-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{job.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>£{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}</span>
                      <span>•</span>
                      <span>{job.currentBids}/{job.maxBids} proposals</span>
                    </div>
                  </div>
                  <span className={`ml-4 inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-800' :
                    job.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
