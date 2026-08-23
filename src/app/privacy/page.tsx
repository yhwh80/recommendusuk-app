'use client'

import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'

// Privacy policy. Written against what the app ACTUALLY does — every claim here
// maps to something in convex/schema.ts or a provider we genuinely call. If the
// data we collect changes, this page has to change with it.
const LAST_UPDATED = '23 August 2026'

export default function PrivacyPage() {
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
      <SiteHeader label="Privacy Policy" links={headerLinks} />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Who we are</h2>
              <p>
                RecommendUsUK is operated by Simon Powell, a sole trader based in the
                United Kingdom, trading as RecommendUsUK. We are the data controller
                for the personal information described in this policy.
              </p>
              <p className="mt-2">
                You can reach us at any time through our{' '}
                <Link href="/contact" className="text-green-700 underline hover:text-green-900">
                  contact page
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. What we collect</h2>
              <p className="mb-3">We only collect what the service actually needs:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account details</strong> — your name, email address, and
                  whether you use the site as a customer or a professional. If you
                  sign in with Google, we receive your name, email address and profile
                  picture from Google. If you sign up with a password, that password
                  is stored only in an encrypted (hashed) form that we cannot read.
                </li>
                <li>
                  <strong>Profile information</strong> — anything you choose to add,
                  such as a photo, biography, skills, hourly rate, general location,
                  and any photos or videos you upload to your portfolio.
                </li>
                <li>
                  <strong>Jobs and proposals</strong> — the jobs you post, including
                  descriptions, budgets and locations, and the proposals and prices
                  professionals submit in response.
                </li>
                <li>
                  <strong>Messages and reviews</strong> — messages you send to other
                  users through the site, and any ratings or reviews you leave.
                </li>
                <li>
                  <strong>Payment records</strong> — when you buy credits we keep a
                  record of the purchase, the credits added, and a reference to the
                  Stripe payment.{' '}
                  <strong>
                    We never see or store your card number — that goes directly to
                    Stripe.
                  </strong>
                </li>
                <li>
                  <strong>Contact messages</strong> — the name, email address and
                  message you send us through the contact form.
                </li>
              </ul>
              <p className="mt-3">
                We do <strong>not</strong> use advertising trackers, analytics
                services, or third-party cookies, and we do not build advertising
                profiles about you.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                3. Why we use it, and our legal basis
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>To provide the service</strong> — running your account,
                  showing jobs to professionals, delivering proposals and messages,
                  and processing credit purchases. Legal basis:{' '}
                  <em>performance of a contract</em> with you.
                </li>
                <li>
                  <strong>To keep the marketplace working properly</strong> —
                  preventing fraud and abuse, and fixing problems. Legal basis:{' '}
                  <em>our legitimate interests</em> in running a safe service.
                </li>
                <li>
                  <strong>To send service emails</strong> — sign-in codes, password
                  resets, and notifications about proposals, messages and payments.
                  Legal basis: <em>performance of a contract</em>.
                </li>
                <li>
                  <strong>To keep financial records</strong> — as required for tax and
                  accounting. Legal basis: <em>legal obligation</em>.
                </li>
              </ul>
              <p className="mt-3">
                We do not send marketing emails, and we do not sell your personal
                information to anyone.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                4. What other users can see
              </h2>
              <p>
                Some information is deliberately visible to other people so the
                marketplace can work. Your public profile shows your name, photo,
                biography, skills, general location, hourly rate and any reviews you
                have received.{' '}
                <strong>
                  Your email address is never shown on your public profile.
                </strong>
              </p>
              <p className="mt-2">
                When you post a job, the details are visible to professionals on the
                site. When you submit a proposal, the customer sees it along with your
                profile. Reviews you leave are public.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                5. Who we share it with
              </h2>
              <p className="mb-3">
                We use a small number of service providers who process data on our
                behalf, under contract:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Convex</strong> — our database and file storage.
                </li>
                <li>
                  <strong>Stripe</strong> — payment processing. Stripe handles your
                  card details directly under its own privacy policy.
                </li>
                <li>
                  <strong>Resend</strong> — sending our service emails.
                </li>
                <li>
                  <strong>Google</strong> — only if you choose to sign in with Google.
                </li>
                <li>
                  <strong>Hostinger</strong> — hosting for the website itself.
                </li>
              </ul>
              <p className="mt-3">
                We may also disclose information if we are legally required to, or to
                protect our rights or the safety of our users.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                6. Transfers outside the UK
              </h2>
              <p>
                Some of our providers store or process data outside the United
                Kingdom, including in the United States and the European Union. Where
                that happens, the transfer is covered by appropriate safeguards
                recognised under UK data protection law, such as the UK International
                Data Transfer Agreement or the UK extension to the EU–US Data Privacy
                Framework.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                7. How long we keep it
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account and profile information</strong> — while your
                  account is open, and for a short period afterwards in case you
                  return.
                </li>
                <li>
                  <strong>Jobs, proposals, messages and reviews</strong> — while your
                  account is open, so both sides keep a record of what was agreed.
                </li>
                <li>
                  <strong>Payment and credit records</strong> — six years, as required
                  for UK tax purposes.
                </li>
                <li>
                  <strong>Contact form messages</strong> — up to two years.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Your rights</h2>
              <p className="mb-3">
                Under UK data protection law you have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ask for a copy of the personal information we hold about you</li>
                <li>Ask us to correct anything that is wrong</li>
                <li>
                  Ask us to delete your information, where we are not required to keep
                  it
                </li>
                <li>Ask us to restrict how we use it, or object to our using it</li>
                <li>Ask for your information in a portable format</li>
              </ul>
              <p className="mt-3">
                To exercise any of these, message us through the{' '}
                <Link href="/contact" className="text-green-700 underline hover:text-green-900">
                  contact page
                </Link>
                . We will respond within one month.
              </p>
              <p className="mt-3">
                If you are unhappy with how we have handled your information, you can
                complain to the Information Commissioner&apos;s Office at{' '}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 underline hover:text-green-900"
                >
                  ico.org.uk
                </a>
                , or on 0303 123 1113. We would appreciate the chance to put things
                right first.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Cookies</h2>
              <p>
                We use only the cookies needed to keep you signed in and to keep the
                site secure. We do not use advertising or analytics cookies, so there
                is no cookie banner to dismiss. You can clear cookies in your browser
                settings, but you will be signed out if you do.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Children</h2>
              <p>
                RecommendUsUK is not intended for anyone under 18, and we do not
                knowingly collect information about children. If you believe a child
                has given us their information, please tell us and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                11. Changes to this policy
              </h2>
              <p>
                If we change how we handle your information we will update this page
                and change the date at the top. If the change is significant, we will
                tell you by email.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-green-700 underline hover:text-green-900">
              Terms of Service
            </Link>
            <Link href="/faq" className="text-green-700 underline hover:text-green-900">
              FAQ
            </Link>
            <Link href="/contact" className="text-green-700 underline hover:text-green-900">
              Contact us
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
