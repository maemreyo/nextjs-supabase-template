import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// App Metadata State interface
export interface AppMetadataState {
  version: string
  buildNumber: string
  environment: 'development' | 'staging' | 'production'
}

// App Metadata Actions interface
export interface AppMetadataActions {
  setVersion: (version: string) => void
  setBuildNumber: (buildNumber: string) => void
  setEnvironment: (environment: AppMetadataState['environment']) => void
  resetAppMetadata: () => void
}

// Combined App Metadata store type
export type AppMetadataStore = AppMetadataState & AppMetadataActions

// Initial state
const initialState: AppMetadataState = {
  version: '1.0.0',
  buildNumber: '20240101',
  environment: 'development',
}

// App Metadata store implementation
export const createAppMetadataStore = () =>
  create<AppMetadataStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // App metadata actions
            setVersion: (version) => {
              set({ version }, false, 'setVersion')
            },

            setBuildNumber: (buildNumber) => {
              set({ buildNumber }, false, 'setBuildNumber')
            },

            setEnvironment: (environment) => {
              set({ environment }, false, 'setEnvironment')
            },

            resetAppMetadata: () => {
              set(initialState, false, 'resetAppMetadata')
            },
          }),
          {
            name: 'app-metadata-storage',
            version: 1,
          }
        ),
        {
          name: 'app-metadata-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useAppMetadataStore = createAppMetadataStore()

// Selectors
export const appMetadataSelectors = {
  version: (state: AppMetadataStore) => state.version,
  buildNumber: (state: AppMetadataStore) => state.buildNumber,
  environment: (state: AppMetadataStore) => state.environment,
  isProduction: (state: AppMetadataStore) => state.environment === 'production',
  isDevelopment: (state: AppMetadataStore) => state.environment === 'development',
  isStaging: (state: AppMetadataStore) => state.environment === 'staging',
  versionInfo: (state: AppMetadataStore) => ({
    version: state.version,
    buildNumber: state.buildNumber,
    environment: state.environment,
  }),
}