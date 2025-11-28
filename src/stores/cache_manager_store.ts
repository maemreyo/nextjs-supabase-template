import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Cache entry types
export interface CacheEntry {
  key: string
  size: number
  accessedAt: string
  expiresAt: string | null
}

// Cache Manager State interface
export interface CacheManagerState {
  cache: {
    size: number
    maxSize: number
    entries: CacheEntry[]
  }
}

// Cache Manager Actions interface
export interface CacheManagerActions {
  addCacheEntry: (entry: Omit<CacheEntry, 'accessedAt'>) => void
  removeCacheEntry: (key: string) => void
  clearCache: () => void
  cleanupExpiredCache: () => void
  setCacheSize: (size: number) => void
  setCacheMaxSize: (maxSize: number) => void
  resetCacheManager: () => void
}

// Combined Cache Manager store type
export type CacheManagerStore = CacheManagerState & CacheManagerActions

// Initial state
const initialState: CacheManagerState = {
  cache: {
    size: 0,
    maxSize: 50 * 1024 * 1024, // 50MB
    entries: [],
  },
}

// Cache Manager store implementation
export const createCacheManagerStore = () =>
  create<CacheManagerStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

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

          setCacheSize: (size) => {
            set(
              (state) => ({
                cache: {
                  ...state.cache,
                  size,
                },
              }),
              false,
              'setCacheSize'
            )
          },

          setCacheMaxSize: (maxSize) => {
            set(
              (state) => ({
                cache: {
                  ...state.cache,
                  maxSize,
                },
              }),
              false,
              'setCacheMaxSize'
            )
          },

          resetCacheManager: () => {
            set(initialState, false, 'resetCacheManager')
          },
        }),
        {
          name: 'cache-manager-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useCacheManagerStore = createCacheManagerStore()

// Selectors
export const cacheManagerSelectors = {
  cache: (state: CacheManagerStore) => state.cache,
  cacheSize: (state: CacheManagerStore) => state.cache.size,
  cacheMaxSize: (state: CacheManagerStore) => state.cache.maxSize,
  cacheEntries: (state: CacheManagerStore) => state.cache.entries,
  cacheEntryCount: (state: CacheManagerStore) => state.cache.entries.length,
  cacheUsage: (state: CacheManagerStore) => (state.cache.size / state.cache.maxSize) * 100,
  isCacheFull: (state: CacheManagerStore) => state.cache.size >= state.cache.maxSize * 0.9,
  isCacheEmpty: (state: CacheManagerStore) => state.cache.entries.length === 0,
  getCacheEntry: (state: CacheManagerStore, key: string) => 
    state.cache.entries.find(entry => entry.key === key),
  hasCacheEntry: (state: CacheManagerStore, key: string) => 
    state.cache.entries.some(entry => entry.key === key),
  expiredEntries: (state: CacheManagerStore) => 
    state.cache.entries.filter(entry => {
      if (!entry.expiresAt) return false
      return new Date(entry.expiresAt) <= new Date()
    }),
  validEntries: (state: CacheManagerStore) => 
    state.cache.entries.filter(entry => {
      if (!entry.expiresAt) return true
      return new Date(entry.expiresAt) > new Date()
    }),
  oldestEntry: (state: CacheManagerStore) => {
    if (state.cache.entries.length === 0) return null
    return state.cache.entries.reduce((oldest, entry) => 
      new Date(entry.accessedAt) < new Date(oldest.accessedAt) ? entry : oldest
    )
  },
  newestEntry: (state: CacheManagerStore) => {
    if (state.cache.entries.length === 0) return null
    return state.cache.entries.reduce((newest, entry) => 
      new Date(entry.accessedAt) > new Date(newest.accessedAt) ? entry : newest
    )
  },
  cacheHitRate: (state: CacheManagerStore) => {
    // This would need to be tracked separately in a real implementation
    // For now, return a placeholder value
    return 0.85 // 85% cache hit rate
  },
  needsCleanup: (state: CacheManagerStore) => 
    state.cache.entries.some(entry => {
      if (!entry.expiresAt) return false
      return new Date(entry.expiresAt) <= new Date()
    }),
}