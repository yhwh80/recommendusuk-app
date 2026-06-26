'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function PostJobPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const createJob = useMutation(api.jobs.create)
  const categories = useQuery(api.categories.list)
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    location: '',
    skills: '',
    deadline: '',
  })

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/auth?type=client')
      return
    }
    if (user && user.role === 'freelancer') {
      router.push('/dashboard/freelancer')
    }
  }, [isLoading, isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if ((user.credits ?? 0) < 5) {
      setMessage('Insufficient credits. You need 5 credits to post a job.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const jobId = await createJob({
        title: formData.title,
        description: formData.description,
        categoryId: formData.category
          ? (formData.category as Id<'categories'>)
          : undefined,
        budgetMin: Math.round(parseFloat(formData.budget_min) * 100), // £ → pence
        budgetMax: Math.round(parseFloat(formData.budget_max) * 100),
        location: formData.location.trim() || undefined,
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: formData.deadline
          ? new Date(formData.deadline).getTime()
          : undefined,
      })
      setMessage('Job posted successfully!')
      setTimeout(() => {
        router.push(`/jobs/${jobId}`)
      }, 1200)
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to post job')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const credits = user.credits ?? 0

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
              <span className="font-medium text-gray-600">Post a Job</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/dashboard/client" className="text-gray-600 hover:text-green-600 font-medium">
                Dashboard
              </Link>
              <div className="text-sm text-gray-600">
                Credits: <span className="font-medium">{credits}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
          <p className="text-gray-600">Tell us about your project and find the perfect freelancer</p>
        </div>

        {/* Credit Warning */}
        {credits < 5 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Insufficient Credits</h3>
                <p className="text-red-700">You need 5 credits to post a job. You currently have {credits} credits.</p>
                <Link href="/buy-credits" className="text-red-600 hover:text-red-800 font-medium">
                  Buy more credits →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-green-800">
              <span className="text-xl mr-2">💰</span>
              <span>Posting this job will cost <strong>5 credits</strong>. You have <strong>{credits} credits</strong> available.</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Build a WordPress website for my business"
              />
              <p className="text-sm text-gray-500 mt-1">Be specific and descriptive</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Describe your project in detail. Include requirements, timeline, and any specific technologies or skills needed..."
              />
              <p className="text-sm text-gray-500 mt-1">The more details you provide, the better proposals you'll receive</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">Select a category (optional)</option>
                {(categories ?? []).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area / Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. Crawley, West Sussex"
              />
              <p className="text-sm text-gray-500 mt-1">Where the work needs doing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Budget (£) *
                </label>
                <input
                  type="number"
                  name="budget_min"
                  value={formData.budget_min}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Budget (£) *
                </label>
                <input
                  type="number"
                  name="budget_max"
                  value={formData.budget_max}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="500.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Needed
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="React, Plumbing, Logo Design"
                />
                <p className="text-sm text-gray-500 mt-1">Comma-separated (optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">When you need it done (optional)</p>
              </div>
            </div>

            {/* Important Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Your job will receive a maximum of <strong>3 proposals</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Job posting costs <strong>5 credits</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>You can review all proposals before making a decision</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span>Job automatically closes when 3 proposals are received</span>
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('success')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <Link
                href="/dashboard/client"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back to Dashboard
              </Link>

              <button
                type="submit"
                disabled={submitting || credits < 5}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting Job...' : 'Post Job (5 Credits)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
