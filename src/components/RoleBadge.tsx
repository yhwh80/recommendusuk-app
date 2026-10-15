'use client'

import { useCurrentUser } from '@/lib/useCurrentUser'

// Shows which kind of account is signed in. The role is fixed at sign-up and
// changes what the whole site offers (hirers post jobs, workers buy credits
// and quote), so it should never be a guess.
export function RoleBadge() {
  const user = useCurrentUser()
  if (!user?.role) return null
  const hiring = user.role === 'client'
  return (
    <span
      className={`shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${
        hiring ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      }`}
    >
      {hiring ? 'Hirer account' : 'Worker account'}
    </span>
  )
}
