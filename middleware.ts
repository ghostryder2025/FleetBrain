import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/loads') ||
    pathname.startsWith('/fleet')

  const isAuthPage = pathname === '/login' || pathname === '/register'

  // Check for Supabase auth cookie (set by @supabase/ssr)
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  if (!hasAuthCookie && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasAuthCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
