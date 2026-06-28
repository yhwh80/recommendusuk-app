'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Green landing page — ported from the static-marketplace "latest" design.
export default function Home() {
  // Staggered fade/slide/blur-in on load (replaces the original inline script).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-animate]'))
    const timers = els.map((el, i) =>
      setTimeout(() => el.classList.add('visible'), 350 + i * 180),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="animated-bg text-gray-900">
      {/* Floating Service Category Images */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/digital-tech.png" alt="Digital Tech Services" className="service-image digital-tech" data-animate />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/professional.png" alt="Professional Services" className="service-image professional" data-animate />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/construction.png" alt="Construction & Trade" className="service-image construction" data-animate />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home-services.png" alt="Home Services" className="service-image home-services" data-animate />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 shadow-inner rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg tracking-tight">R</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 tracking-tight">RecommendUsUK</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth" className="text-gray-600 hover:text-green-500 font-medium transition-colors duration-150">Sign in</Link>
              <Link href="/auth?signup=true" className="bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors duration-150 shadow-sm font-medium">Join now</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Subtle moving blobs with blur for depth */}
          <svg className="absolute top-[-60px] right-[-80px] animate-pulse" width="320" height="320" fill="none" style={{ filter: 'blur(64px)', opacity: 0.37 }}>
            <ellipse cx="160" cy="160" rx="160" ry="160" fill="#8fffbc" />
          </svg>
          <svg className="absolute bottom-[-60px] left-[-100px] animate-pulse delay-300" width="280" height="280" fill="none" style={{ filter: 'blur(60px)', opacity: 0.28 }}>
            <ellipse cx="140" cy="140" rx="140" ry="140" fill="#b5ffe3" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-6" data-animate>
              Find &amp; Hire{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-500 animate-gradient">
                Recommended
              </span>{' '}
              Professionals
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-normal" data-animate>
              Connect with top-rated freelancers and professionals in the UK. Our unique recommendation system ensures you find the perfect match for your project.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4" data-animate>
              <Link href="/auth?type=client" className="bg-green-400 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors duration-150 shadow-sm focus:outline-none">
                Hire Professionals
              </Link>
              <Link href="/auth?type=freelancer" className="border-2 border-green-400 text-green-500 px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-50 transition-colors duration-150 focus:outline-none">
                Find Work
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/70 backdrop-blur-md" data-animate>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-4">Why Choose RecommendUsUK?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-normal">Our platform connects you with verified professionals who have been recommended by previous clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-green-100 rounded-2xl bg-white/80 hover:border-green-300 transition-all duration-200" data-animate>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Verified Professionals</h3>
              <p className="text-gray-600 font-normal">All freelancers are verified and rated by previous clients.</p>
            </div>

            <div className="text-center p-6 border border-green-100 rounded-2xl bg-white/80 hover:border-green-300 transition-all duration-200" data-animate>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="8" width="18" height="10" rx="2" strokeWidth="2" />
                  <path d="M7 8V6a5 5 0 0110 0v2" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Secure Payments</h3>
              <p className="text-gray-600 font-normal">Pay safely with our integrated Stripe payment system.</p>
            </div>

            <div className="text-center p-6 border border-green-100 rounded-2xl bg-white/80 hover:border-green-300 transition-all duration-200" data-animate>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path d="M15 12l-3 3m0 0l-3-3m3 3V8" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Perfect Matches</h3>
              <p className="text-gray-600 font-normal">Our recommendation algorithm finds the best fit for your project.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-400 via-green-300 to-green-400 py-16" data-animate>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-green-100 mb-8 font-normal">Join thousands of satisfied clients and freelancers.</p>
          <Link href="/auth?signup=true" className="bg-white text-green-500 px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-50 transition-colors duration-150 shadow-sm focus:outline-none">
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-animate>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold">R</span>
                </div>
                <span className="text-lg font-semibold tracking-tight">RecommendUsUK</span>
              </div>
              <p className="text-gray-400">The UK&apos;s trusted freelance marketplace</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/post-job" className="hover:text-green-300 transition-colors">Post a Job</Link></li>
                <li><Link href="/jobs" className="hover:text-green-300 transition-colors">Browse Freelancers</Link></li>
                <li><Link href="/auth?signup=true" className="hover:text-green-300 transition-colors">How it Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Freelancers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-green-300 transition-colors">Find Jobs</Link></li>
                <li><Link href="/auth?type=freelancer" className="hover:text-green-300 transition-colors">Build Profile</Link></li>
                <li><Link href="/jobs" className="hover:text-green-300 transition-colors">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/" className="hover:text-green-300 transition-colors">Help Center</Link></li>
                <li><Link href="/" className="hover:text-green-300 transition-colors">Contact Us</Link></li>
                <li><Link href="/" className="hover:text-green-300 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 RecommendUsUK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
