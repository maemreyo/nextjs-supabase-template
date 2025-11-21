import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url)
  const response = NextResponse.next()

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return response
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/analysis', '/dashboard']
  
  // Public routes that should redirect authenticated users to analysis
  const publicAuthRoutes = ['/auth/signin', '/auth/signup', '/auth/forgot-password']
  
  // Create Supabase client and get user session
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session?.user

  // Check if user is trying to access protected route without auth
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !isAuthenticated) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Check if authenticated user is trying to access auth routes
  if (publicAuthRoutes.some(route => pathname === route) && isAuthenticated) {
    return NextResponse.redirect(new URL('/analysis', request.url))
  }

  // If authenticated user accesses home page, redirect to analysis
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/analysis', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/((?!api|trpc).*)',
  ],
}