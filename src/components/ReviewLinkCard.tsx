'use client'

import { useEffect, useState } from 'react'
import { Id } from '../../convex/_generated/dataModel'

// A worker's personal "review me" link, to send to customers they've worked
// for outside the site. Each review brings a local customer onto the site.
export function ReviewLinkCard({ userId, name }: { userId: Id<'users'>; name?: string | null }) {
  const [copied, setCopied] = useState(false)
  // Read after mount so the server-rendered HTML matches the first client render.
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const url = `${origin}/review/${userId}`
  const message = `Hi, it's ${name || 'me'}. If you were happy with the work I did for you, would you mind leaving me a quick review? ${url}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Get reviews from past customers</h2>
      <p className="text-sm text-gray-600 mb-4">
        Send this link to people you&apos;ve already worked for. Reviews help you win more work here.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700"
          aria-label="Your review link"
        />
        <button
          type="button"
          onClick={copy}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm font-medium border border-green-600 text-green-700 hover:bg-green-50 text-center"
        >
          Send on WhatsApp
        </a>
      </div>
    </div>
  )
}
