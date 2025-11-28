'use client'

import React from 'react'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth_store'
import { useSupabase } from './supabase-provider'

interface AuthSyncProviderProps {
  children: React.ReactNode
}

export function AuthSyncProvider({ children }: AuthSyncProviderProps) {
  const { user, loading: supabaseLoading } = useSupabase()
  
  // Use direct store access to avoid function recreation issues
  const setUser = useAuthStore(state => state.setUser)
  const setSession = useAuthStore(state => state.setSession)
  const setInitialized = useAuthStore(state => state.setInitialized)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const authStoreUser = useAuthStore(state => state.user)

  useEffect(() => {
    console.log('🔄 AUTH SYNC: Main effect triggered', {
      user: !!user,
      supabaseLoading,
      authStoreUser: !!authStoreUser,
      isAuthenticated,
      isInitialized
    })
    
    // Skip if Supabase is still loading
    if (supabaseLoading) {
      console.log('⏸️ AUTH SYNC: Skipping - Supabase still loading')
      return
    }

    // If Supabase has user but AuthStore doesn't, sync them
    if (user && !authStoreUser) {
      console.log('✅ AUTH SYNC: Syncing user from Supabase to AuthStore', user.email || '')
      setUser(user)
      setSession({
        user,
        access_token: '',
        refresh_token: '',
        expires_in: 0,
        token_type: 'bearer'
      })
    }

    // If Supabase has no user but AuthStore still has user, clear AuthStore
    if (!user && authStoreUser) {
      console.log('✅ AUTH SYNC: Clearing user from AuthStore')
      setUser(null)
      setSession(null)
    }

    // Mark AuthStore as initialized after sync
    if (!isInitialized) {
      console.log('✅ AUTH SYNC: Marking AuthStore as initialized')
      setInitialized(true)
    }
  }, [user, supabaseLoading, authStoreUser, isAuthenticated, isInitialized]) // Removed store functions from deps

  // Listen for auth state changes from Supabase and sync to AuthStore
  useEffect(() => {
    console.log('🔄 AUTH SYNC: Secondary effect triggered', {
      user: !!user,
      authStoreUser: !!authStoreUser
    })

    if (!!user !== !!authStoreUser) {
      const authStore = useAuthStore.getState()
      if (user) {
        console.log('✅ AUTH SYNC: Secondary - Setting user', user.email || '')
        authStore.setUser(user)
        authStore.setSession({
          user,
          access_token: '',
          refresh_token: '',
          expires_in: 0,
          token_type: 'bearer'
        })
      } else {
        console.log('✅ AUTH SYNC: Secondary - Clearing user')
        authStore.setUser(null)
        authStore.setSession(null)
      }
    }
  }, [user, authStoreUser]) // Removed store functions from deps

  return <>{children}</>
}