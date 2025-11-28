import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// Sidebar State interface
export interface SidebarStateState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
}

// Sidebar State Actions interface
export interface SidebarStateActions {
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  resetSidebarState: () => void
}

// Combined Sidebar State store type
export type SidebarStateStore = SidebarStateState & SidebarStateActions

// Initial state
const initialState: SidebarStateState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
}

// Sidebar State store implementation
export const createSidebarStateStore = () =>
  create<SidebarStateStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // Sidebar actions
            setSidebarOpen: (sidebarOpen) => {
              set({ sidebarOpen }, false, 'setSidebarOpen')
            },

            setSidebarCollapsed: (sidebarCollapsed) => {
              set({ sidebarCollapsed }, false, 'setSidebarCollapsed')
            },

            toggleSidebar: () => {
              const { sidebarOpen } = get()
              set({ sidebarOpen: !sidebarOpen }, false, 'toggleSidebar')
            },

            resetSidebarState: () => {
              set(initialState, false, 'resetSidebarState')
            },
          }),
          {
            name: 'sidebar-state-storage',
            version: 1,
          }
        ),
        {
          name: 'sidebar-state-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useSidebarStateStore = createSidebarStateStore()

// Selectors
export const sidebarStateSelectors = {
  sidebarOpen: (state: SidebarStateStore) => state.sidebarOpen,
  sidebarCollapsed: (state: SidebarStateStore) => state.sidebarCollapsed,
  isSidebarOpenAndNotCollapsed: (state: SidebarStateStore) => 
    state.sidebarOpen && !state.sidebarCollapsed,
}