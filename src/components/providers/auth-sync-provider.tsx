'use client'

import React from 'react'
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
    // Skip if Supabase is still loading
    if (supabaseLoading) {
      return
    }

    // If Supabase has user but AuthStore doesn't, sync them
    if (user && !authStoreUser) {
      setUser(user)
      setSession({
        user,
        access_token: null, // Will be set by getAccessToken if needed
        refresh_token: null
      })
    }

    // If Supabase has no user but AuthStore still has user, clear AuthStore
    if (!user && authStoreUser) {
      setUser(null)
      setSession(null)
    }

    // Mark AuthStore as initialized after sync
    if (!isInitialized) {
      setInitialized(true)
    }
  }, [user, supabaseLoading, authStoreUser, isAuthenticated, isInitialized, setUser, setSession, setInitialized])

  // Listen for auth state changes from Supabase and sync to AuthStore
  useEffect(() => {

    if (!!user !== !!authStoreUser) {
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