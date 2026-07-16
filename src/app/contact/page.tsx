'use client'

import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'

// Contact / support page. No form backend yet — routes people to email so the
// link is never a dead "reload the homepage" click.
// NOTE: confirm this inbox exists (MX is on Google Workspace) or swap it.
const CONTACT_EMAIL = 'hello@recommendusjobsuk.com'

export default function ContactPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const headerLinks: NavLink[] = isLoading
    ? []
    : isAuthenticated
      ? [{ href: '/dashboard', label: 'Dashboard' }, { href: '/jobs', label: 'Browse jobs' }]
      : [
          { href: '/auth', label: 'Sign in' },
          { href: '/auth?signup=true', label: 'Join now', primary: true },
        ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <SiteHeader label="Contact" links={headerLinks} />

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Get in touch</h1>
          <p className="text-gray-600 mb-8">
            Questions, feedback or need a hand with your account? We’re happy to help — drop us a message and we’ll get back to you.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Email {CONTACT_EMAIL}
          </a>

          <div className="mt-10 pt-8 border-t border-gray-100 text-left grid gap-4 sm:grid-cols-2">
            <Link href="/how-it-works" className="block rounded-xl border border-gray-200 p-4 hover:border-green-400 hover:bg-green-50 transition-colors">
              <div className="font-semibold text-gray-900">How it works</div>
              <div className="text-sm text-gray-600">New here? Start with the basics.</div>
            </Link>
            <Link href="/jobs" className="block rounded-xl border border-gray-200 p-4 hover:border-green-400 hover:bg-green-50 transition-colors">
              <div className="font-semibold text-gray-900">Browse jobs</div>
              <div className="text-sm text-gray-600">See what clients are hiring for.</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
