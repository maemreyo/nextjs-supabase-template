import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Global Loading State interface
export interface GlobalLoadingState {
  globalLoading: boolean
  loadingMessage?: string
}

// Global Loading Actions interface
export interface GlobalLoadingActions {
  setGlobalLoading: (loading: boolean, message?: string) => void
  showLoading: (message?: string) => void
  hideLoading: () => void
  resetGlobalLoading: () => void
}

// Combined Global Loading store type
export type GlobalLoadingStore = GlobalLoadingState & GlobalLoadingActions

// Initial state
const initialState: GlobalLoadingState = {
  globalLoading: false,
}

// Global Loading store implementation
export const createGlobalLoadingStore = () =>
  create<GlobalLoadingStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Loading actions
          setGlobalLoading: (globalLoading, loadingMessage) => {
            set({ globalLoading, loadingMessage }, false, 'setGlobalLoading')
          },

          showLoading: (loadingMessage) => {
            set({ globalLoading: true, loadingMessage }, false, 'showLoading')
          },

          hideLoading: () => {
            set({ globalLoading: false, loadingMessage: undefined }, false, 'hideLoading')
          },

          resetGlobalLoading: () => {
            set(initialState, false, 'resetGlobalLoading')
          },
        }),
        {
          name: 'global-loading-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useGlobalLoadingStore = createGlobalLoadingStore()

// Selectors
export const globalLoadingSelectors = {
  globalLoading: (state: GlobalLoadingStore) => state.globalLoading,
  loadingMessage: (state: GlobalLoadingStore) => state.loadingMessage,
  isLoading: (state: GlobalLoadingStore) => state.globalLoading,
  hasLoadingMessage: (state: GlobalLoadingStore) => !!state.loadingMessage,
}