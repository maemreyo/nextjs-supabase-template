import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'
import { createStore } from '@/lib/store'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Modal types
export interface ModalState {
  [key: string]: {
    isOpen: boolean
    data?: any
  }
}

// UI State interface
export interface UIState {
  // Theme
  theme: Theme
  systemTheme: 'light' | 'dark'
  
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Modals
  modals: ModalState
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
  }>
  
  // Loading states
  globalLoading: boolean
  loadingMessage?: string
  
  // Layout
  layout: {
    headerHeight: number
    sidebarWidth: number
    sidebarCollapsedWidth: number
  }
  
  // Responsive
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  
  // Focus management
  focusedElement: string | null
  
  // Keyboard shortcuts
  keyboardShortcuts: {
    enabled: boolean
    helpOpen: boolean
  }
}

// UI Actions interface
export interface UIActions {
  // Theme actions
  setTheme: (theme: Theme) => void
  setSystemTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  
  // Sidebar actions
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void
  closeModal: (modalId: string) => void
  closeAllModals: () => void
  toggleModal: (modalId: string, data?: any) => void
  
  // Notification actions
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void
  
  // Layout actions
  updateLayout: (updates: Partial<UIState['layout']>) => void
  
  // Responsive actions
  setResponsive: (updates: Partial<Pick<UIState, 'isMobile' | 'isTablet' | 'isDesktop'>>) => void
  
  // Focus actions
  setFocusedElement: (element: string | null) => void
  clearFocus: () => void
  
  // Keyboard shortcuts actions
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
  toggleKeyboardShortcuts: () => void
  setKeyboardShortcutsHelp: (open: boolean) => void
  
  // Reset actions
  resetUI: () => void
}

// Combined UI store type
export type UIStore = UIState & UIActions

// Initial state
const initialState: UIState = {
  theme: 'system',
  systemTheme: 'light',
  sidebarOpen: true,
  sidebarCollapsed: false,
  modals: {},
  notifications: [],
  globalLoading: false,
  layout: {
    headerHeight: 64,
    sidebarWidth: 280,
    sidebarCollapsedWidth: 80,
  },
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  focusedElement: null,
  keyboardShortcuts: {
    enabled: true,
    helpOpen: false,
  },
}

// UI store implementation
export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          // Theme actions
          setTheme: (theme) => {
            set({ theme }, false, 'setTheme')
          },

          setSystemTheme: (systemTheme) => {
            set({ systemTheme }, false, 'setSystemTheme')
          },

          toggleTheme: () => {
            const { theme } = get()
            const themes: Theme[] = ['light', 'dark', 'system']
            const currentIndex = themes.indexOf(theme)
            const nextTheme = themes[(currentIndex + 1) % themes.length]
            set({ theme: nextTheme }, false, 'toggleTheme')
          },

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

          // Modal actions
          openModal: (modalId, data) => {
            set(
              (state) => ({
                modals: {
                  ...state.modals,
                  [modalId]: {
                    isOpen: true,
                    data,
                  },
                },
              }),
              false,
              'openModal'
            )
          },

          closeModal: (modalId) => {
            set(
              (state) => ({
                modals: {
                  ...state.modals,
                  [modalId]: {
                    ...state.modals[modalId],
                    isOpen: false,
                    data: undefined,
                  },
                },
              }),
              false,
              'closeModal'
            )
          },

          closeAllModals: () => {
            set(
              (state) => ({
                modals: Object.keys(state.modals).reduce(
                  (acc, key) => ({
                    ...acc,
                    [key]: {
                      ...state.modals[key],
                      isOpen: false,
                      data: undefined,
                    },
                  }),
                  {}
                ),
              }),
              false,
              'closeAllModals'
            )
          },

          toggleModal: (modalId, data) => {
            const { modals } = get()
            const isOpen = modals[modalId]?.isOpen || false
            
            if (isOpen) {
              get().closeModal(modalId)
            } else {
              get().openModal(modalId, data)
            }
          },

          // Notification actions
          addNotification: (notification) => {
            const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const newNotification = { ...notification, id }
            
            set(
              (state) => ({
                notifications: [...state.notifications, newNotification],
              }),
              false,
              'addNotification'
            )

            // Auto-remove notification after duration
            if (notification.duration !== 0) {
              setTimeout(() => {
                get().removeNotification(id)
              }, notification.duration || 5000)
            }
          },

          removeNotification: (id) => {
            set(
              (state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
              }),
              false,
              'removeNotification'
            )
          },

          clearNotifications: () => {
            set({ notifications: [] }, false, 'clearNotifications')
          },

          // Loading actions
          setGlobalLoading: (globalLoading, loadingMessage) => {
            set({ globalLoading, loadingMessage }, false, 'setGlobalLoading')
          },

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

          // Responsive actions
          setResponsive: (updates) => {
            set((state) => ({ ...state, ...updates }), false, 'setResponsive')
          },

          // Focus actions
          setFocusedElement: (focusedElement) => {
            set({ focusedElement }, false, 'setFocusedElement')
          },

          clearFocus: () => {
            set({ focusedElement: null }, false, 'clearFocus')
          },

          // Keyboard shortcuts actions
          setKeyboardShortcutsEnabled: (enabled) => {
            set(
              (state) => ({
                keyboardShortcuts: {
                  ...state.keyboardShortcuts,
                  enabled,
                },
              }),
              false,
              'setKeyboardShortcutsEnabled'
            )
          },

          toggleKeyboardShortcuts: () => {
            set(
              (state) => ({
                keyboardShortcuts: {
                  ...state.keyboardShortcuts,
                  enabled: !state.keyboardShortcuts.enabled,
                },
              }),
              false,
              'toggleKeyboardShortcuts'
            )
          },

          setKeyboardShortcutsHelp: (helpOpen) => {
            set(
              (state) => ({
                keyboardShortcuts: {
                  ...state.keyboardShortcuts,
                  helpOpen,
                },
              }),
              false,
              'setKeyboardShortcutsHelp'
            )
          },

          // Reset actions
          resetUI: () => {
            set(initialState, false, 'resetUI')
          },
        }),
        {
          name: 'ui-storage',
          partialize: (state) => ({
            // Only persist UI preferences
            theme: state.theme,
            sidebarCollapsed: state.sidebarCollapsed,
            layout: state.layout,
            keyboardShortcuts: state.keyboardShortcuts,
          }),
          version: 1,
        }
      ),
      {
        name: 'ui-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)

// Selectors
export const uiSelectors = {
  // Theme selectors
  theme: (state: UIStore) => state.theme,
  systemTheme: (state: UIStore) => state.systemTheme,
  effectiveTheme: (state: UIStore) => {
    if (state.theme === 'system') {
      return state.systemTheme
    }
    return state.theme
  },
  isDarkMode: (state: UIStore) => {
    if (state.theme === 'system') {
      return state.systemTheme === 'dark'
    }
    return state.theme === 'dark'
  },

  // Sidebar selectors
  sidebarOpen: (state: UIStore) => state.sidebarOpen,
  sidebarCollapsed: (state: UIStore) => state.sidebarCollapsed,
  sidebarWidth: (state: UIStore) => 
    state.sidebarCollapsed ? state.layout.sidebarCollapsedWidth : state.layout.sidebarWidth,

  // Modal selectors
  isModalOpen: (state: UIStore, modalId: string) => 
    state.modals[modalId]?.isOpen || false,
  getModalData: (state: UIStore, modalId: string) => 
    state.modals[modalId]?.data,
  anyModalOpen: (state: UIStore) => 
    Object.values(state.modals).some(modal => modal.isOpen),

  // Notification selectors
  notifications: (state: UIStore) => state.notifications,
  notificationCount: (state: UIStore) => state.notifications.length,
  hasNotifications: (state: UIStore) => state.notifications.length > 0,

  // Loading selectors
  globalLoading: (state: UIStore) => state.globalLoading,
  loadingMessage: (state: UIStore) => state.loadingMessage,

  // Layout selectors
  layout: (state: UIStore) => state.layout,
  headerHeight: (state: UIStore) => state.layout.headerHeight,
  sidebarWidthValue: (state: UIStore) => state.layout.sidebarWidth,
  sidebarCollapsedWidthValue: (state: UIStore) => state.layout.sidebarCollapsedWidth,

  // Responsive selectors
  isMobile: (state: UIStore) => state.isMobile,
  isTablet: (state: UIStore) => state.isTablet,
  isDesktop: (state: UIStore) => state.isDesktop,
  isMobileOrTablet: (state: UIStore) => state.isMobile || state.isTablet,

  // Focus selectors
  focusedElement: (state: UIStore) => state.focusedElement,
  hasFocus: (state: UIStore) => !!state.focusedElement,

  // Keyboard shortcuts selectors
  keyboardShortcutsEnabled: (state: UIStore) => state.keyboardShortcuts.enabled,
  keyboardShortcutsHelpOpen: (state: UIStore) => state.keyboardShortcuts.helpOpen,
}