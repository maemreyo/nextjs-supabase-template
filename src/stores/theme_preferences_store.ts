import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Theme Preferences State interface
export interface ThemePreferencesState {
  theme: Theme
  systemTheme: 'light' | 'dark'
}

// Theme Preferences Actions interface
export interface ThemePreferencesActions {
  setTheme: (theme: Theme) => void
  setSystemTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  resetThemePreferences: () => void
}

// Combined Theme Preferences store type
export type ThemePreferencesStore = ThemePreferencesState & ThemePreferencesActions

// Initial state
const initialState: ThemePreferencesState = {
  theme: 'system',
  systemTheme: 'light',
}

// Theme Preferences store implementation
export const createThemePreferencesStore = () =>
  create<ThemePreferencesStore>()(
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

            resetThemePreferences: () => {
              set(initialState, false, 'resetThemePreferences')
            },
          }),
          {
            name: 'theme-preferences-storage',
            version: 1,
          }
        ),
        {
          name: 'theme-preferences-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useThemePreferencesStore = createThemePreferencesStore()

// Selectors
export const themePreferencesSelectors = {
  theme: (state: ThemePreferencesStore) => state.theme,
  systemTheme: (state: ThemePreferencesStore) => state.systemTheme,
  effectiveTheme: (state: ThemePreferencesStore) => {
    if (state.theme === 'system') {
      return state.systemTheme
    }
    return state.theme
  },
  isDarkMode: (state: ThemePreferencesStore) => {
    if (state.theme === 'system') {
      return state.systemTheme === 'dark'
    }
    return state.theme === 'dark'
  },
}