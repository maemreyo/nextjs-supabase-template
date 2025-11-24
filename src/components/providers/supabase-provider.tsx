'use client'

import React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type SupabaseContext = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  console.log('🔍 [DEBUG] SupabaseProvider - Component rendering')

  useEffect(() => {
    console.log('🔍 [DEBUG] SupabaseProvider - useEffect started')
    // Get initial session
    const getSession = async () => {
      console.log('🔍 [DEBUG] SupabaseProvider - Getting session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 [DEBUG] SupabaseProvider - Initial session:', !!session);
      console.log('🔍 [DEBUG] SupabaseProvider - Initial user:', !!session?.user);
      console.log('🔍 [DEBUG] SupabaseProvider - Initial access token:', !!session?.access_token);
      
      setUser(session?.user ?? null)
      setLoading(false)
      console.log('🔍 [DEBUG] SupabaseProvider - Session loading completed')
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔍 [DEBUG] SupabaseProvider - Auth state change:', _event);
      console.log('🔍 [DEBUG] SupabaseProvider - Session after change:', !!session);
      console.log('🔍 [DEBUG] SupabaseProvider - User after change:', !!session?.user);
      console.log('🔍 [DEBUG] SupabaseProvider - Access token after change:', !!session?.access_token);
      
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // Remove supabase.auth from dependency array

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 [DEBUG] SupabaseProvider - getAccessToken - Session exists:', !!session);
      console.log('🔍 [DEBUG] SupabaseProvider - getAccessToken - Access token exists:', !!session?.access_token);
      console.log('🔍 [DEBUG] SupabaseProvider - getAccessToken - User exists:', !!session?.user);
      
      if (!session?.access_token) {
        console.warn('🔍 [DEBUG] SupabaseProvider - getAccessToken - No access token in session');
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error('🔍 [DEBUG] SupabaseProvider - getAccessToken - Refresh failed:', refreshError);
          return null
        }
        console.log('🔍 [DEBUG] SupabaseProvider - getAccessToken - Refresh successful, new token exists:', !!refreshData.session?.access_token);
        return refreshData.session?.access_token || null
      }
      
      return session.access_token
    } catch (error) {
      console.error('🔍 [DEBUG] SupabaseProvider - getAccessToken - Error:', error);
      return null
    }
  }

  const value = {
    user,
    loading,
    signOut,
    getAccessToken,
  }

  console.log('🔍 [DEBUG] SupabaseProvider - Rendering provider with user:', !!user, 'loading:', loading)
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}