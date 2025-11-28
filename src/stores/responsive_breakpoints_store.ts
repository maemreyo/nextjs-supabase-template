import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Responsive Breakpoints State interface
export interface ResponsiveBreakpointsState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
}

// Responsive Breakpoints Actions interface
export interface ResponsiveBreakpointsActions {
  setResponsive: (updates: Partial<Pick<ResponsiveBreakpointsState, 'isMobile' | 'isTablet' | 'isDesktop'>>) => void
  updateScreenSize: (width: number, height: number) => void
  setBreakpoints: (breakpoints: Partial<ResponsiveBreakpointsState['breakpoints']>) => void
  resetResponsiveBreakpoints: () => void
}

// Combined Responsive Breakpoints store type
export type ResponsiveBreakpointsStore = ResponsiveBreakpointsState & ResponsiveBreakpointsActions

// Initial state
const initialState: ResponsiveBreakpointsState = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenWidth: 1920,
  screenHeight: 1080,
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
  },
}

// Responsive Breakpoints store implementation
export const createResponsiveBreakpointsStore = () =>
  create<ResponsiveBreakpointsStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Responsive actions
          setResponsive: (updates) => {
            set((state) => ({ ...state, ...updates }), false, 'setResponsive')
          },

          updateScreenSize: (screenWidth, screenHeight) => {
            const { breakpoints } = get()
            const isMobile = screenWidth < breakpoints.mobile
            const isTablet = screenWidth >= breakpoints.mobile && screenWidth < breakpoints.desktop
            const isDesktop = screenWidth >= breakpoints.desktop
            
            set(
              (state) => ({
                ...state,
                screenWidth,
                screenHeight,
                isMobile,
                isTablet,
                isDesktop,
              }),
              false,
              'updateScreenSize'
            )
          },

          setBreakpoints: (breakpoints) => {
            set(
              (state) => ({
                breakpoints: {
                  ...state.breakpoints,
                  ...breakpoints,
                },
              }),
              false,
              'setBreakpoints'
            )
          },

          resetResponsiveBreakpoints: () => {
            set(initialState, false, 'resetResponsiveBreakpoints')
          },
        }),
        {
          name: 'responsive-breakpoints-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useResponsiveBreakpointsStore = createResponsiveBreakpointsStore()

// Selectors
export const responsiveBreakpointsSelectors = {
  isMobile: (state: ResponsiveBreakpointsStore) => state.isMobile,
  isTablet: (state: ResponsiveBreakpointsStore) => state.isTablet,
  isDesktop: (state: ResponsiveBreakpointsStore) => state.isDesktop,
  screenWidth: (state: ResponsiveBreakpointsStore) => state.screenWidth,
  screenHeight: (state: ResponsiveBreakpointsStore) => state.screenHeight,
  breakpoints: (state: ResponsiveBreakpointsStore) => state.breakpoints,
  mobileBreakpoint: (state: ResponsiveBreakpointsStore) => state.breakpoints.mobile,
  tabletBreakpoint: (state: ResponsiveBreakpointsStore) => state.breakpoints.tablet,
  desktopBreakpoint: (state: ResponsiveBreakpointsStore) => state.breakpoints.desktop,
  isMobileOrTablet: (state: ResponsiveBreakpointsStore) => state.isMobile || state.isTablet,
  isTabletOrDesktop: (state: ResponsiveBreakpointsStore) => state.isTablet || state.isDesktop,
  screenSize: (state: ResponsiveBreakpointsStore) => ({
    width: state.screenWidth,
    height: state.screenHeight,
  }),
  aspectRatio: (state: ResponsiveBreakpointsStore) => state.screenWidth / state.screenHeight,
  isLandscape: (state: ResponsiveBreakpointsStore) => state.screenWidth > state.screenHeight,
  isPortrait: (state: ResponsiveBreakpointsStore) => state.screenHeight > state.screenWidth,
}