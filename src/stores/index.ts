// Store exports
export { useAuthStore, authSelectors } from './auth-store'
export type { AuthStore, AuthState, AuthActions } from './auth-store'

export { useUIStore, uiSelectors } from './ui-store'
export type { UIStore, UIState, UIActions } from './ui-store'

export { useAppStore, appSelectors } from './app-store'
export type { AppStore, AppState, AppActions } from './app-store'

export { useExampleFeatureStore, exampleFeatureSelectors } from './example-feature-store'
export type { ExampleFeatureStore, ExampleFeatureState, ExampleFeatureActions } from './example-feature-store'

// Re-export types for convenience
export type { Theme, ModalState } from './ui-store'
export type { ExampleItem, ExampleFilter } from './example-feature-store'