'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'

const CONTACT_EMAIL = 'hello@recommendusjobsuk.com'

type QA = { q: string; a: string }

// Grouped FAQ. Content mirrors the real product: free posting, credit-based
// proposals, reviews driving the Recommended badge.
const SECTIONS: { title: string; icon: string; items: QA[] }[] = [
  {
    title: 'Getting started',
    icon: '🚀',
    items: [
      { q: 'What is RecommendUsUK?', a: 'RecommendUsUK is a UK marketplace that connects clients who need work done with recommended, rated professionals. Clients post jobs for free; professionals send proposals to the ones they want.' },
      { q: 'How do I sign up?', a: 'Click “Join now”, choose whether you want to hire or to work, and create your account with email or “Continue with Google”. It takes a minute and you get free credits to start.' },
      { q: 'Is it free to join?', a: 'Yes. Creating an account is free. Clients get 25 free credits and professionals get 10 free credits on sign-up.' },
      { q: 'Can I be both a client and a professional?', a: 'You choose a main role when you join. If you need the other side too, get in touch and we’ll help you set it up.' },
    ],
  },
  {
    title: 'For clients',
    icon: '💼',
    items: [
      { q: 'How much does it cost to post a job?', a: 'Nothing. Posting a job and receiving proposals is completely free for clients.' },
      { q: 'How do I choose the right professional?', a: 'Compare the proposals you receive: look at each pro’s profile, skills, past reviews and whether they carry the Recommended badge. You can message anyone with questions before you hire.' },
      { q: 'Do you take a commission on the work?', a: 'No. There’s no commission and no hidden fees. You agree the price directly with the professional you hire.' },
      { q: 'What if I need to edit or cancel my job?', a: 'You can edit or delete a job from your dashboard. If you delete a job before it has received any proposals, any credits spent to post are refunded automatically.' },
    ],
  },
  {
    title: 'For professionals',
    icon: '🎯',
    items: [
      { q: 'How do I get more work?', a: 'Keep your profile complete and up to date, respond to jobs quickly with a tailored proposal, and collect reviews. Strong ratings earn the Recommended badge and put you in front of more clients.' },
      { q: 'What are credits and why do I need them?', a: 'Credits let you send proposals to clients. You spend a credit only when you choose to respond to a job — so you’re only ever paying to reach clients you actually want to work with.' },
      { q: 'How do I get more credits?', a: 'You start with 10 free credits. When you run low you can top up from the “Buy credits” page in your dashboard.' },
      { q: 'Can I withdraw a proposal?', a: 'Yes — you can withdraw a pending proposal from your dashboard before the client accepts it.' },
    ],
  },
  {
    title: 'Credits, payments & refunds',
    icon: '💳',
    items: [
      { q: 'Do credits expire?', a: 'No, your credits stay in your account until you use them.' },
      { q: 'Are credits refundable?', a: 'Credits have no cash value and are generally non-refundable, except where the law requires it or where the platform refunds them automatically (for example, deleting a job that has had no proposals). See our Terms for details.' },
      { q: 'Is my payment secure?', a: 'Payments are handled by a secure payment provider. We never store your full card details on our servers.' },
    ],
  },
  {
    title: 'Reviews, trust & safety',
    icon: '⭐',
    items: [
      { q: 'What does the Recommended badge mean?', a: 'It’s earned from genuine client reviews and a track record of completed jobs. It’s a strong signal of quality — but always use your own judgement too.' },
      { q: 'Can I trust the reviews?', a: 'Reviews come from clients who’ve worked with a professional through the platform. We remove reviews we reasonably believe are fake, abusive or misleading.' },
      { q: 'How do I stay safe when hiring?', a: 'Check profiles and reviews, agree terms and payment clearly in writing, and make sure a professional holds any insurance or qualifications the job needs. Report anything suspicious to us.' },
    ],
  },
  {
    title: 'Account & support',
    icon: '🛠️',
    items: [
      { q: 'I signed in with Google and got sent back to the homepage — what do I do?', a: 'If you’re opening the site inside another app (like WhatsApp, Instagram or Facebook), sign-in can get blocked by that app’s browser. Open recommendusjobsuk.com directly in Safari or Chrome and sign in there. Once signed in, use the “Dashboard” link in the top-right to continue.' },
      { q: 'I forgot my password.', a: 'On the sign-in page, click “Forgot password?” and we’ll email you a reset code.' },
      { q: 'How do I contact support?', a: 'Email us any time and we’ll help.' },
    ],
  },
]

function Item({ q, a }: QA) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900">{q}</span>
        <span className={`shrink-0 text-green-500 transition-transform ${open ? 'rotate-45' : ''}`}>＋</span>
      </button>
      {open && <p className="text-sm text-gray-600 pb-4 -mt-1">{a}</p>}
    </div>
  )
}

export default function FaqPage() {
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
      <SiteHeader label="Help Center" links={headerLinks} />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Frequently asked questions</h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about hiring and working on RecommendUsUK. Still stuck?{' '}
            <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">Contact us</Link>.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title} className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>{section.icon}</span> {section.title}
              </h2>
              <div>
                {section.items.map((item) => (
                  <Item key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-2xl shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Still have a question?</h2>
          <p className="text-gray-600 mb-6">We’re happy to help — get in touch and we’ll get back to you.</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Email {CONTACT_EMAIL}
          </a>
        </div>
      </main>
    </div>
  )
}
