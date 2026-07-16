'use client'

import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'

// Static "How it Works" marketing page. Mirrors the real product flow:
// clients post free, freelancers spend credits to propose, reviews drive the
// Recommended badge (same credit model as Bark.com).
export default function HowItWorksPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const headerLinks: NavLink[] = isLoading
    ? []
    : isAuthenticated
      ? [{ href: '/dashboard', label: 'Dashboard' }, { href: '/jobs', label: 'Browse jobs' }]
      : [
          { href: '/auth', label: 'Sign in' },
          { href: '/auth?signup=true', label: 'Join now', primary: true },
        ]

  const clientSteps = [
    { n: '1', title: 'Post your job — free', body: 'Describe what you need and where. Posting a job costs you nothing and takes a couple of minutes.' },
    { n: '2', title: 'Get proposals from recommended pros', body: 'Local, rated professionals send you proposals. Compare their profiles, past reviews and the Recommended badge.' },
    { n: '3', title: 'Hire the right person', body: 'Message anyone with a question, then accept the proposal that fits. No commission, no hidden fees.' },
    { n: '4', title: 'Complete & leave a review', body: 'When the work is done, leave a review. Your feedback keeps the marketplace trustworthy for everyone.' },
  ]

  const proSteps = [
    { n: '1', title: 'Build your profile', body: 'Add your skills, photo and area. A strong profile wins more work. You start with 10 free credits.' },
    { n: '2', title: 'Browse matching jobs', body: 'Find jobs by keyword, area, skill or category — or get leads matched to the skills on your profile.' },
    { n: '3', title: 'Send a proposal', body: 'Spend a credit to submit a proposal to a client. You only pay to reach a client you actually want to work with.' },
    { n: '4', title: 'Get hired & earn your badge', body: 'Deliver great work, collect reviews, and earn the Recommended badge that puts you in front of more clients.' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <SiteHeader label="How it Works" links={headerLinks} />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">How RecommendUsUK works</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A simpler way to hire trusted, recommended professionals — or to win work as one. Posting is free for clients; professionals only spend credits when they choose to respond.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>💼</span> For clients
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {clientSteps.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/auth?type=client" className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
              Post a job — free
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <span>🎯</span> For professionals
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {proSteps.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/auth?type=freelancer" className="inline-block border-2 border-green-500 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors">
              Find work
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Common questions</h2>
          <dl className="space-y-5">
            <div>
              <dt className="font-semibold text-gray-900">Is it free to post a job?</dt>
              <dd className="text-gray-600 text-sm mt-1">Yes. Clients post jobs and receive proposals for free. New clients also get 25 free credits.</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">What are credits?</dt>
              <dd className="text-gray-600 text-sm mt-1">Credits let professionals send proposals to clients. You start with 10 free credits and can top up any time — you only spend a credit when you choose to respond to a job.</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">What does the Recommended badge mean?</dt>
              <dd className="text-gray-600 text-sm mt-1">It’s earned from genuine client reviews. A Recommended pro has a track record of completed jobs and strong ratings, so clients can hire with confidence.</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Do you take a commission?</dt>
              <dd className="text-gray-600 text-sm mt-1">No. There’s no commission on the work you win and no hidden fees — professionals simply spend credits to send proposals.</dd>
            </div>
          </dl>
          <p className="text-sm text-gray-500 mt-6">
            See more in our <Link href="/faq" className="text-green-600 hover:text-green-700 font-medium">FAQ</Link>, or{' '}
            <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">contact us</Link>.
          </p>
        </section>
      </main>
    </div>
  )
}
