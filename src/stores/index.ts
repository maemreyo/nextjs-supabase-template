// New modular stores
export { useAuthStore, authSelectors } from './auth_store'
export type { AuthStore, AuthState, AuthActions } from './auth_store'

export { useAnalysisStore, analysisSelectors, useAnalysisSelectors, useAnalysisActions } from './analysis_store'
export type {
  AnalysisStore,
  AnalysisState,
  AnalysisActions,
  WordAnalysisWithId,
  SentenceAnalysisWithId,
  ParagraphAnalysisWithId,
  PhraseAnalysisWithId
} from './analysis_store'

export { useThemePreferencesStore, themePreferencesSelectors } from './theme_preferences_store'
export type { ThemePreferencesStore, ThemePreferencesState, ThemePreferencesActions } from './theme_preferences_store'

export { useSidebarStateStore, sidebarStateSelectors } from './sidebar_state_store'
export type { SidebarStateStore, SidebarStateState, SidebarStateActions } from './sidebar_state_store'

export { useModalManagerStore, modalManagerSelectors } from './modal_manager_store'
export type { ModalManagerStore, ModalManagerState, ModalManagerActions } from './modal_manager_store'

export { useNotificationSystemStore, notificationSystemSelectors } from './notification_system_store'
export type { NotificationSystemStore, NotificationSystemState, NotificationSystemActions } from './notification_system_store'

export { useGlobalLoadingStore, globalLoadingSelectors } from './global_loading_store'
export type { GlobalLoadingStore, GlobalLoadingState, GlobalLoadingActions } from './global_loading_store'

export { useLayoutDimensionsStore, layoutDimensionsSelectors } from './layout_dimensions_store'
export type { LayoutDimensionsStore, LayoutDimensionsState, LayoutDimensionsActions } from './layout_dimensions_store'

export { useResponsiveBreakpointsStore, responsiveBreakpointsSelectors } from './responsive_breakpoints_store'
export type { ResponsiveBreakpointsStore, ResponsiveBreakpointsState, ResponsiveBreakpointsActions } from './responsive_breakpoints_store'

export { useKeyboardShortcutsStore, keyboardShortcutsSelectors } from './keyboard_shortcuts_store'
export type { KeyboardShortcutsStore, KeyboardShortcutsState, KeyboardShortcutsActions } from './keyboard_shortcuts_store'

// Legacy stores (to be removed after migration)
// Note: These stores have been migrated to hooks/stores/ and are no longer available

// Re-export types for convenience
export type { Notification } from './notification_system_store'
export type { Theme as ThemeType } from './theme_preferences_store'