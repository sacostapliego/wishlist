import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = new Set([
  '/',
  '/wishlists/friends',
  '/wishlists/mine',
  '/items/claimed',
  '/friends',
  '/settings',
])

function isAuthRoute(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value

  if (protectedPaths.has(pathname) && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuthRoute(pathname)) {
    if (pathname === '/auth' && token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (pathname === '/auth' && !token) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.png|.*\\..*).*)'],
}
