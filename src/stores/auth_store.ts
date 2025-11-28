import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

// Auth state interface
export interface AuthState {
  // User data
  user: User | null
  profile: any | null
  isAuthenticated: boolean
  
  // User info
  userDisplayName: string | null
  userAvatar: string | null
  userEmail: string | null
  userId: string | null
  
  // Auth state
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  
  // Permissions
  canEditProfile: boolean
  isEmailVerified: boolean
}

// Auth actions interface
export interface AuthActions {
  // User data setters
  setUser: (user: User | null) => void
  setProfile: (profile: any | null) => void
  updateUserProfile: (updates: Partial<any>) => void
  setSession: (session: Session | null) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  
  // State setters
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setInitialized: (initialized: boolean) => void
  
  // Auth flow
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  
  // Profile
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<any>) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  
  // Utility
  refreshSession: () => Promise<void>
  clearAuth: () => void
}

// Auth store type
export type AuthStore = AuthState & AuthActions

// Initial state
const initialState: AuthState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  userDisplayName: null,
  userAvatar: null,
  userEmail: null,
  userId: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  canEditProfile: false,
  isEmailVerified: false,
}

// Auth selectors
export const authSelectors = {
  user: (state: AuthStore) => state.user,
  profile: (state: AuthStore) => state.profile,
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  userDisplayName: (state: AuthStore) => state.userDisplayName,
  userAvatar: (state: AuthStore) => state.userAvatar,
  userEmail: (state: AuthStore) => state.userEmail,
  userId: (state: AuthStore) => state.userId,
  isLoading: (state: AuthStore) => state.isLoading,
  isInitialized: (state: AuthStore) => state.isInitialized,
  error: (state: AuthStore) => state.error,
  canEditProfile: (state: AuthStore) => state.canEditProfile,
  isEmailVerified: (state: AuthStore) => state.isEmailVerified,
}

// Create auth store
export const useAuthStore = create<AuthStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // User data setters
      setUser: (user) => {
        set(
          {
            user,
            isAuthenticated: !!user,
            userId: user?.id || null,
            userEmail: user?.email || null,
            userDisplayName: user?.user_metadata?.display_name || user?.email || null,
            userAvatar: user?.user_metadata?.avatar_url || null,
            isEmailVerified: !!user?.email_confirmed_at,
          },
          false,
          'setUser'
        )
      },
      
      setProfile: (profile) => set({ profile }, false, 'setProfile'),
      
      updateUserProfile: (updates) => {
        const currentProfile = get().profile
        const newProfile = currentProfile ? { ...currentProfile, ...updates } : updates
        set({ profile: newProfile }, false, 'updateUserProfile')
      },
      
      setSession: (session) => {
        set(
          {
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            userId: session?.user?.id || null,
            userEmail: session?.user?.email || null,
            userDisplayName: session?.user?.user_metadata?.display_name || session?.user?.email || null,
            userAvatar: session?.user?.user_metadata?.avatar_url || null,
            isEmailVerified: !!session?.user?.email_confirmed_at,
          },
          false,
          'setSession'
        )
      },
      
      setTokens: (accessToken, refreshToken) => {
        // Store tokens if needed (usually handled by Supabase client)
        console.log('Tokens set:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
      },
      
      // State setters
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),
      setInitialized: (isInitialized) => set({ isInitialized }, false, 'setInitialized'),
      
      // Auth flow (placeholder implementations - would integrate with Supabase)
      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          // Placeholder implementation
          console.log('Sign in:', { email })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      signUp: async (email, password, metadata) => {
        set({ isLoading: true, error: null })
        try {
          // Placeholder implementation
          console.log('Sign up:', { email, metadata })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      signOut: async () => {
        set({ isLoading: true })
        try {
          // Placeholder implementation
          console.log('Sign out')
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            userDisplayName: null,
            userAvatar: null,
            userEmail: null,
            userId: null,
            isEmailVerified: false,
            canEditProfile: false,
          })
        } catch (error) {
          console.error('Sign out error:', error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      resetPassword: async (email) => {
        try {
          // Placeholder implementation
          console.log('Reset password:', { email })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
          return { success: false, error: errorMessage }
        }
      },
      
      updatePassword: async (newPassword) => {
        set({ isLoading: true, error: null })
        try {
          // Placeholder implementation
          console.log('Update password')
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password update failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Profile
      fetchProfile: async () => {
        const user = get().user
        if (!user) return
        
        try {
          // Placeholder implementation
          console.log('Fetch profile for user:', user.id)
          // Would fetch from database
        } catch (error) {
          console.error('Fetch profile error:', error)
        }
      },
      
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        try {
          // Placeholder implementation
          console.log('Update profile:', updates)
          get().updateUserProfile(updates)
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null })
        try {
          // Placeholder implementation
          console.log('Upload avatar:', file.name)
          const url = 'https://placeholder-avatar-url.com'
          get().updateUserProfile({ avatar_url: url })
          return { success: true, url }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Avatar upload failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Utility
      refreshSession: async () => {
        try {
          // Placeholder implementation
          console.log('Refresh session')
        } catch (error) {
          console.error('Refresh session error:', error)
          set({ error: 'Session refresh failed' })
        }
      },
      
      clearAuth: () => {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          userDisplayName: null,
          userAvatar: null,
          userEmail: null,
          userId: null,
          isEmailVerified: false,
          canEditProfile: false,
          error: null,
        })
      },
    })),
    {
      name: 'auth-store',
    }
  )
)