import { useEffect } from 'react'
import { useAuthStore, authSelectors } from '@/stores/auth_store'
import { authLogger } from '@/services/logger'

// ✅ FIX: Use individual selectors instead of creating object
// This prevents unnecessary re-renders
export function useAuth() {
    const user = useAuthStore(authSelectors.user)
    const profile = useAuthStore(authSelectors.profile)
    const isAuthenticated = useAuthStore(authSelectors.isAuthenticated)
    const userDisplayName = useAuthStore(authSelectors.userDisplayName)
    const userAvatar = useAuthStore(authSelectors.userAvatar)
    const userEmail = useAuthStore(authSelectors.userEmail)
    const userId = useAuthStore(authSelectors.userId)
    const isLoading = useAuthStore(authSelectors.isLoading)
    const isInitialized = useAuthStore(authSelectors.isInitialized)
    const error = useAuthStore(authSelectors.error)
    const canEditProfile = useAuthStore(authSelectors.canEditProfile)
    const isEmailVerified = useAuthStore(authSelectors.isEmailVerified)

    // Get actions separately (these are stable references)
    const setUser = useAuthStore(state => state.setUser)
    const setProfile = useAuthStore(state => state.setProfile)
    const updateUserProfile = useAuthStore(state => state.updateUserProfile)
    const setSession = useAuthStore(state => state.setSession)
    const setTokens = useAuthStore(state => state.setTokens)
    const setLoading = useAuthStore(state => state.setLoading)
    const setError = useAuthStore(state => state.setError)
    const clearError = useAuthStore(state => state.clearError)
    const setInitialized = useAuthStore(state => state.setInitialized)
    const signIn = useAuthStore(state => state.signIn)
    const signUp = useAuthStore(state => state.signUp)
    const signOut = useAuthStore(state => state.signOut)
    const resetPassword = useAuthStore(state => state.resetPassword)
    const updatePassword = useAuthStore(state => state.updatePassword)
    const fetchProfile = useAuthStore(state => state.fetchProfile)
    const updateProfile = useAuthStore(state => state.updateProfile)
    const uploadAvatar = useAuthStore(state => state.uploadAvatar)
    const refreshSession = useAuthStore(state => state.refreshSession)
    const clearAuth = useAuthStore(state => state.clearAuth)

    return {
        user,
        profile,
        isAuthenticated,
        userDisplayName,
        userAvatar,
        userEmail,
        userId,
        isLoading,
        isInitialized,
        error,
        canEditProfile,
        isEmailVerified,
        setUser,
        setProfile,
        updateUserProfile,
        setSession,
        setTokens,
        setLoading,
        setError,
        clearError,
        setInitialized,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        fetchProfile,
        updateProfile,
        uploadAvatar,
        refreshSession,
        clearAuth,
    }
}

export function useAuthUser() {
    return useAuthStore(authSelectors.user)
}

export function useAuthProfile() {
    return useAuthStore(authSelectors.profile)
}

// ✅ Optimized: Only subscribe to specific fields
export function useAuthState() {
    const isAuthenticated = useAuthStore(authSelectors.isAuthenticated)
    const isLoading = useAuthStore(authSelectors.isLoading)
    const isInitialized = useAuthStore(authSelectors.isInitialized)
    const error = useAuthStore(authSelectors.error)
    const user = useAuthStore(authSelectors.user)

    return {
        isAuthenticated,
        isLoading,
        isInitialized,
        error,
        user,
    }
}

export function useAuthActions() {
    const signIn = useAuthStore(state => state.signIn)
    const signUp = useAuthStore(state => state.signUp)
    const signOut = useAuthStore(state => state.signOut)
    const resetPassword = useAuthStore(state => state.resetPassword)
    const updatePassword = useAuthStore(state => state.updatePassword)
    const fetchProfile = useAuthStore(state => state.fetchProfile)
    const updateProfile = useAuthStore(state => state.updateProfile)
    const uploadAvatar = useAuthStore(state => state.uploadAvatar)
    const refreshSession = useAuthStore(state => state.refreshSession)
    const clearAuth = useAuthStore(state => state.clearAuth)
    const setLoading = useAuthStore(state => state.setLoading)
    const setError = useAuthStore(state => state.setError)
    const clearError = useAuthStore(state => state.clearError)
    const setInitialized = useAuthStore(state => state.setInitialized)

    return {
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        fetchProfile,
        updateProfile,
        uploadAvatar,
        refreshSession,
        clearAuth,
        setLoading,
        setError,
        clearError,
        setInitialized,
    }
}

export function useUserInfo() {
    const displayName = useAuthStore(authSelectors.userDisplayName)
    const avatar = useAuthStore(authSelectors.userAvatar)
    const email = useAuthStore(authSelectors.userEmail)
    const id = useAuthStore(authSelectors.userId)
    const isEmailVerified = useAuthStore(authSelectors.isEmailVerified)

    return {
        displayName,
        avatar,
        email,
        id,
        isEmailVerified,
    }
}

export function useAuthPermissions() {
    const canEditProfile = useAuthStore(authSelectors.canEditProfile)
    const isEmailVerified = useAuthStore(authSelectors.isEmailVerified)

    return {
        canEditProfile,
        isEmailVerified,
    }
}

// Hook for auth initialization
export function useAuthInit() {
    const isInitialized = useAuthStore(state => state.isInitialized)

    useEffect(() => {
        // Skip if already initialized
        if (isInitialized) {
            return
        }

        let mounted = true

        const initializeAuth = async () => {
            try {
                authLogger.start('Auth initialization')
                useAuthStore.getState().clearError()
                await useAuthStore.getState().refreshSession()
                authLogger.success('Auth initialization completed')
            } catch (error) {
                authLogger.error('Auth initialization failed', { error: error instanceof Error ? error.message : 'Unknown error' })
            } finally {
                if (mounted) {
                    useAuthStore.getState().setInitialized(true)
                }
            }
        }

        initializeAuth()

        return () => {
            mounted = false
        }
    }, [isInitialized])
}

// Hook for auth session monitoring
export function useAuthSessionMonitor() {
    const isAuthenticated = useAuthStore(authSelectors.isAuthenticated)
    const user = useAuthStore(authSelectors.user)

    useEffect(() => {
        if (!isAuthenticated || !user) {
            return
        }

        // Set up session refresh interval
        const interval = setInterval(async () => {
            try {
                authLogger.start('Periodic session refresh')
                await useAuthStore.getState().refreshSession()
                authLogger.info('Token refresh completed', {
                    userId: user?.id,
                    newTokenExpiry: new Date(Date.now() + 5*60*1000)
                })
            } catch (error) {
                authLogger.error('Session refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' })
                useAuthStore.getState().clearAuth()
            }
        }, 5 * 60 * 1000) // Refresh every 5 minutes

        return () => {
            clearInterval(interval)
        }
    }, [isAuthenticated, user])

    // Monitor visibility change to refresh session when tab becomes active
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                authLogger.start('Session refresh on visibility change')
                useAuthStore.getState().refreshSession()
                    .then(() => {
                        authLogger.info('Token refresh completed', {
                            userId: user?.id,
                            newTokenExpiry: new Date(Date.now() + 5*60*1000)
                        })
                    })
                    .catch((error) => {
                        authLogger.error('Visibility change session refresh failed', { error: error instanceof Error ? error.message : 'Unknown error' })
                    })
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [isAuthenticated])
}