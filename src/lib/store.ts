import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import type { PersistStorage } from 'zustand/middleware'

// Types for store configuration
export interface StoreConfig {
  name: string
  devtools?: boolean
  persist?: {
    name: string
    storage?: PersistStorage<any>
    partialize?: (state: any) => any
    version?: number
    migrate?: (persistedState: unknown, version: number) => any
  }
}

// Generic store creator with middleware
export function createStore<T>(
  stateCreator: StateCreator<T>,
  config?: StoreConfig
) {
  let store: any = stateCreator

  // Add devtools middleware
  if (config?.devtools !== false) {
    store = devtools(store, {
      name: config?.name || 'store',
      enabled: process.env.NODE_ENV === 'development',
    })
  }

  // Add persist middleware
  if (config?.persist) {
    store = persist(store, {
      name: config.persist.name,
      storage: config.persist.storage || storage,
      partialize: config.persist.partialize,
      version: config.persist.version,
      migrate: config.persist.migrate,
    })
  }

  // Add subscribeWithSelector for better subscription control
  store = subscribeWithSelector(store)

  return create<T>()(store)
}

// Helper for creating selectors
export function createSelector<T, R>(
  selector: (state: T) => R
) {
  return selector
}

// Helper for creating actions
export function createAction<T, Args extends any[] = [], Return = void>(
  action: (state: T, ...args: Args) => Return
) {
  return action
}

// Type helpers
export type ExtractState<T> = T extends { getState: () => infer S } ? S : never
export type ExtractActions<T> = Omit<T, 'getState'>

// Persistence helpers
export const storage: PersistStorage<any> = {
  getItem: (name: string) => {
    const item = localStorage.getItem(name)
    if (!item) return null
    try {
      return JSON.parse(item)
    } catch {
      return item
    }
  },
  setItem: (name: string, value: any) => {
    localStorage.setItem(name, JSON.stringify(value))
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}

// Common store patterns
export interface LoadingState {
  loading: boolean
  error: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface SearchState {
  query: string
  filters: Record<string, any>
}

// Helper functions for common patterns
export const createLoadingState = (): LoadingState => ({
  loading: false,
  error: null,
})

export const createPaginationState = (
  page = 1,
  limit = 10
): PaginationState => ({
  page,
  limit,
  total: 0,
  hasMore: false,
})

export const createSearchState = (): SearchState => ({
  query: '',
  filters: {},
})

// Store utilities
export const storeUtils = {
  // Reset store to initial state
  reset: <T>(initialState: T) => () => initialState,

  // Set loading state
  setLoading: (loading: boolean) => <T extends LoadingState>(state: T) => ({
    ...state,
    loading,
  }),

  // Set error state
  setError: (error: string | null) => <T extends LoadingState>(state: T) => ({
    ...state,
    error,
  }),

  // Clear error
  clearError: <T extends LoadingState>(state: T) => ({
    ...state,
    error: null,
  }),

  // Update pagination
  updatePagination: (updates: Partial<PaginationState>) => <
    T extends PaginationState
  >(
    state: T
  ) => ({
    ...state,
    ...updates,
    hasMore: updates.total !== undefined
      ? state.page * state.limit < updates.total
      : state.hasMore,
  }),

  // Update search
  updateSearch: (updates: Partial<SearchState>) => <
    T extends SearchState
  >(
    state: T
  ) => ({
    ...state,
    ...updates,
  }),
}

// Export types for external use
export type { StateCreator }