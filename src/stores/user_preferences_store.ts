import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// User Preferences State interface
export interface UserPreferencesState {
  preferences: {
    language: string
    timezone: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    currency: string
    notifications: {
      email: boolean
      push: boolean
      inApp: boolean
    }
  }
}

// User Preferences Actions interface
export interface UserPreferencesActions {
  setPreference: <K extends keyof UserPreferencesState['preferences']>(
    key: K,
    value: UserPreferencesState['preferences'][K]
  ) => void
  setPreferences: (preferences: Partial<UserPreferencesState['preferences']>) => void
  setLanguage: (language: string) => void
  setTimezone: (timezone: string) => void
  setDateFormat: (dateFormat: string) => void
  setTimeFormat: (timeFormat: '12h' | '24h') => void
  setCurrency: (currency: string) => void
  setNotifications: (notifications: Partial<UserPreferencesState['preferences']['notifications']>) => void
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void
  setInAppNotifications: (enabled: boolean) => void
  resetPreferences: () => void
  resetUserPreferences: () => void
}

// Combined User Preferences store type
export type UserPreferencesStore = UserPreferencesState & UserPreferencesActions

// Initial state
const initialState: UserPreferencesState = {
  preferences: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
  },
}

// User Preferences store implementation
export const createUserPreferencesStore = () =>
  create<UserPreferencesStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // Preference actions
            setPreference: (key, value) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    [key]: value,
                  },
                }),
                false,
                'setPreference'
              )
            },

            setPreferences: (preferences) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    ...preferences,
                  },
                }),
                false,
                'setPreferences'
              )
            },

            setLanguage: (language) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    language,
                  },
                }),
                false,
                'setLanguage'
              )
            },

            setTimezone: (timezone) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    timezone,
                  },
                }),
                false,
                'setTimezone'
              )
            },

            setDateFormat: (dateFormat) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    dateFormat,
                  },
                }),
                false,
                'setDateFormat'
              )
            },

            setTimeFormat: (timeFormat) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    timeFormat,
                  },
                }),
                false,
                'setTimeFormat'
              )
            },

            setCurrency: (currency) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    currency,
                  },
                }),
                false,
                'setCurrency'
              )
            },

            setNotifications: (notifications) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    notifications: {
                      ...state.preferences.notifications,
                      ...notifications,
                    },
                  },
                }),
                false,
                'setNotifications'
              )
            },

            setEmailNotifications: (email) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    notifications: {
                      ...state.preferences.notifications,
                      email,
                    },
                  },
                }),
                false,
                'setEmailNotifications'
              )
            },

            setPushNotifications: (push) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    notifications: {
                      ...state.preferences.notifications,
                      push,
                    },
                  },
                }),
                false,
                'setPushNotifications'
              )
            },

            setInAppNotifications: (inApp) => {
              set(
                (state) => ({
                  preferences: {
                    ...state.preferences,
                    notifications: {
                      ...state.preferences.notifications,
                      inApp,
                    },
                  },
                }),
                false,
                'setInAppNotifications'
              )
            },

            resetPreferences: () => {
              set({ preferences: initialState.preferences }, false, 'resetPreferences')
            },

            resetUserPreferences: () => {
              set(initialState, false, 'resetUserPreferences')
            },
          }),
          {
            name: 'user-preferences-storage',
            version: 1,
          }
        ),
        {
          name: 'user-preferences-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useUserPreferencesStore = createUserPreferencesStore()

// Selectors
export const userPreferencesSelectors = {
  preferences: (state: UserPreferencesStore) => state.preferences,
  language: (state: UserPreferencesStore) => state.preferences.language,
  timezone: (state: UserPreferencesStore) => state.preferences.timezone,
  dateFormat: (state: UserPreferencesStore) => state.preferences.dateFormat,
  timeFormat: (state: UserPreferencesStore) => state.preferences.timeFormat,
  currency: (state: UserPreferencesStore) => state.preferences.currency,
  notifications: (state: UserPreferencesStore) => state.preferences.notifications,
  emailNotifications: (state: UserPreferencesStore) => state.preferences.notifications.email,
  pushNotifications: (state: UserPreferencesStore) => state.preferences.notifications.push,
  inAppNotifications: (state: UserPreferencesStore) => state.preferences.notifications.inApp,
  anyNotificationsEnabled: (state: UserPreferencesStore) => 
    state.preferences.notifications.email || 
    state.preferences.notifications.push || 
    state.preferences.notifications.inApp,
  allNotificationsEnabled: (state: UserPreferencesStore) => 
    state.preferences.notifications.email && 
    state.preferences.notifications.push && 
    state.preferences.notifications.inApp,
  is24HourFormat: (state: UserPreferencesStore) => state.preferences.timeFormat === '24h',
  is12HourFormat: (state: UserPreferencesStore) => state.preferences.timeFormat === '12h',
}