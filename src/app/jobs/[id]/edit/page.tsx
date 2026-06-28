'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as Id<'jobs'>

  const job = useQuery(api.jobs.get, { id: jobId })
  const user = useCurrentUser()
  const updateJob = useMutation(api.jobs.update)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    budget_min: '',
    budget_max: '',
    skills: '',
    deadline: '',
  })

  // Pre-fill once the job loads.
  useEffect(() => {
    if (job && !hydrated) {
      setForm({
        title: job.title,
        description: job.description,
        location: job.location ?? '',
        budget_min: String(job.budgetMin / 100),
        budget_max: String(job.budgetMax / 100),
        skills: (job.skills ?? []).join(', '),
        deadline: job.deadline
          ? new Date(job.deadline).toISOString().slice(0, 10)
          : '',
      })
      setHydrated(true)
    }
  }, [job, hydrated])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await updateJob({
        jobId,
        title: form.title,
        description: form.description,
        location: form.location.trim() || undefined,
        budgetMin: Math.round(parseFloat(form.budget_min) * 100),
        budgetMax: Math.round(parseFloat(form.budget_max) * 100),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: form.deadline ? new Date(form.deadline).getTime() : undefined,
      })
      setMessage('Job updated!')
      setTimeout(() => router.push(`/jobs/${jobId}`), 900)
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to update job')
    } finally {
      setSubmitting(false)
    }
  }

  if (job === undefined || user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Guard: must be the owner, and the job must still be open.
  if (job === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h1>
          <Link href="/my-jobs" className="text-green-600 hover:text-green-700">← Back to my jobs</Link>
        </div>
      </div>
    )
  }
  if (!user || job.clientId !== user._id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not your job to edit</h1>
          <Link href={`/jobs/${jobId}`} className="text-green-600 hover:text-green-700">← Back to job</Link>
        </div>
      </div>
    )
  }
  if (job.status !== 'open') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This job can&apos;t be edited</h1>
          <p className="text-gray-600 mb-4">Only open jobs can be edited. This one is {job.status}.</p>
          <Link href={`/jobs/${jobId}`} className="text-green-600 hover:text-green-700">← Back to job</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/jobs/${jobId}`} className="text-gray-600 hover:text-green-600 font-medium">
                ← Back to job
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-green-600 font-medium">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job</h1>
          <p className="text-gray-600">Update your posting — editing is free and doesn&apos;t cost credits</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
              <textarea
                name="description" value={form.description} onChange={handleChange} required rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Area / Location *</label>
              <input
                type="text" name="location" value={form.location} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Crawley, West Sussex"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Budget (£) *</label>
                <input
                  type="number" name="budget_min" value={form.budget_min} onChange={handleChange} required min="1" step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Budget (£) *</label>
                <input
                  type="number" name="budget_max" value={form.budget_max} onChange={handleChange} required min="1" step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills Needed</label>
                <input
                  type="text" name="skills" value={form.skills} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="React, Plumbing, Logo Design"
                />
                <p className="text-sm text-gray-500 mt-1">Comma-separated</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date" name="deadline" value={form.deadline} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('updated')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <Link href={`/jobs/${jobId}`} className="text-gray-600 hover:text-gray-800 font-medium">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
