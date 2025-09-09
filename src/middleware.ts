import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login and register pages
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      // If already logged in as admin, redirect to admin dashboard
      if (token?.isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // For all other admin routes, check if user is admin
    if (!token) {
      // Not logged in, redirect to admin login
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (!token.isAdmin) {
      // Logged in but not an admin, redirect to regular dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Regular dashboard protection
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user account is active
    if (token.isActive === false) {
      return NextResponse.redirect(new URL('/account-disabled', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}