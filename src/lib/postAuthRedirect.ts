// Where to send someone once they finish signing in or up, for flows that
// start outside the auth page (e.g. a worker's "review me" link). Kept in
// sessionStorage so it survives the Google sign-in round trip in the same tab.
const KEY = 'postAuthRedirect'

export function setPostAuthRedirect(path: string) {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {}
}

export function takePostAuthRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    // Only ever an on-site path.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null
  } catch {
    return null
  }
}
