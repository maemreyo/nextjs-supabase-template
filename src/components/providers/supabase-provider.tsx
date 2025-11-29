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


  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      
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
      
      if (!session?.access_token) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          return null
        }
        return refreshData.session?.access_token || null
      }
      
      return session.access_token
    } catch (error) {
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