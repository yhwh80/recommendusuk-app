'use client'

import Link from 'next/link'
import { useState, ReactNode } from 'react'

export type NavLink = {
  href: string
  label: string
  badge?: number
  primary?: boolean
}

// Shared responsive header: logo + optional page label, a desktop nav, and a
// hamburger menu on mobile so the nav never squashes. Pass the links the page
// needs; `rightExtra` is for non-link bits (e.g. a credits chip).
export function SiteHeader({
  label,
  links = [],
  rightExtra,
}: {
  label?: string
  links?: NavLink[]
  rightExtra?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const anyBadge = links.some((l) => !!l.badge && l.badge > 0)

  return (
    <header className="bg-white shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 min-w-0">
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
            </Link>
            {label && (
              <>
                <span className="hidden sm:inline text-gray-400">|</span>
                <span className="hidden sm:inline font-medium text-gray-600 whitespace-nowrap">
                  {label}
                </span>
              </>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className={
                  l.primary
                    ? 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap'
                    : 'relative text-gray-600 hover:text-green-600 font-medium whitespace-nowrap'
                }
              >
                {l.label}
                {!!l.badge && l.badge > 0 && (
                  <span className="absolute -top-2 -right-3 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
            {rightExtra}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden relative p-2 text-gray-700"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
            {!open && anyBadge && (
              <span className="absolute top-1 right-1 bg-green-500 w-2.5 h-2.5 rounded-full" />
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col space-y-1">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="px-2 py-2 rounded hover:bg-green-50 text-gray-700 font-medium"
              >
                {l.label}
                {!!l.badge && l.badge > 0 && (
                  <span className="ml-1 bg-green-500 text-white text-xs font-semibold rounded-full px-1.5">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
            {rightExtra && <div className="px-2 py-2">{rightExtra}</div>}
          </div>
        )}
      </div>
    </header>
  )
}
