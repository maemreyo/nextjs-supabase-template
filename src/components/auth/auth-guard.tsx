'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/stores/use-auth-store'
import { Loader2Icon } from 'lucide-react'
import { authLogger } from '@/services/logger'

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
  authLogger.debug('AuthGuard rendering')
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuth()

  useEffect(() => {
    // Skip check while loading or not initialized
    if (isLoading || !isInitialized) {
      return
    }

    // If authentication is not required, allow access
    if (!requireAuth) {
      return
    }

    // If user is not authenticated and auth is required, redirect
    if (!user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, isInitialized, requireAuth, redirectTo])

  // Show loading state while checking authentication or waiting for initialization
  if (isLoading || !isInitialized) {
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
    return null
  }

  // If all checks pass, render children
  return <>{children}</>
}