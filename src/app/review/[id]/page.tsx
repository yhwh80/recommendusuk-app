'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { useCurrentUser } from '@/lib/useCurrentUser'
import { setPostAuthRedirect } from '@/lib/postAuthRedirect'
import { SiteHeader } from '@/components/SiteHeader'

// Landing page for a worker's "review me" link, sent to their past customers.
export default function InvitedReviewPage() {
  const params = useParams()
  const id = params.id as Id<'users'>
  const router = useRouter()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useCurrentUser()
  const worker = useQuery(api.users.getPublicProfile, { id })
  const createInvited = useMutation(api.ratings.createInvited)

  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [recommended, setRecommended] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (worker === undefined || isLoading || (isAuthenticated && me === undefined)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (worker === null || worker.role !== 'freelancer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">This review link isn&apos;t valid</h1>
          <Link href="/" className="text-green-600 hover:text-green-700">Go to RecommendUsUK</Link>
        </div>
      </div>
    )
  }

  const name = worker.name || 'this professional'

  const goToSignUp = (signup: boolean) => {
    setPostAuthRedirect(`/review/${id}`)
    router.push(signup ? '/auth?signup=1&type=client' : '/auth')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Please choose a star rating.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createInvited({ revieweeId: id, rating, reviewText, recommended })
      setDone(true)
    } catch (err: unknown) {
      setError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader label="Leave a review" />

      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-green-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            {worker.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={worker.profilePictureUrl} alt={name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review {name}</h1>
              <p className="text-gray-500 text-sm">
                {[worker.skills.slice(0, 3).join(', '), worker.location].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>

          {done ? (
            <div className="space-y-4">
              <p className="text-green-700 font-medium">Thank you! Your review is now on {name}&apos;s profile.</p>
              <p className="text-gray-600 text-sm">
                Need another job doing? Post it on RecommendUsUK for free and get up to 3 quotes from
                local professionals.
              </p>
              <div className="flex gap-4">
                <Link href="/post-job" className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700">
                  Post a job free
                </Link>
                <Link href={`/profile/${id}`} className="px-5 py-2.5 text-gray-700 hover:text-gray-900">
                  See their profile
                </Link>
              </div>
            </div>
          ) : !isAuthenticated || !me ? (
            <div className="space-y-4">
              <p className="text-gray-700">
                {name} has asked you to review work they&apos;ve done for you. It takes a minute.
              </p>
              <p className="text-gray-600 text-sm">
                To keep reviews genuine, you&apos;ll need a free customer account with a verified email.
                You won&apos;t be charged anything, and you can use it to post jobs for free later.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => goToSignUp(true)}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700"
                >
                  Create a free account
                </button>
                <button
                  onClick={() => goToSignUp(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  I already have an account
                </button>
              </div>
              <p className="text-xs text-gray-500">If you sign up with Google, choose &quot;Hire&quot; when asked.</p>
            </div>
          ) : me._id === id ? (
            <p className="text-gray-700">
              This is your review link. Send it to past customers so they can review you.
            </p>
          ) : me.role !== 'client' ? (
            <p className="text-gray-700">
              You&apos;re signed in with a worker account. Reviews need to come from a customer account. Sign
              out and create a free customer account to leave a review.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">Your rating</p>
                <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onClick={() => setRating(n)}
                      className={`text-3xl ${n <= rating ? 'opacity-100' : 'opacity-30'} hover:opacity-100`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What did they do, and how did it go?</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Replaced our boiler in a day, tidy and on time."
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={recommended} onChange={(e) => setRecommended(e.target.checked)} />
                I&apos;d recommend {name}
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-xs text-gray-500">
                Your review will be shown as from a past customer, not a job booked through RecommendUsUK.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
