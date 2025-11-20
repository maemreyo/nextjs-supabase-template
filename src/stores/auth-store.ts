import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, Profile } from '@/types/database'
import { createStore, storeUtils, type LoadingState } from '@/lib/store'

// Auth state interface
export interface AuthState extends LoadingState {
  // User data
  user: SupabaseUser | null
  profile: Profile | null
  
  // Auth state
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  
  // Session data
  session: any | null
  accessToken: string | null
  refreshToken: string | null
  
  // Metadata
  lastSignInAt: string | null
  emailVerified: boolean
}

// Auth actions interface
export interface AuthActions {
  // User actions
  setUser: (user: SupabaseUser | null) => void
  setProfile: (profile: Profile | null) => void
  updateUserProfile: (updates: Partial<Profile>) => void
  
  // Session actions
  setSession: (session: any) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  
  // Auth state actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setInitialized: (initialized: boolean) => void
  
  // Auth flow actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  
  // Profile actions
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  
  // Utility actions
  refreshSession: () => Promise<void>
  clearAuth: () => void
}

// Combined auth store type
export type AuthStore = AuthState & AuthActions

// Initial state
const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  session: null,
  accessToken: null,
  refreshToken: null,
  lastSignInAt: null,
  emailVerified: false,
  loading: false,
  error: null,
}

// Auth store implementation
export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          // User actions
          setUser: (user) => {
            set(
              {
                user,
                isAuthenticated: !!user,
                lastSignInAt: user?.user_metadata?.last_sign_in_at || null,
                emailVerified: !!user?.email_confirmed_at,
              },
              false,
              'setUser'
            )
          },

          setProfile: (profile) => {
            set({ profile }, false, 'setProfile')
          },

          updateUserProfile: (updates) => {
            const { profile } = get()
            if (profile) {
              set(
                {
                  profile: { ...profile, ...updates, updated_at: new Date().toISOString() },
                },
                false,
                'updateUserProfile'
              )
            }
          },

          // Session actions
          setSession: (session) => {
            set(
              {
                session,
                user: session?.user || null,
                accessToken: session?.access_token || null,
                refreshToken: session?.refresh_token || null,
                isAuthenticated: !!session?.user,
              },
              false,
              'setSession'
            )
          },

          setTokens: (accessToken, refreshToken) => {
            set({ accessToken, refreshToken }, false, 'setTokens')
          },

          // Auth state actions
          setLoading: (loading) => {
            set(storeUtils.setLoading(loading), false, 'setLoading')
          },

          setError: (error) => {
            set(storeUtils.setError(error), false, 'setError')
          },

          clearError: () => {
            set({ error: null }, false, 'clearError')
          },

          setInitialized: (isInitialized) => {
            set({ isInitialized }, false, 'setInitialized')
          },

          // Auth flow actions
          signIn: async (email, password) => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              // Import dynamically to avoid SSR issues
              const { supabase } = await import('@/lib/supabase/client')
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              })
              
              if (error) throw error
              
              // Session will be updated by the auth listener
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to sign in')
              throw error
            } finally {
              setLoading(false)
            }
          },

          signUp: async (email, password, metadata = {}) => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    ...metadata,
                    last_sign_in_at: new Date().toISOString(),
                  },
                },
              })
              
              if (error) throw error
              
              // Session will be updated by the auth listener
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to sign up')
              throw error
            } finally {
              setLoading(false)
            }
          },

          signOut: async () => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { error } = await supabase.auth.signOut()
              
              if (error) throw error
              
              // Clear auth state
              get().clearAuth()
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to sign out')
              throw error
            } finally {
              setLoading(false)
            }
          },

          resetPassword: async (email) => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { error } = await supabase.auth.resetPasswordForEmail(email)
              
              if (error) throw error
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to reset password')
              throw error
            } finally {
              setLoading(false)
            }
          },

          updatePassword: async (password) => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { error } = await supabase.auth.updateUser({ password })
              
              if (error) throw error
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to update password')
              throw error
            } finally {
              setLoading(false)
            }
          },

          // Profile actions
          fetchProfile: async () => {
            const { user, setError, setLoading } = get()
            
            if (!user) return
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()
              
              if (error && error.code !== 'PGRST116') { // Not found error
                throw error
              }
              
              get().setProfile(data)
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to fetch profile')
              throw error
            } finally {
              setLoading(false)
            }
          },

          updateProfile: async (updates) => {
            const { user, setError, setLoading } = get()
            
            if (!user) throw new Error('User not authenticated')
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { data, error } = await supabase
                .from('profiles')
                .upsert({
                  user_id: user.id,
                  ...updates,
                  updated_at: new Date().toISOString(),
                })
                .select()
                .single()
              
              if (error) throw error
              
              get().setProfile(data)
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to update profile')
              throw error
            } finally {
              setLoading(false)
            }
          },

          uploadAvatar: async (file) => {
            const { user, setError, setLoading } = get()
            
            if (!user) throw new Error('User not authenticated')
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              
              // Upload file
              const fileExt = file.name.split('.').pop()
              const fileName = `${user.id}-${Date.now()}.${fileExt}`
              const filePath = `avatars/${fileName}`
              
              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)
              
              if (uploadError) throw uploadError
              
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)
              
              // Update profile
              await get().updateProfile({ avatar_url: publicUrl })
              
              return publicUrl
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to upload avatar')
              throw error
            } finally {
              setLoading(false)
            }
          },

          // Utility actions
          refreshSession: async () => {
            const { setError, setLoading } = get()
            
            try {
              setLoading(true)
              setError(null)
              
              const { supabase } = await import('@/lib/supabase/client')
              const { data, error } = await supabase.auth.refreshSession()
              
              if (error) throw error
              
              get().setSession(data.session)
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to refresh session')
              throw error
            } finally {
              setLoading(false)
            }
          },

          clearAuth: () => {
            set(
              {
                user: null,
                profile: null,
                session: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                lastSignInAt: null,
                emailVerified: false,
                error: null,
                loading: false,
              },
              false,
              'clearAuth'
            )
          },
        }),
        {
          name: 'auth-storage',
          partialize: (state) => ({
            // Only persist essential auth data
            user: state.user,
            profile: state.profile,
            isAuthenticated: state.isAuthenticated,
            lastSignInAt: state.lastSignInAt,
            emailVerified: state.emailVerified,
          }),
          version: 1,
          migrate: (persistedState: any, version: number) => {
            // Handle migrations here if needed
            if (version === 0) {
              // Migration from version 0 to 1
              return {
                ...persistedState,
                emailVerified: false,
              }
            }
            return persistedState
          },
        }
      ),
      {
        name: 'auth-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)

// Selectors
export const authSelectors = {
  // User selectors
  user: (state: AuthStore) => state.user,
  profile: (state: AuthStore) => state.profile,
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  
  // State selectors
  isLoading: (state: AuthStore) => state.isLoading,
  isInitialized: (state: AuthStore) => state.isInitialized,
  error: (state: AuthStore) => state.error,
  
  // Derived selectors
  userDisplayName: (state: AuthStore) => {
    const { user, profile } = state
    return profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Unknown User'
  },
  userAvatar: (state: AuthStore) => {
    const { user, profile } = state
    return profile?.avatar_url || user?.user_metadata?.avatar_url || null
  },
  userEmail: (state: AuthStore) => state.user?.email || null,
  userId: (state: AuthStore) => state.user?.id || null,
  
  // Permission selectors
  canEditProfile: (state: AuthStore) => !!state.user,
  isEmailVerified: (state: AuthStore) => state.emailVerified,
}