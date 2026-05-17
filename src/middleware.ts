import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const PUBLIC_PAGE_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/invite',
]
const PUBLIC_API_PATHS  = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/invite',
  '/api/auth/extension-login',
  '/api/docs',
  '/api/openapi.json',
  '/api/invitations',
  '/api/cron/', // Cron jobs are protected by CRON_SECRET, not JWT
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // Allow public API routes (including /auth/me — it returns 401 itself if no token)
  if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow public pages
  if (PUBLIC_PAGE_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check JWT cookie
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}