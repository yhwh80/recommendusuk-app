import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'

// Manages Convex Auth session cookies across requests.
export default convexAuthNextjsMiddleware()

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
