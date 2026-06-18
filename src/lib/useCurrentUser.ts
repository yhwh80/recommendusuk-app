'use client'

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

// The signed-in user's profile (users.getMe), or:
//   undefined → still loading,  null → not signed in.
export function useCurrentUser() {
  return useQuery(api.users.getMe)
}
