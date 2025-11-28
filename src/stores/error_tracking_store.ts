import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Error types
export interface ErrorEntry {
  id: string
  message: string
  stack?: string
  timestamp: string
  context: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

// Error Tracking State interface
export interface ErrorTrackingState {
  errors: ErrorEntry[]
}

// Error Tracking Actions interface
export interface ErrorTrackingActions {
  addError: (error: Omit<ErrorEntry, 'id' | 'timestamp'>) => void
  resolveError: (id: string) => void
  clearErrors: () => void
  clearResolvedErrors: () => void
  clearUnresolvedErrors: () => void
  resetErrorTracking: () => void
}

// Combined Error Tracking store type
export type ErrorTrackingStore = ErrorTrackingState & ErrorTrackingActions

// Initial state
const initialState: ErrorTrackingState = {
  errors: [],
}

// Error Tracking store implementation
export const createErrorTrackingStore = () =>
  create<ErrorTrackingStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Error actions
          addError: (error) => {
            const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const newError = {
              ...error,
              id,
              timestamp: new Date().toISOString(),
            }
            
            set(
              (state) => ({
                errors: [...state.errors, newError],
              }),
              false,
              'addError'
            )
          },

          resolveError: (id) => {
            set(
              (state) => ({
                errors: state.errors.map((error) =>
                  error.id === id ? { ...error, resolved: true } : error
                ),
              }),
              false,
              'resolveError'
            )
          },

          clearErrors: () => {
            set({ errors: [] }, false, 'clearErrors')
          },

          clearResolvedErrors: () => {
            set(
              (state) => ({
                errors: state.errors.filter((error) => !error.resolved),
              }),
              false,
              'clearResolvedErrors'
            )
          },

          clearUnresolvedErrors: () => {
            set(
              (state) => ({
                errors: state.errors.filter((error) => error.resolved),
              }),
              false,
              'clearUnresolvedErrors'
            )
          },

          resetErrorTracking: () => {
            set(initialState, false, 'resetErrorTracking')
          },
        }),
        {
          name: 'error-tracking-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useErrorTrackingStore = createErrorTrackingStore()

// Selectors
export const errorTrackingSelectors = {
  errors: (state: ErrorTrackingStore) => state.errors,
  errorCount: (state: ErrorTrackingStore) => state.errors.length,
  unresolvedErrors: (state: ErrorTrackingStore) => state.errors.filter(e => !e.resolved),
  resolvedErrors: (state: ErrorTrackingStore) => state.errors.filter(e => e.resolved),
  unresolvedErrorCount: (state: ErrorTrackingStore) => state.errors.filter(e => !e.resolved).length,
  resolvedErrorCount: (state: ErrorTrackingStore) => state.errors.filter(e => e.resolved).length,
  hasErrors: (state: ErrorTrackingStore) => state.errors.length > 0,
  hasUnresolvedErrors: (state: ErrorTrackingStore) => state.errors.some(e => !e.resolved),
  errorsBySeverity: (state: ErrorTrackingStore, severity: ErrorEntry['severity']) => 
    state.errors.filter(error => error.severity === severity),
  criticalErrors: (state: ErrorTrackingStore) => state.errors.filter(e => e.severity === 'critical'),
  highErrors: (state: ErrorTrackingStore) => state.errors.filter(e => e.severity === 'high'),
  mediumErrors: (state: ErrorTrackingStore) => state.errors.filter(e => e.severity === 'medium'),
  lowErrors: (state: ErrorTrackingStore) => state.errors.filter(e => e.severity === 'low'),
  recentErrors: (state: ErrorTrackingStore, minutes: number = 60) => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return state.errors.filter(error => new Date(error.timestamp) >= cutoff)
  },
  errorsByContext: (state: ErrorTrackingStore, context: string) => 
    state.errors.filter(error => error.context === context),
  getError: (state: ErrorTrackingStore, id: string) => 
    state.errors.find(error => error.id === id),
  isErrorResolved: (state: ErrorTrackingStore, id: string) => 
    state.errors.find(error => error.id === id)?.resolved ?? false,
  errorRate: (state: ErrorTrackingStore) => {
    if (state.errors.length === 0) return 0
    const resolvedCount = state.errors.filter(e => e.resolved).length
    return ((state.errors.length - resolvedCount) / state.errors.length) * 100
  },
  resolutionRate: (state: ErrorTrackingStore) => {
    if (state.errors.length === 0) return 100
    const resolvedCount = state.errors.filter(e => e.resolved).length
    return (resolvedCount / state.errors.length) * 100
  },
  mostCommonContext: (state: ErrorTrackingStore) => {
    const contextCounts = state.errors.reduce((acc, error) => {
      acc[error.context] = (acc[error.context] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(contextCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown'
  },
  mostCommonSeverity: (state: ErrorTrackingStore) => {
    const severityCounts = state.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<ErrorEntry['severity'], number>)
    
    return Object.entries(severityCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'low'
  },
}