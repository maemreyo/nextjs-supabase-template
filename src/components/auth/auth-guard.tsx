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
  const { user, isLoading, isInitialized } = useAuthStore()

  console.log('🔍 [DEBUG] AuthGuard - Component state:', {
    user: !!user,
    userId: user?.id,
    isLoading,
    isInitialized,
    requireAuth,
    redirectTo
  })

  useEffect(() => {
    console.log('🔍 [DEBUG] AuthGuard - useEffect triggered:', {
      isLoading,
      isInitialized,
      hasUser: !!user,
      requireAuth
    })
    
    // Skip check while loading or not initialized
    if (isLoading || !isInitialized) {
      console.log('🔍 [DEBUG] AuthGuard - Still loading or not initialized, skipping check')
      return
    }

    // If authentication is not required, allow access
    if (!requireAuth) return

    // If user is not authenticated and auth is required, redirect
    if (!user) {
      console.log('🔍 [DEBUG] AuthGuard - Redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [user, isLoading, isInitialized, requireAuth, redirectTo])

  // Show loading state while checking authentication or waiting for initialization
  if (isLoading || !isInitialized) {
    console.log('🔍 [DEBUG] AuthGuard - Showing loading state', { isLoading, isInitialized })
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-gray-600">
            {!isInitialized ? 'Đang khởi tạo xác thực...' : 'Đang kiểm tra xác thực...'}
          </p>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated, show nothing (will redirect)
  if (requireAuth && !user) {
    console.log('🔍 [DEBUG] AuthGuard - No user, returning null')
    return null
  }

  console.log('🔍 [DEBUG] AuthGuard - Rendering children')
  // If all checks pass, render children
  return <>{children}</>
}