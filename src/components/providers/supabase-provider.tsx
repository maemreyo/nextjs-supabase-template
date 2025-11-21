'use client'

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

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('DEBUG: SupabaseProvider - Initial session:', !!session);
      console.log('DEBUG: SupabaseProvider - Initial user:', !!session?.user);
      console.log('DEBUG: SupabaseProvider - Initial access token:', !!session?.access_token);
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('DEBUG: SupabaseProvider - Auth state change:', _event);
      console.log('DEBUG: SupabaseProvider - Session after change:', !!session);
      console.log('DEBUG: SupabaseProvider - User after change:', !!session?.user);
      console.log('DEBUG: SupabaseProvider - Access token after change:', !!session?.access_token);
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('DEBUG: SupabaseProvider - getAccessToken - Session exists:', !!session);
      console.log('DEBUG: SupabaseProvider - getAccessToken - Access token exists:', !!session?.access_token);
      return session?.access_token || null
    } catch (error) {
      console.error('DEBUG: SupabaseProvider - getAccessToken - Error:', error);
      return null
    }
  }

  const value = {
    user,
    loading,
    signOut,
    getAccessToken,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}