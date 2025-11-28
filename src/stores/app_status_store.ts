import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// App Status State interface
export interface AppStatusState {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'none' | 'unknown'
  lastSyncAt: string | null
}

// App Status Actions interface
export interface AppStatusActions {
  setOnlineStatus: (isOnline: boolean) => void
  setConnectionType: (type: AppStatusState['connectionType']) => void
  updateLastSync: () => void
  setLastSyncAt: (timestamp: string | null) => void
  clearLastSync: () => void
  resetAppStatus: () => void
}

// Combined App Status store type
export type AppStatusStore = AppStatusState & AppStatusActions

// Initial state
const initialState: AppStatusState = {
  isOnline: true,
  connectionType: 'unknown',
  lastSyncAt: null,
}

// App Status store implementation
export const createAppStatusStore = () =>
  create<AppStatusStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Status actions
          setOnlineStatus: (isOnline) => {
            set({ isOnline }, false, 'setOnlineStatus')
          },

          setConnectionType: (connectionType) => {
            set({ connectionType }, false, 'setConnectionType')
          },

          updateLastSync: () => {
            set({ lastSyncAt: new Date().toISOString() }, false, 'updateLastSync')
          },

          setLastSyncAt: (lastSyncAt) => {
            set({ lastSyncAt }, false, 'setLastSyncAt')
          },

          clearLastSync: () => {
            set({ lastSyncAt: null }, false, 'clearLastSync')
          },

          resetAppStatus: () => {
            set(initialState, false, 'resetAppStatus')
          },
        }),
        {
          name: 'app-status-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useAppStatusStore = createAppStatusStore()

// Selectors
export const appStatusSelectors = {
  isOnline: (state: AppStatusStore) => state.isOnline,
  isOffline: (state: AppStatusStore) => !state.isOnline,
  connectionType: (state: AppStatusStore) => state.connectionType,
  lastSyncAt: (state: AppStatusStore) => state.lastSyncAt,
  hasLastSync: (state: AppStatusStore) => !!state.lastSyncAt,
  needsSync: (state: AppStatusStore) => {
    if (!state.lastSyncAt) return true
    const lastSync = new Date(state.lastSyncAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
    return diffMinutes > 5 // Sync if more than 5 minutes ago
  },
  isWifiConnection: (state: AppStatusStore) => state.connectionType === 'wifi',
  isCellularConnection: (state: AppStatusStore) => state.connectionType === 'cellular',
  isEthernetConnection: (state: AppStatusStore) => state.connectionType === 'ethernet',
  isBluetoothConnection: (state: AppStatusStore) => state.connectionType === 'bluetooth',
  hasConnection: (state: AppStatusStore) => state.connectionType !== 'none' && state.connectionType !== 'unknown',
  connectionQuality: (state: AppStatusStore) => {
    switch (state.connectionType) {
      case 'wifi':
        return 'high'
      case 'ethernet':
        return 'high'
      case 'cellular':
        return 'medium'
      case 'bluetooth':
        return 'low'
      default:
        return 'unknown'
    }
  },
  syncStatus: (state: AppStatusStore) => {
    if (!state.lastSyncAt) return 'never'
    const lastSync = new Date(state.lastSyncAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60)
    
    if (diffMinutes < 1) return 'just-now'
    if (diffMinutes < 5) return 'recent'
    if (diffMinutes < 60) return 'soon'
    return 'outdated'
  },
}