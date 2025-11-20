import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'
import { createStore, storeUtils, type LoadingState, type PaginationState, type SearchState } from '@/lib/store'

// App state interface
export interface AppState extends LoadingState, PaginationState, SearchState {
  // App metadata
  version: string
  buildNumber: string
  environment: 'development' | 'staging' | 'production'
  
  // Feature flags
  features: {
    newDashboard: boolean
    betaFeatures: boolean
    advancedAnalytics: boolean
    experimentalFeatures: boolean
  }
  
  // User preferences
  preferences: {
    language: string
    timezone: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    currency: string
    notifications: {
      email: boolean
      push: boolean
      inApp: boolean
    }
  }
  
  // App status
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'none' | 'unknown'
  lastSyncAt: string | null
  
  // Performance metrics
  performance: {
    loadTime: number
    renderTime: number
    apiResponseTime: number
    errorRate: number
  }
  
  // Cache state
  cache: {
    size: number
    maxSize: number
    entries: Array<{
      key: string
      size: number
      accessedAt: string
      expiresAt: string | null
    }>
  }
  
  // Error tracking
  errors: Array<{
    id: string
    message: string
    stack?: string
    timestamp: string
    context: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    resolved: boolean
  }>
  
  // Activity tracking
  activity: {
    lastActivity: string
    sessionDuration: number
    pageViews: number
    actions: number
  }
}

// App actions interface
export interface AppActions {
  // App metadata actions
  setVersion: (version: string) => void
  setBuildNumber: (buildNumber: string) => void
  setEnvironment: (environment: AppState['environment']) => void
  
  // Feature flag actions
  setFeature: (feature: keyof AppState['features'], enabled: boolean) => void
  setFeatures: (features: Partial<AppState['features']>) => void
  resetFeatures: () => void
  
  // Preference actions
  setPreference: <K extends keyof AppState['preferences']>(
    key: K,
    value: AppState['preferences'][K]
  ) => void
  setPreferences: (preferences: Partial<AppState['preferences']>) => void
  resetPreferences: () => void
  
  // Status actions
  setOnlineStatus: (isOnline: boolean) => void
  setConnectionType: (type: AppState['connectionType']) => void
  updateLastSync: () => void
  
  // Performance actions
  updatePerformance: (metrics: Partial<AppState['performance']>) => void
  recordApiResponseTime: (time: number) => void
  recordError: () => void
  
  // Cache actions
  addCacheEntry: (entry: Omit<AppState['cache']['entries'][0], 'accessedAt'>) => void
  removeCacheEntry: (key: string) => void
  clearCache: () => void
  cleanupExpiredCache: () => void
  
  // Error actions
  addError: (error: Omit<AppState['errors'][0], 'id' | 'timestamp'>) => void
  resolveError: (id: string) => void
  clearErrors: () => void
  
  // Activity actions
  updateActivity: (updates: Partial<AppState['activity']>) => void
  recordPageView: () => void
  recordAction: () => void
  
  // Utility actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Pagination actions
  updatePagination: (updates: Partial<PaginationState>) => void
  resetPagination: () => void
  
  // Search actions
  updateSearch: (updates: Partial<SearchState>) => void
  clearSearch: () => void
  
  // Reset actions
  resetApp: () => void
}

// Combined app store type
export type AppStore = AppState & AppActions

// Initial state
const initialState: AppState = {
  // App metadata
  version: '1.0.0',
  buildNumber: '20240101',
  environment: 'development',
  
  // Feature flags
  features: {
    newDashboard: false,
    betaFeatures: false,
    advancedAnalytics: false,
    experimentalFeatures: false,
  },
  
  // User preferences
  preferences: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
  },
  
  // App status
  isOnline: true,
  connectionType: 'unknown',
  lastSyncAt: null,
  
  // Performance metrics
  performance: {
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
  },
  
  // Cache state
  cache: {
    size: 0,
    maxSize: 50 * 1024 * 1024, // 50MB
    entries: [],
  },
  
  // Error tracking
  errors: [],
  
  // Activity tracking
  activity: {
    lastActivity: new Date().toISOString(),
    sessionDuration: 0,
    pageViews: 0,
    actions: 0,
  },
  
  // Loading, pagination, and search
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  query: '',
  filters: {},
}

// App store implementation
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          // App metadata actions
          setVersion: (version) => {
            set({ version }, false, 'setVersion')
          },

          setBuildNumber: (buildNumber) => {
            set({ buildNumber }, false, 'setBuildNumber')
          },

          setEnvironment: (environment) => {
            set({ environment }, false, 'setEnvironment')
          },

          // Feature flag actions
          setFeature: (feature, enabled) => {
            set(
              (state) => ({
                features: {
                  ...state.features,
                  [feature]: enabled,
                },
              }),
              false,
              'setFeature'
            )
          },

          setFeatures: (features) => {
            set(
              (state) => ({
                features: {
                  ...state.features,
                  ...features,
                },
              }),
              false,
              'setFeatures'
            )
          },

          resetFeatures: () => {
            set({ features: initialState.features }, false, 'resetFeatures')
          },

          // Preference actions
          setPreference: (key, value) => {
            set(
              (state) => ({
                preferences: {
                  ...state.preferences,
                  [key]: value,
                },
              }),
              false,
              'setPreference'
            )
          },

          setPreferences: (preferences) => {
            set(
              (state) => ({
                preferences: {
                  ...state.preferences,
                  ...preferences,
                },
              }),
              false,
              'setPreferences'
            )
          },

          resetPreferences: () => {
            set({ preferences: initialState.preferences }, false, 'resetPreferences')
          },

          // Status actions
          setOnlineStatus: (isOnline) => {
            set({ isOnline }, false, 'setOnlineStatus')
          },

          setConnectionType: (connectionType) => {
            set({ connectionType }, false, 'setConnectionType')
          },

          updateLastSync: () => {
            set({ lastSyncAt: new Date().toISOString() }, false, 'updateLastSync')
          },

          // Performance actions
          updatePerformance: (metrics) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  ...metrics,
                },
              }),
              false,
              'updatePerformance'
            )
          },

          recordApiResponseTime: (time) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  apiResponseTime: (state.performance.apiResponseTime + time) / 2, // Moving average
                },
              }),
              false,
              'recordApiResponseTime'
            )
          },

          recordError: () => {
            set(
              (state) => {
                const totalRequests = state.performance.apiResponseTime > 0 ? 100 : 1 // Simplified
                const newErrorRate = ((state.errors.length + 1) / totalRequests) * 100
                return {
                  performance: {
                    ...state.performance,
                    errorRate: newErrorRate,
                  },
                }
              },
              false,
              'recordError'
            )
          },

          // Cache actions
          addCacheEntry: (entry) => {
            set(
              (state) => {
                const newEntry = {
                  ...entry,
                  accessedAt: new Date().toISOString(),
                }
                const entries = [...state.cache.entries, newEntry]
                const size = entries.reduce((total, e) => total + e.size, 0)
                
                return {
                  cache: {
                    ...state.cache,
                    entries,
                    size,
                  },
                }
              },
              false,
              'addCacheEntry'
            )
          },

          removeCacheEntry: (key) => {
            set(
              (state) => {
                const entries = state.cache.entries.filter((e) => e.key !== key)
                const size = entries.reduce((total, e) => total + e.size, 0)
                
                return {
                  cache: {
                    ...state.cache,
                    entries,
                    size,
                  },
                }
              },
              false,
              'removeCacheEntry'
            )
          },

          clearCache: () => {
            set(
              (state) => ({
                cache: {
                  ...state.cache,
                  entries: [],
                  size: 0,
                },
              }),
              false,
              'clearCache'
            )
          },

          cleanupExpiredCache: () => {
            set(
              (state) => {
                const now = new Date()
                const entries = state.cache.entries.filter((entry) => {
                  if (!entry.expiresAt) return true
                  return new Date(entry.expiresAt) > now
                })
                const size = entries.reduce((total, e) => total + e.size, 0)
                
                return {
                  cache: {
                    ...state.cache,
                    entries,
                    size,
                  },
                }
              },
              false,
              'cleanupExpiredCache'
            )
          },

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
            
            get().recordError()
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

          // Activity actions
          updateActivity: (updates) => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  ...updates,
                },
              }),
              false,
              'updateActivity'
            )
          },

          recordPageView: () => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                  pageViews: state.activity.pageViews + 1,
                },
              }),
              false,
              'recordPageView'
            )
          },

          recordAction: () => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                  actions: state.activity.actions + 1,
                },
              }),
              false,
              'recordAction'
            )
          },

          // Utility actions
          setLoading: (loading) => {
            set(storeUtils.setLoading(loading), false, 'setLoading')
          },

          setError: (error) => {
            set(storeUtils.setError(error), false, 'setError')
          },

          clearError: () => {
            set({ error: null }, false, 'clearError')
          },

          // Pagination actions
          updatePagination: (updates) => {
            set(storeUtils.updatePagination(updates), false, 'updatePagination')
          },

          resetPagination: () => {
            set({
              page: 1,
              limit: 10,
              total: 0,
              hasMore: false,
            }, false, 'resetPagination')
          },

          // Search actions
          updateSearch: (updates) => {
            set(storeUtils.updateSearch(updates), false, 'updateSearch')
          },

          clearSearch: () => {
            set({
              query: '',
              filters: {},
            }, false, 'clearSearch')
          },

          // Reset actions
          resetApp: () => {
            set(initialState, false, 'resetApp')
          },
        }),
        {
          name: 'app-storage',
          partialize: (state) => ({
            // Only persist preferences and some settings
            preferences: state.preferences,
            features: state.features,
            version: state.version,
            environment: state.environment,
          }),
          version: 1,
        }
      ),
      {
        name: 'app-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)

// Selectors
export const appSelectors = {
  // App metadata selectors
  version: (state: AppStore) => state.version,
  buildNumber: (state: AppStore) => state.buildNumber,
  environment: (state: AppStore) => state.environment,
  isProduction: (state: AppStore) => state.environment === 'production',
  isDevelopment: (state: AppStore) => state.environment === 'development',

  // Feature flag selectors
  features: (state: AppStore) => state.features,
  isFeatureEnabled: (state: AppStore, feature: keyof AppState['features']) => 
    state.features[feature],
  hasBetaAccess: (state: AppStore) => state.features.betaFeatures,

  // Preference selectors
  preferences: (state: AppStore) => state.preferences,
  language: (state: AppStore) => state.preferences.language,
  timezone: (state: AppStore) => state.preferences.timezone,
  dateFormat: (state: AppStore) => state.preferences.dateFormat,
  timeFormat: (state: AppStore) => state.preferences.timeFormat,
  currency: (state: AppStore) => state.preferences.currency,
  notifications: (state: AppStore) => state.preferences.notifications,

  // Status selectors
  isOnline: (state: AppStore) => state.isOnline,
  isOffline: (state: AppStore) => !state.isOnline,
  connectionType: (state: AppStore) => state.connectionType,
  lastSyncAt: (state: AppStore) => state.lastSyncAt,
  needsSync: (state: AppStore) => {
    if (!state.lastSyncAt) return true
    const lastSync = new Date(state.lastSyncAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
    return diffMinutes > 5 // Sync if more than 5 minutes ago
  },

  // Performance selectors
  performance: (state: AppStore) => state.performance,
  loadTime: (state: AppStore) => state.performance.loadTime,
  renderTime: (state: AppStore) => state.performance.renderTime,
  apiResponseTime: (state: AppStore) => state.performance.apiResponseTime,
  errorRate: (state: AppStore) => state.performance.errorRate,
  isPerformant: (state: AppStore) => 
    state.performance.loadTime < 1000 && 
    state.performance.renderTime < 100 && 
    state.performance.apiResponseTime < 500 &&
    state.performance.errorRate < 1,

  // Cache selectors
  cache: (state: AppStore) => state.cache,
  cacheSize: (state: AppStore) => state.cache.size,
  cacheUsage: (state: AppStore) => (state.cache.size / state.cache.maxSize) * 100,
  cacheEntries: (state: AppStore) => state.cache.entries,
  isCacheFull: (state: AppStore) => state.cache.size >= state.cache.maxSize * 0.9,

  // Error selectors
  errors: (state: AppStore) => state.errors,
  unresolvedErrors: (state: AppStore) => state.errors.filter(e => !e.resolved),
  errorCount: (state: AppStore) => state.errors.length,
  unresolvedErrorCount: (state: AppStore) => state.errors.filter(e => !e.resolved).length,
  hasErrors: (state: AppStore) => state.errors.length > 0,
  hasUnresolvedErrors: (state: AppStore) => state.errors.some(e => !e.resolved),

  // Activity selectors
  activity: (state: AppStore) => state.activity,
  lastActivity: (state: AppStore) => state.activity.lastActivity,
  sessionDuration: (state: AppStore) => state.activity.sessionDuration,
  pageViews: (state: AppStore) => state.activity.pageViews,
  actions: (state: AppStore) => state.activity.actions,
  isActive: (state: AppStore) => {
    const lastActivity = new Date(state.activity.lastActivity)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    return diffMinutes < 30 // Active if within last 30 minutes
  },

  // State selectors
  loading: (state: AppStore) => state.loading,
  error: (state: AppStore) => state.error,
  hasError: (state: AppStore) => !!state.error,
  
  // Pagination selectors
  pagination: (state: AppStore) => ({
    page: state.page,
    limit: state.limit,
    total: state.total,
    hasMore: state.hasMore,
  }),
  currentPage: (state: AppStore) => state.page,
  pageSize: (state: AppStore) => state.limit,
  totalItems: (state: AppStore) => state.total,
  hasNextPage: (state: AppStore) => state.hasMore,

  // Search selectors
  search: (state: AppStore) => ({
    query: state.query,
    filters: state.filters,
  }),
  searchQuery: (state: AppStore) => state.query,
  searchFilters: (state: AppStore) => state.filters,
  isSearching: (state: AppStore) => !!state.query || Object.keys(state.filters).length > 0,
}