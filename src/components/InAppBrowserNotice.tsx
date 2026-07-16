'use client'

import { useEffect, useState } from 'react'

// Named in-app browsers (WebViews) that isolate cookies and routinely break the
// convex.site <-> app-domain OAuth cookie handoff, so "Sign in with Google"
// silently fails and dumps the user back on the homepage. We only match KNOWN
// apps to avoid nagging real Safari/Chrome users (no unreliable generic sniffing).
const IN_APP_PATTERNS: { re: RegExp; name: string }[] = [
  { re: /WhatsApp/i, name: 'WhatsApp' },
  { re: /Instagram/i, name: 'Instagram' },
  { re: /FBAN|FBAV|FB_IAB|Messenger/i, name: 'Facebook' },
  { re: /Twitter/i, name: 'X (Twitter)' },
  { re: /LinkedInApp/i, name: 'LinkedIn' },
  { re: /Snapchat/i, name: 'Snapchat' },
  { re: /TikTok|BytedanceWebview|musical_ly/i, name: 'TikTok' },
  { re: /\bLine\//i, name: 'LINE' },
  { re: /Pinterest/i, name: 'Pinterest' },
]

function detectInAppBrowser(): string | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent || ''
  for (const { re, name } of IN_APP_PATTERNS) {
    if (re.test(ua)) return name
  }
  return null
}

// Shows a warning when the page is open inside a social app's in-app browser,
// telling the user to open the real Safari/Chrome to sign in. Renders nothing
// in normal browsers.
export function InAppBrowserNotice() {
  // Start null so server render and first client render match (no hydration
  // mismatch); fill in after mount when navigator is available.
  const [appName, setAppName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setAppName(detectInAppBrowser())
  }, [])

  if (!appName) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">⚠️</span>
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-1">Open in your normal browser to sign in</p>
          <p className="mb-3">
            You’re viewing this inside {appName}. “Sign in with Google” often won’t
            work in an app’s built-in browser. Tap the <strong>⋯</strong> (or
            share) menu at the top and choose <strong>“Open in Safari”</strong> or{' '}
            <strong>“Open in Chrome”</strong>, then sign in there.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 transition-colors"
          >
            {copied ? '✓ Link copied' : 'Copy site link'}
          </button>
        </div>
      </div>
    </div>
  )
}
