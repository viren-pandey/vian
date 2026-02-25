import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Studio guard ─────────────────────────────────────────────────────────
  // Admin auth is handled client-side (inline login form on /admin)
  if (pathname.startsWith('/studio')) {
    const token = req.cookies.get('vian_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*'],
}
