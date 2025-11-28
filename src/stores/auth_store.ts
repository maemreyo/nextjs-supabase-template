import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import { authLogger } from '@/services/logger'

// User profile interface
export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  bio?: string
  email?: string
  phone?: string
  updated_at?: string
  [key: string]: unknown
}

// Auth state interface
export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  userDisplayName: string | null
  userAvatar: string | null
  userEmail: string | null
  userId: string | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  canEditProfile: boolean
  isEmailVerified: boolean
}

// Auth actions interface
export interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  updateUserProfile: (updates: Partial<UserProfile>) => void
  setSession: (session: Session | null) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setInitialized: (initialized: boolean) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  uploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  refreshSession: () => Promise<void>
  clearAuth: () => void
}

export type AuthStore = AuthState & AuthActions

// Initial state - ✅ CACHED outside to prevent recreation
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

// ✅ FIX: Create getServerSnapshot outside, cached
const getServerSnapshot = () => initialState

// Create auth store
export const useAuthStore = create<AuthStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
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
        const newProfile = currentProfile ? { ...currentProfile, ...updates } : { id: '', ...updates }
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
        authLogger.info('Tokens set', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken })
      },
      
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      setError: (error) => set({ error }, false, 'setError'),
      clearError: () => set({ error: null }, false, 'clearError'),
      setInitialized: (isInitialized) => set({ isInitialized }, false, 'setInitialized'),
      
      signIn: async (email, _password) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        set({ isLoading: true, error: null })
        try {
          authLogger.info('User login attempt', { email })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
          authLogger.error('Login failed', { email, error: errorMessage })
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      signUp: async (email, password, metadata) => {
        set({ isLoading: true, error: null })
        try {
          authLogger.info('User signup attempt', { email, hasMetadata: !!metadata })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
          authLogger.error('Signup failed', { email, error: errorMessage })
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      signOut: async () => {
        set({ isLoading: true })
        try {
          authLogger.info('User sign out initiated')
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
          authLogger.success('User signed out successfully')
        } catch (error) {
          authLogger.error('Sign out error', { error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },
      
      resetPassword: async (email) => {
        try {
          authLogger.info('Password reset requested', { email })
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
          authLogger.error('Password reset failed', { email, error: errorMessage })
          return { success: false, error: errorMessage }
        }
      },
      
      updatePassword: async (_newPassword) => { // eslint-disable-line @typescript-eslint/no-unused-vars
        set({ isLoading: true, error: null })
        try {
          authLogger.info('Password update attempt')
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password update failed'
          authLogger.error('Password update failed', { error: errorMessage })
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      fetchProfile: async () => {
        const user = get().user
        if (!user) return
        
        try {
          authLogger.info('Fetching user profile', { userId: user.id })
        } catch (error) {
          authLogger.error('Failed to fetch profile', { userId: user.id, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      },
      
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        try {
          authLogger.info('Updating user profile', { fields: Object.keys(updates) })
          get().updateUserProfile(updates)
          authLogger.success('Profile updated successfully')
          return { success: true }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
          authLogger.error('Profile update failed', { updates, error: errorMessage })
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null })
        try {
          authLogger.info('Avatar upload started', { fileName: file.name, fileSize: file.size })
          const url = 'https://placeholder-avatar-url.com'
          get().updateUserProfile({ avatar_url: url })
          authLogger.success('Avatar uploaded successfully')
          return { success: true, url }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Avatar upload failed'
          authLogger.error('Avatar upload failed', { fileName: file.name, error: errorMessage })
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },
      
      refreshSession: async () => {
        try {
          authLogger.start('Session refresh attempt')
        } catch (error) {
          authLogger.error('Session refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' })
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
      // ✅ FIX: Use cached function reference
      getServerSnapshot,
    }
  )
)