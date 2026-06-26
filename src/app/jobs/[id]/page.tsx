'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { useCurrentUser } from '@/lib/useCurrentUser'

export const dynamic = 'force-dynamic'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as Id<'jobs'>

  const job = useQuery(api.jobs.getWithClient, { id: jobId })
  const bids = useQuery(api.bids.listByJobWithUser, { jobId })
  const user = useCurrentUser()
  const reviews = useQuery(api.ratings.forJob, { jobId })
  const createBid = useMutation(api.bids.create)
  const removeJob = useMutation(api.jobs.remove)
  const acceptBid = useMutation(api.jobs.acceptBid)
  const completeJob = useMutation(api.jobs.complete)
  const createReview = useMutation(api.ratings.create)

  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [recommended, setRecommended] = useState(true)

  async function handleComplete() {
    if (!window.confirm('Mark this job as complete? You can then leave a review.')) return
    try {
      await completeJob({ jobId })
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to complete job')
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault()
    if (!job?.selectedProfessionalId) return
    try {
      await createReview({
        jobId,
        revieweeId: job.selectedProfessionalId,
        rating,
        reviewText,
        recommended,
      })
      setReviewText('')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit review')
    }
  }

  async function handleAccept(bidId: Id<'bids'>, proName: string | null) {
    if (!window.confirm(`Accept ${proName || 'this freelancer'}'s proposal? This closes the job to further bids.`)) {
      return
    }
    try {
      await acceptBid({ jobId, bidId })
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to accept proposal')
    }
  }

  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!job) return
    const willRefund = job.currentBids === 0
    const msg = willRefund
      ? 'Delete this job? No one has bid yet, so your 5 credits will be refunded.'
      : 'Delete this job? It has bids, so the 5 credits will NOT be refunded.'
    if (!window.confirm(msg)) return
    setDeleting(true)
    try {
      const res = await removeJob({ jobId })
      router.push('/my-jobs')
      void res
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete job')
      setDeleting(false)
    }
  }

  async function submitBid(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      router.push('/auth?type=freelancer')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      await createBid({
        jobId,
        amount: Math.round(parseFloat(bidAmount) * 100), // £ → pence
        message: bidMessage,
      })
      setMessage('Proposal submitted successfully!')
      setBidAmount('')
      setBidMessage('')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit proposal')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  if (job === undefined || bids === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (job === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h1>
          <Link href="/jobs" className="text-green-600 hover:text-green-800">← Back to jobs</Link>
        </div>
      </div>
    )
  }

  const userBid = user ? bids.find((bid) => bid.professionalId === user._id) : null
  const canBid =
    user && user.role !== 'client' && !userBid && job.status === 'open' && bids.length < job.maxBids

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
              <Link href="/jobs" className="text-gray-600 hover:text-green-600">Browse Jobs</Link>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-gray-600">Job Details</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link href={`/dashboard/${user.role === 'client' ? 'client' : 'freelancer'}`} className="text-gray-600 hover:text-green-600 font-medium">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="text-gray-600 hover:text-green-600 font-medium">
                    Sign in
                  </Link>
                  <Link href="/auth?signup=true" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Join now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Posted by {job.clientName || 'Client'}</span>
                    <span>•</span>
                    <span>{formatDate(job._creationTime)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === 'open' ? 'bg-green-100 text-green-800' :
                  job.status === 'closed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>

              {/* Owner controls */}
              {user && job.clientId === user._id && (
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                  {job.status === 'open' && (
                    <Link
                      href={`/jobs/${jobId}/edit`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✏️ Edit Job
                    </Link>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : '🗑 Delete Job'}
                  </button>
                  {job.selectedProfessionalId && job.status !== 'completed' && (
                    <button
                      onClick={handleComplete}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✅ Mark as Complete
                    </button>
                  )}
                  {job.status === 'open' && (
                    <span className="text-xs text-gray-500">
                      {job.currentBids === 0
                        ? 'Delete now → 5 credits refunded'
                        : 'Has bids → no refund on delete'}
                    </span>
                  )}
                </div>
              )}

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-3">Project Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Skills Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    £{(job.budgetMin / 100).toLocaleString()} - £{(job.budgetMax / 100).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Budget Range</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {job.currentBids}/{job.maxBids}
                  </div>
                  <div className="text-sm text-gray-600">Proposals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {job.costCredits}
                  </div>
                  <div className="text-sm text-gray-600">Credits Cost</div>
                </div>
              </div>
            </div>

            {/* Proposals */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Proposals ({bids.length})
              </h2>

              {bids.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-gray-600">No proposals submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => {
                    const isOwner = user && job.clientId === user._id
                    return (
                    <div
                      key={bid._id}
                      className={`border rounded-lg p-4 ${
                        bid.status === 'accepted'
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/profile/${bid.professionalId}`}
                          className="flex items-center space-x-3 group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {bid.professionalName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-green-600">
                              {bid.professionalName || 'Freelancer'} <span className="text-xs text-gray-400">· view profile</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>⭐ {bid.professionalRating.toFixed(1)}</span>
                              {bid.professionalRecommended && (
                                <span className="text-green-600">✓ Recommended</span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            £{(bid.amount / 100).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(bid._creationTime)}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700">{bid.message}</p>

                      {/* Status + accept (owner only) */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bid.status}
                        </span>
                        {isOwner && !job.selectedProfessionalId && job.status !== 'completed' && bid.status === 'pending' && (
                          <button
                            onClick={() => handleAccept(bid._id, bid.professionalName)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            ✓ Accept Proposal
                          </button>
                        )}
                        {bid.status === 'accepted' && (
                          <Link
                            href={`/profile/${bid.professionalId}`}
                            className="text-sm text-green-700 font-medium hover:underline"
                          >
                            View hired freelancer →
                          </Link>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* Complete → Review (owner, completed jobs) */}
            {user && job.clientId === user._id && job.status === 'completed' && job.selectedProfessionalId && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h2>
                {reviews?.some((r) => r.reviewerId === user._id) ? (
                  (() => {
                    const mine = reviews.find((r) => r.reviewerId === user._id)!
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{'⭐'.repeat(mine.rating)}</span>
                          {mine.recommended && (
                            <span className="text-green-700 text-sm font-medium">✓ Recommended</span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm">{mine.reviewText}</p>
                        <p className="text-xs text-gray-400 mt-2">Thanks — your review is on the freelancer&apos;s profile.</p>
                      </div>
                    )
                  })()
                ) : (
                  <form onSubmit={handleReview} className="space-y-4">
                    <p className="text-gray-600 text-sm">Rate the freelancer you hired — it builds their reputation.</p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            className={`text-3xl transition-opacity ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      required
                      rows={3}
                      placeholder="How was the work? Would you hire them again?"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={recommended}
                        onChange={(e) => setRecommended(e.target.checked)}
                        className="h-4 w-4"
                      />
                      I recommend this freelancer
                    </label>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Bid Form */}
            {user ? (
              canBid ? (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Proposal</h3>

                  <form onSubmit={submitBid} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Bid Amount (£)
                      </label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min="1"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter your bid amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposal Message
                      </label>
                      <textarea
                        value={bidMessage}
                        onChange={(e) => setBidMessage(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Explain why you're the best choice for this project..."
                      />
                    </div>

                    {message && (
                      <div className={`p-3 rounded-lg text-sm ${
                        message.includes('success')
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {message}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </button>
                  </form>
                </div>
              ) : userBid ? (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Proposal</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="font-semibold text-green-900 mb-2">
                      £{(userBid.amount / 100).toLocaleString()}
                    </div>
                    <p className="text-green-700 text-sm">{userBid.message}</p>
                    <div className="mt-2 text-xs text-green-600">
                      Status: {userBid.status}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Cannot Bid</h3>
                  <p className="text-gray-600 text-sm">
                    {job.status !== 'open' ? 'This job is no longer accepting proposals.' :
                     bids.length >= job.maxBids ? 'Maximum number of proposals reached.' :
                     'You cannot bid on this job.'}
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Want to bid?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sign up to submit proposals and start earning
                </p>
                <Link
                  href="/auth?type=freelancer"
                  className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Join as Freelancer
                </Link>
              </div>
            )}

            {/* Message the client (non-owners) */}
            {user && job.clientId !== user._id && (
              <Link
                href={`/messages/${job.clientId}`}
                className="block w-full text-center bg-white border border-green-200 text-green-700 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors mb-6"
              >
                💬 Message {job.clientName || 'the client'}
              </Link>
            )}

            {/* Job Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium">{formatDate(job._creationTime)}</span>
                </div>
                {job.deadline != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline</span>
                    <span className="font-medium">{formatDate(job.deadline)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals</span>
                  <span className="font-medium">{job.currentBids}/{job.maxBids}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium capitalize">{job.status}</span>
                </div>
                {job.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                )}
                {job.categoryName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium">{job.categoryName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Client</span>
                  <span className="font-medium">{job.clientName || 'Anonymous'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
