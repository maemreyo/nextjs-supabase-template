import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// Layout Dimensions State interface
export interface LayoutDimensionsState {
  layout: {
    headerHeight: number
    sidebarWidth: number
    sidebarCollapsedWidth: number
  }
}

// Layout Dimensions Actions interface
export interface LayoutDimensionsActions {
  updateLayout: (updates: Partial<LayoutDimensionsState['layout']>) => void
  setHeaderHeight: (height: number) => void
  setSidebarWidth: (width: number) => void
  setSidebarCollapsedWidth: (width: number) => void
  resetLayoutDimensions: () => void
}

// Combined Layout Dimensions store type
export type LayoutDimensionsStore = LayoutDimensionsState & LayoutDimensionsActions

// Initial state
const initialState: LayoutDimensionsState = {
  layout: {
    headerHeight: 64,
    sidebarWidth: 280,
    sidebarCollapsedWidth: 80,
  },
}

// Layout Dimensions store implementation
export const createLayoutDimensionsStore = () =>
  create<LayoutDimensionsStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // Layout actions
            updateLayout: (updates) => {
              set(
                (state) => ({
                  layout: {
                    ...state.layout,
                    ...updates,
                  },
                }),
                false,
                'updateLayout'
              )
            },

            setHeaderHeight: (headerHeight) => {
              set(
                (state) => ({
                  layout: {
                    ...state.layout,
                    headerHeight,
                  },
                }),
                false,
                'setHeaderHeight'
              )
            },

            setSidebarWidth: (sidebarWidth) => {
              set(
                (state) => ({
                  layout: {
                    ...state.layout,
                    sidebarWidth,
                  },
                }),
                false,
                'setSidebarWidth'
              )
            },

            setSidebarCollapsedWidth: (sidebarCollapsedWidth) => {
              set(
                (state) => ({
                  layout: {
                    ...state.layout,
                    sidebarCollapsedWidth,
                  },
                }),
                false,
                'setSidebarCollapsedWidth'
              )
            },

            resetLayoutDimensions: () => {
              set(initialState, false, 'resetLayoutDimensions')
            },
          }),
          {
            name: 'layout-dimensions-storage',
            version: 1,
          }
        ),
        {
          name: 'layout-dimensions-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useLayoutDimensionsStore = createLayoutDimensionsStore()

// Selectors
export const layoutDimensionsSelectors = {
  layout: (state: LayoutDimensionsStore) => state.layout,
  headerHeight: (state: LayoutDimensionsStore) => state.layout.headerHeight,
  sidebarWidth: (state: LayoutDimensionsStore) => state.layout.sidebarWidth,
  sidebarCollapsedWidth: (state: LayoutDimensionsStore) => state.layout.sidebarCollapsedWidth,
  totalLayoutWidth: (state: LayoutDimensionsStore) => state.layout.sidebarWidth,
  collapsedLayoutWidth: (state: LayoutDimensionsStore) => state.layout.sidebarCollapsedWidth,
  layoutHeight: (state: LayoutDimensionsStore) => state.layout.headerHeight,
}