import { useCallback, useEffect } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui-store'

// UI hook with optimized selectors
export function useUI() {
  return useUIStore(
    useCallback(
      (state) => ({
        // Theme
        theme: uiSelectors.theme(state),
        systemTheme: uiSelectors.systemTheme(state),
        effectiveTheme: uiSelectors.effectiveTheme(state),
        isDarkMode: uiSelectors.isDarkMode(state),
        
        // Sidebar
        sidebarOpen: uiSelectors.sidebarOpen(state),
        sidebarCollapsed: uiSelectors.sidebarCollapsed(state),
        sidebarWidth: uiSelectors.sidebarWidth(state),
        
        // Modals
        isModalOpen: uiSelectors.isModalOpen.bind(null, state),
        getModalData: uiSelectors.getModalData.bind(null, state),
        anyModalOpen: uiSelectors.anyModalOpen(state),
        
        // Notifications
        notifications: uiSelectors.notifications(state),
        notificationCount: uiSelectors.notificationCount(state),
        hasNotifications: uiSelectors.hasNotifications(state),
        
        // Loading
        globalLoading: uiSelectors.globalLoading(state),
        loadingMessage: uiSelectors.loadingMessage(state),
        
        // Layout
        layout: uiSelectors.layout(state),
        headerHeight: uiSelectors.headerHeight(state),
        
        // Responsive
        isMobile: uiSelectors.isMobile(state),
        isTablet: uiSelectors.isTablet(state),
        isDesktop: uiSelectors.isDesktop(state),
        isMobileOrTablet: uiSelectors.isMobileOrTablet(state),
        
        // Focus
        focusedElement: uiSelectors.focusedElement(state),
        hasFocus: uiSelectors.hasFocus(state),
        
        // Keyboard shortcuts
        keyboardShortcutsEnabled: uiSelectors.keyboardShortcutsEnabled(state),
        keyboardShortcutsHelpOpen: uiSelectors.keyboardShortcutsHelpOpen(state),
        
        // Actions
        setTheme: state.setTheme,
        setSystemTheme: state.setSystemTheme,
        toggleTheme: state.toggleTheme,
        
        setSidebarOpen: state.setSidebarOpen,
        setSidebarCollapsed: state.setSidebarCollapsed,
        toggleSidebar: state.toggleSidebar,
        
        openModal: state.openModal,
        closeModal: state.closeModal,
        closeAllModals: state.closeAllModals,
        toggleModal: state.toggleModal,
        
        addNotification: state.addNotification,
        removeNotification: state.removeNotification,
        clearNotifications: state.clearNotifications,
        
        setGlobalLoading: state.setGlobalLoading,
        
        updateLayout: state.updateLayout,
        
        setResponsive: state.setResponsive,
        
        setFocusedElement: state.setFocusedElement,
        clearFocus: state.clearFocus,
        
        setKeyboardShortcutsEnabled: state.setKeyboardShortcutsEnabled,
        toggleKeyboardShortcuts: state.toggleKeyboardShortcuts,
        setKeyboardShortcutsHelp: state.setKeyboardShortcutsHelp,
        
        resetUI: state.resetUI,
      }),
      []
    )
  )
}

// Simplified UI hooks for specific use cases
export function useTheme() {
  return useUIStore(
    useCallback(
      (state) => ({
        theme: uiSelectors.theme(state),
        systemTheme: uiSelectors.systemTheme(state),
        effectiveTheme: uiSelectors.effectiveTheme(state),
        isDarkMode: uiSelectors.isDarkMode(state),
        setTheme: state.setTheme,
        setSystemTheme: state.setSystemTheme,
        toggleTheme: state.toggleTheme,
      }),
      []
    )
  )
}

export function useSidebar() {
  return useUIStore(
    useCallback(
      (state) => ({
        open: uiSelectors.sidebarOpen(state),
        collapsed: uiSelectors.sidebarCollapsed(state),
        width: uiSelectors.sidebarWidth(state),
        setOpen: state.setSidebarOpen,
        setCollapsed: state.setSidebarCollapsed,
        toggle: state.toggleSidebar,
      }),
      []
    )
  )
}

export function useModals() {
  return useUIStore(
    useCallback(
      (state) => ({
        modals: state.modals,
        isModalOpen: (modalId: string) => uiSelectors.isModalOpen(state, modalId),
        getModalData: (modalId: string) => uiSelectors.getModalData(state, modalId),
        anyModalOpen: uiSelectors.anyModalOpen(state),
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
  return useUIStore(
    useCallback(
      (state) => ({
        notifications: uiSelectors.notifications(state),
        notificationCount: uiSelectors.notificationCount(state),
        hasNotifications: uiSelectors.hasNotifications(state),
        addNotification: state.addNotification,
        removeNotification: state.removeNotification,
        clearNotifications: state.clearNotifications,
      }),
      []
    )
  )
}

export function useResponsive() {
  return useUIStore(
    useCallback(
      (state) => ({
        isMobile: uiSelectors.isMobile(state),
        isTablet: uiSelectors.isTablet(state),
        isDesktop: uiSelectors.isDesktop(state),
        isMobileOrTablet: uiSelectors.isMobileOrTablet(state),
        setResponsive: state.setResponsive,
      }),
      []
    )
  )
}

export function useKeyboardShortcuts() {
  return useUIStore(
    useCallback(
      (state) => ({
        enabled: uiSelectors.keyboardShortcutsEnabled(state),
        helpOpen: uiSelectors.keyboardShortcutsHelpOpen(state),
        setEnabled: state.setKeyboardShortcutsEnabled,
        toggle: state.toggleKeyboardShortcuts,
        setHelpOpen: state.setKeyboardShortcutsHelp,
      }),
      []
    )
  )
}

// Hook for modal management
export function useModal(modalId: string) {
  return useUIStore(
    useCallback(
      (state) => ({
        isOpen: uiSelectors.isModalOpen(state, modalId),
        data: uiSelectors.getModalData(state, modalId),
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
  const { setSystemTheme } = useTheme()
  
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
  const { setResponsive } = useResponsive()
  
  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth
      setResponsive({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }
    
    // Set initial values
    updateResponsive()
    
    // Listen for resize
    window.addEventListener('resize', updateResponsive)
    
    return () => {
      window.removeEventListener('resize', updateResponsive)
    }
  }, [setResponsive])
}

// Hook for notification auto-dismissal
export function useNotificationManager() {
  const { notifications, removeNotification } = useNotifications()
  
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    notifications.forEach((notification) => {
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
  const { enabled, helpOpen, setHelpOpen } = useKeyboardShortcuts()
  
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Help shortcut (Ctrl/Cmd + ?)
      if ((event.ctrlKey || event.metaKey) && event.key === '?') {
        event.preventDefault()
        setHelpOpen(!helpOpen)
      }
      
      // Escape to close help
      if (event.key === 'Escape' && helpOpen) {
        setHelpOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, helpOpen, setHelpOpen])
}

// Hook for focus management
export function useFocusManager() {
  const { focusedElement, setFocusedElement, clearFocus } = useUI()
  
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && target.id) {
        setFocusedElement(target.id)
      }
    }
    
    const handleFocusOut = () => {
      clearFocus()
    }
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [setFocusedElement, clearFocus])
}

// Hook for sidebar auto-collapse on mobile
export function useSidebarResponsive() {
  const { open, setOpen, collapsed, setCollapsed } = useSidebar()
  const { isMobile } = useResponsive()
  
  useEffect(() => {
    if (isMobile && open) {
      setOpen(false)
    }
  }, [isMobile, open, setOpen])
  
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true)
    }
  }, [isMobile, collapsed, setCollapsed])
}