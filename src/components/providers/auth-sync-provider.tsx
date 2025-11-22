'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useSupabase } from './supabase-provider'

interface AuthSyncProviderProps {
  children: React.ReactNode
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { user, loading: supabaseLoading } = useSupabase()
  const { 
    setUser, 
    setSession, 
    setInitialized, 
    isAuthenticated, 
    isInitialized,
    user: authStoreUser
  } = useAuthStore()

  useEffect(() => {
    console.log('🔍 [DEBUG] AuthSyncProvider - Effect triggered:', {
      supabaseUser: !!user,
      supabaseLoading,
      authStoreUser: !!authStoreUser,
      isAuthenticated,
      isInitialized
    })

    // Skip if Supabase is still loading
    if (supabaseLoading) {
      console.log('🔍 [DEBUG] AuthSyncProvider - Supabase still loading, skipping sync')
      return
    }

    // If Supabase has user but AuthStore doesn't, sync them
    if (user && !authStoreUser) {
      console.log('🔍 [DEBUG] AuthSyncProvider - Syncing user from Supabase to AuthStore:', user.email)
      setUser(user)
      setSession({
        user,
        access_token: null, // Will be set by getAccessToken if needed
        refresh_token: null
      })
    }

    // If Supabase has no user but AuthStore still has user, clear AuthStore
    if (!user && authStoreUser) {
      console.log('🔍 [DEBUG] AuthSyncProvider - Clearing AuthStore user (Supabase has no user)')
      setUser(null)
      setSession(null)
    }

    // Mark AuthStore as initialized after sync
    if (!isInitialized) {
      console.log('🔍 [DEBUG] AuthSyncProvider - Marking AuthStore as initialized')
      setInitialized(true)
    }
  }, [user, supabaseLoading, authStoreUser, isAuthenticated, isInitialized, setUser, setSession, setInitialized])

  // Listen for auth state changes from Supabase and sync to AuthStore
  useEffect(() => {
    console.log('🔍 [DEBUG] AuthSyncProvider - Auth state sync effect:', {
      supabaseUser: !!user,
      authStoreUser: !!authStoreUser,
      needsSync: !!user !== !!authStoreUser
    })

    if (!!user !== !!authStoreUser) {
      console.log('🔍 [DEBUG] AuthSyncProvider - Auth state mismatch detected, syncing...')
      if (user) {
        setUser(user)
        setSession({
          user,
          access_token: null,
          refresh_token: null
        })
      } else {
        setUser(null)
        setSession(null)
      }
    }
  }, [user, authStoreUser, setUser, setSession])

  return <>{children}</>
}