import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Focus Management State interface
export interface FocusManagementState {
  focusedElement: string | null
  focusHistory: string[]
  trapFocus: boolean
  focusableElements: string[]
}

// Focus Management Actions interface
export interface FocusManagementActions {
  setFocusedElement: (element: string | null) => void
  clearFocus: () => void
  addToFocusHistory: (element: string) => void
  removeFromFocusHistory: (element: string) => void
  setFocusTrap: (enabled: boolean) => void
  setFocusableElements: (elements: string[]) => void
  addFocusableElement: (element: string) => void
  removeFocusableElement: (element: string) => void
  resetFocusManagement: () => void
}

// Combined Focus Management store type
export type FocusManagementStore = FocusManagementState & FocusManagementActions

// Initial state
const initialState: FocusManagementState = {
  focusedElement: null,
  focusHistory: [],
  trapFocus: false,
  focusableElements: [],
}

// Focus Management store implementation
export const createFocusManagementStore = () =>
  create<FocusManagementStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Focus actions
          setFocusedElement: (focusedElement) => {
            set(
              (state) => {
                const newHistory = focusedElement 
                  ? [...state.focusHistory.filter(el => el !== focusedElement), focusedElement].slice(-10)
                  : state.focusHistory
                
                return {
                  focusedElement,
                  focusHistory: newHistory,
                }
              },
              false,
              'setFocusedElement'
            )
          },

          clearFocus: () => {
            set({ focusedElement: null }, false, 'clearFocus')
          },

          addToFocusHistory: (element) => {
            set(
              (state) => ({
                focusHistory: [...state.focusHistory.filter(el => el !== element), element].slice(-10),
              }),
              false,
              'addToFocusHistory'
            )
          },

          removeFromFocusHistory: (element) => {
            set(
              (state) => ({
                focusHistory: state.focusHistory.filter(el => el !== element),
              }),
              false,
              'removeFromFocusHistory'
            )
          },

          setFocusTrap: (trapFocus) => {
            set({ trapFocus }, false, 'setFocusTrap')
          },

          setFocusableElements: (focusableElements) => {
            set({ focusableElements }, false, 'setFocusableElements')
          },

          addFocusableElement: (element) => {
            set(
              (state) => ({
                focusableElements: [...state.focusableElements.filter(el => el !== element), element],
              }),
              false,
              'addFocusableElement'
            )
          },

          removeFocusableElement: (element) => {
            set(
              (state) => ({
                focusableElements: state.focusableElements.filter(el => el !== element),
              }),
              false,
              'removeFocusableElement'
            )
          },

          resetFocusManagement: () => {
            set(initialState, false, 'resetFocusManagement')
          },
        }),
        {
          name: 'focus-management-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useFocusManagementStore = createFocusManagementStore()

// Selectors
export const focusManagementSelectors = {
  focusedElement: (state: FocusManagementStore) => state.focusedElement,
  hasFocus: (state: FocusManagementStore) => !!state.focusedElement,
  focusHistory: (state: FocusManagementStore) => state.focusHistory,
  lastFocusedElement: (state: FocusManagementStore) => state.focusHistory[state.focusHistory.length - 1] || null,
  previousFocusedElement: (state: FocusManagementStore) => state.focusHistory[state.focusHistory.length - 2] || null,
  trapFocus: (state: FocusManagementStore) => state.trapFocus,
  focusableElements: (state: FocusManagementStore) => state.focusableElements,
  focusableElementCount: (state: FocusManagementStore) => state.focusableElements.length,
  hasFocusableElements: (state: FocusManagementStore) => state.focusableElements.length > 0,
  isElementFocused: (state: FocusManagementStore, element: string) => state.focusedElement === element,
  isElementFocusable: (state: FocusManagementStore, element: string) => state.focusableElements.includes(element),
  isInFocusHistory: (state: FocusManagementStore, element: string) => state.focusHistory.includes(element),
}