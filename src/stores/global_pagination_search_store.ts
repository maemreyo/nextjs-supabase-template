import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Global Pagination Search State interface
export interface GlobalPaginationSearchState {
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  hasMore: boolean
  query: string
  filters: Record<string, any>
}

// Global Pagination Search Actions interface
export interface GlobalPaginationSearchActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  updatePagination: (updates: Partial<Pick<GlobalPaginationSearchState, 'page' | 'limit' | 'total' | 'hasMore'>>) => void
  resetPagination: () => void
  updateSearch: (updates: Partial<Pick<GlobalPaginationSearchState, 'query' | 'filters'>>) => void
  clearSearch: () => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setTotal: (total: number) => void
  setHasMore: (hasMore: boolean) => void
  setQuery: (query: string) => void
  setFilters: (filters: Record<string, any>) => void
  updateFilters: (filters: Record<string, any>) => void
  clearFilters: () => void
  nextPage: () => void
  prevPage: () => void
  resetGlobalPaginationSearch: () => void
}

// Combined Global Pagination Search store type
export type GlobalPaginationSearchStore = GlobalPaginationSearchState & GlobalPaginationSearchActions

// Initial state
const initialState: GlobalPaginationSearchState = {
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  hasMore: false,
  query: '',
  filters: {},
}

// Global Pagination Search store implementation
export const createGlobalPaginationSearchStore = () =>
  create<GlobalPaginationSearchStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Utility actions
          setLoading: (loading) => {
            set({ loading }, false, 'setLoading')
          },

          setError: (error) => {
            set({ error }, false, 'setError')
          },

          clearError: () => {
            set({ error: null }, false, 'clearError')
          },

          // Pagination actions
          updatePagination: (updates) => {
            set(
              (state) => ({
                ...state,
                ...updates,
              }),
              false,
              'updatePagination'
            )
          },

          resetPagination: () => {
            set(
              (state) => ({
                ...state,
                page: 1,
                limit: 10,
                total: 0,
                hasMore: false,
              }),
              false,
              'resetPagination'
            )
          },

          // Search actions
          updateSearch: (updates) => {
            set(
              (state) => ({
                ...state,
                ...updates,
              }),
              false,
              'updateSearch'
            )
          },

          clearSearch: () => {
            set(
              (state) => ({
                ...state,
                query: '',
                filters: {},
              }),
              false,
              'clearSearch'
            )
          },

          setPage: (page) => {
            set({ page }, false, 'setPage')
          },

          setLimit: (limit) => {
            set({ limit }, false, 'setLimit')
          },

          setTotal: (total) => {
            set(
              (state) => ({
                ...state,
                total,
                hasMore: total > state.page * state.limit,
              }),
              false,
              'setTotal'
            )
          },

          setHasMore: (hasMore) => {
            set({ hasMore }, false, 'setHasMore')
          },

          setQuery: (query) => {
            set({ query }, false, 'setQuery')
          },

          setFilters: (filters) => {
            set({ filters }, false, 'setFilters')
          },

          updateFilters: (filters) => {
            set(
              (state) => ({
                ...state,
                filters: {
                  ...state.filters,
                  ...filters,
                },
              }),
              false,
              'updateFilters'
            )
          },

          clearFilters: () => {
            set({ filters: {} }, false, 'clearFilters')
          },

          // Navigation actions
          nextPage: () => {
            set(
              (state) => {
                const newPage = state.page + 1
                return {
                  ...state,
                  page: newPage,
                }
              },
              false,
              'nextPage'
            )
          },

          prevPage: () => {
            set(
              (state) => {
                const newPage = Math.max(1, state.page - 1)
                return {
                  ...state,
                  page: newPage,
                }
              },
              false,
              'prevPage'
            )
          },

          // Reset action
          resetGlobalPaginationSearch: () => {
            set(initialState, false, 'resetGlobalPaginationSearch')
          },
        }),
        {
          name: 'global-pagination-search-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useGlobalPaginationSearchStore = createGlobalPaginationSearchStore()

// Selectors
export const globalPaginationSearchSelectors = {
  loading: (state: GlobalPaginationSearchStore) => state.loading,
  error: (state: GlobalPaginationSearchStore) => state.error,
  hasError: (state: GlobalPaginationSearchStore) => !!state.error,
  page: (state: GlobalPaginationSearchStore) => state.page,
  limit: (state: GlobalPaginationSearchStore) => state.limit,
  total: (state: GlobalPaginationSearchStore) => state.total,
  hasMore: (state: GlobalPaginationSearchStore) => state.hasMore,
  query: (state: GlobalPaginationSearchStore) => state.query,
  filters: (state: GlobalPaginationSearchStore) => state.filters,
  isSearching: (state: GlobalPaginationSearchStore) => !!state.query || Object.keys(state.filters).length > 0,
  isEmpty: (state: GlobalPaginationSearchStore) => state.total === 0,
  isFirstPage: (state: GlobalPaginationSearchStore) => state.page === 1,
  isLastPage: (state: GlobalPaginationSearchStore) => !state.hasMore,
  totalPages: (state: GlobalPaginationSearchStore) => Math.ceil(state.total / state.limit),
  currentPageStart: (state: GlobalPaginationSearchStore) => (state.page - 1) * state.limit + 1,
  currentPageEnd: (state: GlobalPaginationSearchStore) => Math.min(state.page * state.limit, state.total),
  hasNextPage: (state: GlobalPaginationSearchStore) => state.page < Math.ceil(state.total / state.limit),
  hasPrevPage: (state: GlobalPaginationSearchStore) => state.page > 1,
  paginationInfo: (state: GlobalPaginationSearchStore) => ({
    currentPage: state.page,
    pageSize: state.limit,
    totalItems: state.total,
    totalPages: Math.ceil(state.total / state.limit),
    hasNextPage: state.page < Math.ceil(state.total / state.limit),
    hasPrevPage: state.page > 1,
    startIndex: (state.page - 1) * state.limit + 1,
    endIndex: Math.min(state.page * state.limit, state.total),
  }),
  searchInfo: (state: GlobalPaginationSearchStore) => ({
    query: state.query,
    filters: state.filters,
    isSearching: !!state.query || Object.keys(state.filters).length > 0,
    hasFilters: Object.keys(state.filters).length > 0,
    filterCount: Object.keys(state.filters).length,
  }),
}