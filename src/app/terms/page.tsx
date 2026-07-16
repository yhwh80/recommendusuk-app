'use client'

import Link from 'next/link'
import { useConvexAuth } from 'convex/react'
import { SiteHeader, NavLink } from '@/components/SiteHeader'

// Plain-English Terms of Service. STARTING TEMPLATE — have it reviewed before
// relying on it. Governing law: England & Wales.
const LAST_UPDATED = '16 July 2026'
const CONTACT_EMAIL = 'hello@recommendusjobsuk.com'

export default function TermsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const headerLinks: NavLink[] = isLoading
    ? []
    : isAuthenticated
      ? [{ href: '/dashboard', label: 'Dashboard' }]
      : [
          { href: '/auth', label: 'Sign in' },
          { href: '/auth?signup=true', label: 'Join now', primary: true },
        ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <SiteHeader label="Terms of Service" links={headerLinks} />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. About these terms</h2>
              <p>These terms govern your use of RecommendUsUK (“the platform”, “we”, “us”). By creating an account or using the platform you agree to them. If you do not agree, please do not use the platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Your account</h2>
              <p>You must be at least 18 and provide accurate details. You are responsible for keeping your login secure and for all activity under your account. Let us know promptly if you suspect unauthorised use.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How the marketplace works</h2>
              <p>RecommendUsUK connects clients who post jobs with professionals who offer services. We are a platform that facilitates introductions — we are not a party to any agreement or contract for work between a client and a professional, and we do not employ the professionals listed.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Credits and payments</h2>
              <p>Professionals use credits to send proposals to clients. Credits are granted on sign-up and may be purchased. Credits have no cash value, are non-transferable, and are non-refundable except where required by law or expressly stated (for example, an automatic refund when a job is deleted before it has received any proposals).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Clients and professionals</h2>
              <p>Clients are responsible for describing their needs accurately and for agreeing terms directly with any professional they hire. Professionals are responsible for the quality, legality and safety of the services they provide, and for holding any qualifications, insurance or licences their work requires.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Reviews and the Recommended badge</h2>
              <p>Reviews must be honest and based on genuine experience. We may remove reviews or badges that we reasonably believe are fake, abusive or misleading. Ratings and the Recommended badge are indicators only and are not a guarantee of any professional’s work.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Acceptable use</h2>
              <p>You agree not to misuse the platform — including posting unlawful, fraudulent or offensive content, harassing other users, circumventing credits or fees, scraping data, or attempting to disrupt the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Liability</h2>
              <p>The platform is provided “as is”. To the extent permitted by law, we are not liable for the acts, omissions, or work of any client or professional, or for any loss arising from an arrangement made through the platform. Nothing in these terms excludes liability that cannot be excluded under law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Changes and termination</h2>
              <p>We may update these terms or the platform from time to time. We may suspend or close accounts that breach these terms. You can stop using the platform at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Governing law</h2>
              <p>These terms are governed by the laws of England and Wales, and the courts of England and Wales have exclusive jurisdiction.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Contact</h2>
              <p>Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-600 hover:text-green-700 font-medium">{CONTACT_EMAIL}</a> or visit our <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">contact page</Link>.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
