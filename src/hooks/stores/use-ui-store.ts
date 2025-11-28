import { useCallback, useEffect } from 'react'
import {
  useThemePreferencesStore,
  themePreferencesSelectors,
  useSidebarStateStore,
  sidebarStateSelectors,
  useModalManagerStore,
  modalManagerSelectors,
  useNotificationSystemStore,
  notificationSystemSelectors,
  useGlobalLoadingStore,
  globalLoadingSelectors,
  useLayoutDimensionsStore,
  layoutDimensionsSelectors
} from '@/stores'
import type {
  ThemePreferencesStore,
  SidebarStateStore,
  ModalManagerStore,
  NotificationSystemStore,
  GlobalLoadingStore,
  LayoutDimensionsStore
} from '@/stores'

// UI hook with optimized selectors
export function useUI() {
  const themeState = useThemePreferencesStore(
    useCallback(
      (state: ThemePreferencesStore) => ({
        theme: themePreferencesSelectors.theme(state),
        systemTheme: themePreferencesSelectors.systemTheme(state),
        effectiveTheme: themePreferencesSelectors.effectiveTheme(state),
        isDarkMode: themePreferencesSelectors.isDarkMode(state),
        setTheme: state.setTheme,
        setSystemTheme: state.setSystemTheme,
        toggleTheme: state.toggleTheme,
      }),
      []
    )
  )

  const sidebarState = useSidebarStateStore(
    useCallback(
      (state: SidebarStateStore) => ({
        sidebarOpen: sidebarStateSelectors.sidebarOpen(state),
        sidebarCollapsed: sidebarStateSelectors.sidebarCollapsed(state),
        setSidebarOpen: state.setSidebarOpen,
        setSidebarCollapsed: state.setSidebarCollapsed,
        toggleSidebar: state.toggleSidebar,
        resetSidebarState: state.resetSidebarState,
      }),
      []
    )
  )

  const modalState = useModalManagerStore(
    useCallback(
      (state: ModalManagerStore) => ({
        modals: modalManagerSelectors.modals(state),
        isModalOpen: (modalId: string) => modalManagerSelectors.isModalOpen(state, modalId),
        getModalData: (modalId: string) => modalManagerSelectors.getModalData(state, modalId),
        anyModalOpen: modalManagerSelectors.anyModalOpen(state),
        openModal: state.openModal,
        closeModal: state.closeModal,
        closeAllModals: state.closeAllModals,
        toggleModal: state.toggleModal,
      }),
      []
    )
  )

  const notificationState = useNotificationSystemStore(
    useCallback(
      (state: NotificationSystemStore) => ({
        notifications: notificationSystemSelectors.notifications(state),
        notificationCount: notificationSystemSelectors.notificationCount(state),
        hasNotifications: notificationSystemSelectors.hasNotifications(state),
        addNotification: state.addNotification,
        removeNotification: state.removeNotification,
        clearNotifications: state.clearNotifications,
      }),
      []
    )
  )

  const loadingState = useGlobalLoadingStore(
    useCallback(
      (state: GlobalLoadingStore) => ({
        globalLoading: globalLoadingSelectors.globalLoading(state),
        loadingMessage: globalLoadingSelectors.loadingMessage(state),
        setGlobalLoading: state.setGlobalLoading,
      }),
      []
    )
  )

  const layoutState = useLayoutDimensionsStore(
    useCallback(
      (state: LayoutDimensionsStore) => ({
        layout: layoutDimensionsSelectors.layout(state),
        headerHeight: layoutDimensionsSelectors.headerHeight(state),
        sidebarWidth: layoutDimensionsSelectors.sidebarWidth(state),
        sidebarCollapsedWidth: layoutDimensionsSelectors.sidebarCollapsedWidth(state),
        updateLayout: state.updateLayout,
      }),
      []
    )
  )

  return {
    ...themeState,
    ...sidebarState,
    ...modalState,
    ...notificationState,
    ...loadingState,
    ...layoutState,
    
    // Computed properties
    sidebarWidth: sidebarState.sidebarOpen && !sidebarState.sidebarCollapsed
      ? layoutState.sidebarWidth
      : layoutState.sidebarCollapsedWidth,
    
    // Responsive and focus states (these would need to be added to separate stores)
    isMobile: false, // TODO: Add to responsive store
    isTablet: false, // TODO: Add to responsive store
    isDesktop: true, // TODO: Add to responsive store
    isMobileOrTablet: false, // TODO: Add to responsive store
    focusedElement: null, // TODO: Add to focus store
    hasFocus: false, // TODO: Add to focus store
    keyboardShortcutsEnabled: true, // TODO: Add to keyboard shortcuts store
    keyboardShortcutsHelpOpen: false, // TODO: Add to keyboard shortcuts store
    
    // Placeholder actions for features not yet modularized
    setResponsive: () => {}, // TODO: Add to responsive store
    setFocusedElement: () => {}, // TODO: Add to focus store
    clearFocus: () => {}, // TODO: Add to focus store
    setKeyboardShortcutsEnabled: () => {}, // TODO: Add to keyboard shortcuts store
    toggleKeyboardShortcuts: () => {}, // TODO: Add to keyboard shortcuts store
    setKeyboardShortcutsHelp: () => {}, // TODO: Add to keyboard shortcuts store
    resetUI: () => {}, // TODO: Implement reset across all stores
  }
}

// Simplified UI hooks for specific use cases
export function useTheme() {
  return useThemePreferencesStore(
    useCallback(
      (state) => ({
        theme: themePreferencesSelectors.theme(state),
        systemTheme: themePreferencesSelectors.systemTheme(state),
        effectiveTheme: themePreferencesSelectors.effectiveTheme(state),
        isDarkMode: themePreferencesSelectors.isDarkMode(state),
        setTheme: state.setTheme,
        setSystemTheme: state.setSystemTheme,
        toggleTheme: state.toggleTheme,
      }),
      []
    )
  )
}

export function useSidebar() {
  const sidebarState = useSidebarStateStore(
    useCallback(
      (state: SidebarStateStore) => ({
        open: sidebarStateSelectors.sidebarOpen(state),
        collapsed: sidebarStateSelectors.sidebarCollapsed(state),
        setOpen: state.setSidebarOpen,
        setCollapsed: state.setSidebarCollapsed,
        toggle: state.toggleSidebar,
      }),
      []
    )
  )

  const layoutState = useLayoutDimensionsStore(
    useCallback(
      (state: LayoutDimensionsStore) => ({
        sidebarWidth: layoutDimensionsSelectors.sidebarWidth(state),
        sidebarCollapsedWidth: layoutDimensionsSelectors.sidebarCollapsedWidth(state),
      }),
      []
    )
  )

  const sidebarOpen = sidebarState.open
  const sidebarCollapsed = sidebarState.collapsed

  return {
    ...sidebarState,
    width: sidebarOpen && !sidebarCollapsed
      ? layoutState.sidebarWidth
      : layoutState.sidebarCollapsedWidth,
  }
}

export function useModals() {
  return useModalManagerStore(
    useCallback(
      (state: ModalManagerStore) => ({
        modals: modalManagerSelectors.modals(state),
        isModalOpen: (modalId: string) => modalManagerSelectors.isModalOpen(state, modalId),
        getModalData: (modalId: string) => modalManagerSelectors.getModalData(state, modalId),
        anyModalOpen: modalManagerSelectors.anyModalOpen(state),
        openModal: state.openModal,
        closeModal: state.closeModal,
        closeAllModals: state.closeAllModals,
        toggleModal: state.toggleModal,
      }),
      []
    )
  )
}

export function useNotifications() {
  return useNotificationSystemStore(
    useCallback(
      (state: NotificationSystemStore) => ({
        notifications: notificationSystemSelectors.notifications(state),
        notificationCount: notificationSystemSelectors.notificationCount(state),
        hasNotifications: notificationSystemSelectors.hasNotifications(state),
        addNotification: state.addNotification,
        removeNotification: state.removeNotification,
        clearNotifications: state.clearNotifications,
      }),
      []
    )
  )
}

export function useResponsive() {
  // TODO: This needs to be implemented with a responsive store
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
    setResponsive: () => {},
  }
}

export function useKeyboardShortcuts() {
  // TODO: This needs to be implemented with a keyboard shortcuts store
  return {
    enabled: true,
    helpOpen: false,
    setEnabled: () => {},
    toggle: () => {},
    setHelpOpen: () => {},
  }
}

// Hook for modal management
export function useModal(modalId: string) {
  return useModalManagerStore(
    useCallback(
      (state: ModalManagerStore) => ({
        isOpen: modalManagerSelectors.isModalOpen(state, modalId),
        data: modalManagerSelectors.getModalData(state, modalId),
        open: (data?: any) => state.openModal(modalId, data),
        close: () => state.closeModal(modalId),
        toggle: (data?: any) => state.toggleModal(modalId, data),
      }),
      [modalId]
    )
  )
}

// Hook for theme detection and system theme
export function useSystemTheme() {
  // Use direct store access to avoid function recreation issues
  const setSystemTheme = useThemePreferencesStore(state => state.setSystemTheme)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    // Set initial theme
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [setSystemTheme])
}

// Hook for responsive detection
export function useResponsiveDetection() {
  // TODO: This needs to be implemented with a responsive store
  useEffect(() => {
    // Placeholder implementation
    console.log('useResponsiveDetection: TODO - implement with responsive store')
  }, [])
}

// Hook for notification auto-dismissal
export function useNotificationManager() {
  const notifications = useNotificationSystemStore(state => notificationSystemSelectors.notifications(state))
  // Use direct store access to avoid function recreation issues
  const removeNotification = useNotificationSystemStore(state => state.removeNotification)
  
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    notifications.forEach((notification: any) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          removeNotification(notification.id)
        }, notification.duration)
        
        timers.push(timer)
      }
    })
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [notifications, removeNotification])
}

// Hook for keyboard shortcuts
export function useKeyboardShortcutManager() {
  // TODO: This needs to be implemented with a keyboard shortcuts store
  useEffect(() => {
    // Placeholder implementation
    console.log('useKeyboardShortcutManager: TODO - implement with keyboard shortcuts store')
  }, [])
}

// Hook for focus management
export function useFocusManager() {
  // TODO: This needs to be implemented with a focus store
  useEffect(() => {
    // Placeholder implementation
    console.log('useFocusManager: TODO - implement with focus store')
  }, [])
}

// Hook for sidebar auto-collapse on mobile
export function useSidebarResponsive() {
  const open = useSidebarStateStore(state => sidebarStateSelectors.sidebarOpen(state))
  const collapsed = useSidebarStateStore(state => sidebarStateSelectors.sidebarCollapsed(state))
  const isMobile = false // TODO: Get from responsive store
  // Use direct store access to avoid function recreation issues
  const setOpen = useSidebarStateStore(state => state.setSidebarOpen)
  const setCollapsed = useSidebarStateStore(state => state.setSidebarCollapsed)
  
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false)
    }
  }, [isMobile, open]) // Remove setOpen from deps to prevent infinite loop
  
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true)
    }
  }, [isMobile, collapsed]) // Remove setCollapsed from deps to prevent infinite loop
}