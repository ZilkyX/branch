import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { isAllowedEmail } from '@/lib/allowed-emails'

const isProtectedRoute = createRouteMatcher(['/app(.*)'])
const isAuthRoute = createRouteMatcher(['/login(.*)', '/signup(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const { pathname } = req.nextUrl
  const isAllowed = userId !== null && isAllowedEmail(sessionClaims?.email)
  const home = isAllowed ? '/app/dashboard' : '/not-invited'
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, req.url))

  // Send people to the right place in one hop, before any page renders.
  if (pathname === '/') return redirectTo(userId ? home : '/login')
  if (userId && isAuthRoute(req)) return redirectTo(home)

  if (pathname === '/not-invited') {
    if (!userId) return redirectTo('/login')
    if (isAllowed) return redirectTo(home)
    return
  }

  if (userId && !isAllowed && isProtectedRoute(req)) return redirectTo('/not-invited')
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}