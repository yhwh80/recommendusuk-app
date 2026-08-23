'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useConvexAuth, useMutation } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

// Contact / support page. The form posts to Convex, which emails the message on
// with reply-to set to the sender — so there is no public address to harvest and
// no mailbox needed on the domain.
export default function ContactPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const submit = useMutation(api.contact.submit)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Signed-in visitors shouldn't have to retype what we already know.
  const nameValue = name || user?.name || ''
  const emailValue = email || user?.email || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      await submit({ name: nameValue, email: emailValue, message, website })
      setSent(true)
      setMessage('')
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : ''
      // Convex wraps thrown errors; pull out the readable sentence.
      const match = raw.match(/Uncaught Error:\s*(.+?)(?:\n|\s+at\s)/)
      setError(match?.[1] ?? 'Something went wrong sending your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

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

          {sent ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-left">
              <div className="font-semibold text-green-900 mb-1">Message sent</div>
              <p className="text-sm text-green-800">
                Thanks — we&apos;ve got it and we&apos;ll reply to{' '}
                <span className="font-medium">{emailValue}</span> as soon as we can.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm font-medium text-green-700 hover:text-green-900 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="text-left space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    required
                    value={nameValue}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
                  <input
                    type="email"
                    required
                    value={emailValue}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="How can we help?"
                />
              </div>

              {/* Honeypot — hidden from people, irresistible to bots. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending…' : 'Send message'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                We usually reply within one working day.
              </p>
            </form>
          )}

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
