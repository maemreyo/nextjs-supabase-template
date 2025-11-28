import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// Feature Flags State interface
export interface FeatureFlagsState {
  features: {
    newDashboard: boolean
    betaFeatures: boolean
    advancedAnalytics: boolean
    experimentalFeatures: boolean
  }
}

// Feature Flags Actions interface
export interface FeatureFlagsActions {
  setFeature: (feature: keyof FeatureFlagsState['features'], enabled: boolean) => void
  setFeatures: (features: Partial<FeatureFlagsState['features']>) => void
  enableFeature: (feature: keyof FeatureFlagsState['features']) => void
  disableFeature: (feature: keyof FeatureFlagsState['features']) => void
  toggleFeature: (feature: keyof FeatureFlagsState['features']) => void
  resetFeatures: () => void
  resetFeatureFlags: () => void
}

// Combined Feature Flags store type
export type FeatureFlagsStore = FeatureFlagsState & FeatureFlagsActions

// Initial state
const initialState: FeatureFlagsState = {
  features: {
    newDashboard: false,
    betaFeatures: false,
    advancedAnalytics: false,
    experimentalFeatures: false,
  },
}

// Feature Flags store implementation
export const createFeatureFlagsStore = () =>
  create<FeatureFlagsStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // Feature flag actions
            setFeature: (feature, enabled) => {
              set(
                (state) => ({
                  features: {
                    ...state.features,
                    [feature]: enabled,
                  },
                }),
                false,
                'setFeature'
              )
            },

            setFeatures: (features) => {
              set(
                (state) => ({
                  features: {
                    ...state.features,
                    ...features,
                  },
                }),
                false,
                'setFeatures'
              )
            },

            enableFeature: (feature) => {
              set(
                (state) => ({
                  features: {
                    ...state.features,
                    [feature]: true,
                  },
                }),
                false,
                'enableFeature'
              )
            },

            disableFeature: (feature) => {
              set(
                (state) => ({
                  features: {
                    ...state.features,
                    [feature]: false,
                  },
                }),
                false,
                'disableFeature'
              )
            },

            toggleFeature: (feature) => {
              set(
                (state) => ({
                  features: {
                    ...state.features,
                    [feature]: !state.features[feature],
                  },
                }),
                false,
                'toggleFeature'
              )
            },

            resetFeatures: () => {
              set({ features: initialState.features }, false, 'resetFeatures')
            },

            resetFeatureFlags: () => {
              set(initialState, false, 'resetFeatureFlags')
            },
          }),
          {
            name: 'feature-flags-storage',
            version: 1,
          }
        ),
        {
          name: 'feature-flags-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useFeatureFlagsStore = createFeatureFlagsStore()

// Selectors
export const featureFlagsSelectors = {
  features: (state: FeatureFlagsStore) => state.features,
  isFeatureEnabled: (state: FeatureFlagsStore, feature: keyof FeatureFlagsState['features']) => 
    state.features[feature],
  newDashboard: (state: FeatureFlagsStore) => state.features.newDashboard,
  betaFeatures: (state: FeatureFlagsStore) => state.features.betaFeatures,
  advancedAnalytics: (state: FeatureFlagsStore) => state.features.advancedAnalytics,
  experimentalFeatures: (state: FeatureFlagsStore) => state.features.experimentalFeatures,
  hasBetaAccess: (state: FeatureFlagsStore) => state.features.betaFeatures,
  enabledFeatures: (state: FeatureFlagsStore) => 
    Object.entries(state.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature as keyof FeatureFlagsState['features']),
  disabledFeatures: (state: FeatureFlagsStore) => 
    Object.entries(state.features)
      .filter(([_, enabled]) => !enabled)
      .map(([feature]) => feature as keyof FeatureFlagsState['features']),
  enabledFeatureCount: (state: FeatureFlagsStore) => 
    Object.values(state.features).filter(enabled => enabled).length,
  totalFeatureCount: (state: FeatureFlagsStore) => Object.keys(state.features).length,
  anyBetaFeatures: (state: FeatureFlagsStore) => 
    Object.values(state.features).some(enabled => enabled),
  allExperimentalEnabled: (state: FeatureFlagsStore) => 
    state.features.experimentalFeatures && state.features.betaFeatures,
}