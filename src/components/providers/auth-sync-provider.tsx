'use client'

import React, { useEffect, useRef } from 'react'
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

  // Use refs to stabilize function references
  const setUserRef = useRef(setUser)
  const setSessionRef = useRef(setSession)
  const setInitializedRef = useRef(setInitialized)

  // Update refs when functions change
  useEffect(() => {
    setUserRef.current = setUser
    setSessionRef.current = setSession
    setInitializedRef.current = setInitialized
  }, [setUser, setSession, setInitialized])

  useEffect(() => {
    // Skip if Supabase is still loading
    if (supabaseLoading) {
      return
    }

    // If Supabase has user but AuthStore doesn't, sync them
    if (user && !authStoreUser) {
      setUserRef.current(user)
      setSessionRef.current({
        user,
        access_token: '',
        refresh_token: '',
        expires_in: 0,
        token_type: 'bearer'
      })
    }

    // If Supabase has no user but AuthStore still has user, clear AuthStore
    if (!user && authStoreUser) {
      setUserRef.current(null)
      setSessionRef.current(null)
    }

    // Mark AuthStore as initialized after sync
    if (!isInitialized) {
      setInitializedRef.current(true)
    }
  }, [user, supabaseLoading, authStoreUser, isAuthenticated, isInitialized]) // Removed store functions from deps

  // Listen for auth state changes from Supabase and sync to AuthStore
  useEffect(() => {
    // STRONGER GUARD: Only sync if there's an actual mismatch AND main effect hasn't handled it
    const hasRealMismatch = !!user !== !!authStoreUser
    const alreadySynced = user?.id === authStoreUser?.id
    
    if (hasRealMismatch && !alreadySynced) {
      if (user) {
        setUserRef.current(user)
        setSessionRef.current({
          user,
          access_token: '',
          refresh_token: '',
          expires_in: 0,
          token_type: 'bearer'
        })
      } else {
        setUserRef.current(null)
        setSessionRef.current(null)
      }
    }
  }, [user, authStoreUser]) // Removed store functions from deps

  return <>{children}</>
}