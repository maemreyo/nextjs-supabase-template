import { useCallback, useEffect } from 'react'
import { shallow } from 'zustand/shallow'
import { useAuthStore, authSelectors } from '@/stores/auth-store'

// Auth hook with optimized selectors
export function useAuth() {
    return useAuthStore(
        useCallback(
            (state) => ({
                // User data
                user: authSelectors.user(state),
                profile: authSelectors.profile(state),
                isAuthenticated: authSelectors.isAuthenticated(state),

                // User info
                userDisplayName: authSelectors.userDisplayName(state),
                userAvatar: authSelectors.userAvatar(state),
                userEmail: authSelectors.userEmail(state),
                userId: authSelectors.userId(state),

                // Auth state
                isLoading: authSelectors.isLoading(state),
                isInitialized: authSelectors.isInitialized(state),
                error: authSelectors.error(state),

                // Permissions
                canEditProfile: authSelectors.canEditProfile(state),
                isEmailVerified: authSelectors.isEmailVerified(state),

                // Actions
                setUser: state.setUser,
                setProfile: state.setProfile,
                updateUserProfile: state.updateUserProfile,
                setSession: state.setSession,
                setTokens: state.setTokens,
                setLoading: state.setLoading,
                setError: state.setError,
                clearError: state.clearError,
                setInitialized: state.setInitialized,

                // Auth flow
                signIn: state.signIn,
                signUp: state.signUp,
                signOut: state.signOut,
                resetPassword: state.resetPassword,
                updatePassword: state.updatePassword,

                // Profile
                fetchProfile: state.fetchProfile,
                updateProfile: state.updateProfile,
                uploadAvatar: state.uploadAvatar,

                // Utility
                refreshSession: state.refreshSession,
                clearAuth: state.clearAuth,
            }),
            []
        ))
}

export function useAuthUser() {
    return useAuthStore(authSelectors.user)
}

export function useAuthProfile() {
    return useAuthStore(authSelectors.profile)
}

export function useAuthState() {
    return useAuthStore(
        useCallback(
            (state) => ({
                isAuthenticated: authSelectors.isAuthenticated(state),
                isLoading: authSelectors.isLoading(state),
                isInitialized: authSelectors.isInitialized(state),
                error: authSelectors.error(state),
                user: authSelectors.user(state),
            }),
            []
        )
    )
}

export function useAuthActions() {
    return useAuthStore(
        useCallback(
            (state) => ({
                signIn: state.signIn,
                signUp: state.signUp,
                signOut: state.signOut,
                resetPassword: state.resetPassword,
                updatePassword: state.updatePassword,
                fetchProfile: state.fetchProfile,
                updateProfile: state.updateProfile,
                uploadAvatar: state.uploadAvatar,
                refreshSession: state.refreshSession,
                clearAuth: state.clearAuth,
                setLoading: state.setLoading,
                setError: state.setError,
                clearError: state.clearError,
                setInitialized: state.setInitialized,
            }),
            []
        )
    )
}

export function useUserInfo() {
    return useAuthStore(
        useCallback(
            (state) => ({
                displayName: authSelectors.userDisplayName(state),
                avatar: authSelectors.userAvatar(state),
                email: authSelectors.userEmail(state),
                id: authSelectors.userId(state),
                isEmailVerified: authSelectors.isEmailVerified(state),
            }),
            []
        )
    )
}

export function useAuthPermissions() {
    return useAuthStore(
        useCallback(
            (state) => ({
                canEditProfile: authSelectors.canEditProfile(state),
                isEmailVerified: authSelectors.isEmailVerified(state),
            }),
            []
        )
    )
}

// Hook for auth initialization
export function useAuthInit() {
    const { setInitialized, refreshSession, clearError } = useAuthActions()

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                clearError()
                await refreshSession()
            } catch (error) {
                console.error('Auth initialization failed:', error)
            } finally {
                if (mounted) {
                    setInitialized(true)
                }
            }
        }

        initializeAuth()

        return () => {
            mounted = false
        }
    }, [setInitialized, refreshSession, clearError])
}

// Hook for auth session monitoring
export function useAuthSessionMonitor() {
    const { isAuthenticated, user } = useAuthState()
    const { refreshSession, clearAuth } = useAuthActions()

    useEffect(() => {
        if (!isAuthenticated || !user) return

        // Set up session refresh interval
        const interval = setInterval(async () => {
            try {
                await refreshSession()
            } catch (error) {
                console.error('Session refresh failed:', error)
                clearAuth()
            }
        }, 5 * 60 * 1000) // Refresh every 5 minutes

        return () => clearInterval(interval)
    }, [isAuthenticated, user, refreshSession, clearAuth])

    // Monitor visibility change to refresh session when tab becomes active
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                refreshSession().catch(console.error)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isAuthenticated, refreshSession])
}