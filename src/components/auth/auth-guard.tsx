'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2Icon } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export default function AuthGuard({ 
  children, 
  redirectTo = '/auth/signin',
  requireAuth = true 
}: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    // Skip check while loading
    if (isLoading) return

    // If authentication is not required, allow access
    if (!requireAuth) return

    // If user is not authenticated and auth is required, redirect
    if (!user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, requireAuth, redirectTo])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-gray-600">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, show nothing (will redirect)
  if (requireAuth && !user) {
    return null
  }

  // If all checks pass, render children
  return <>{children}</>
}