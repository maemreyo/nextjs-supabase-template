import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

// Keyboard shortcut types
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  enabled: boolean
}

// Keyboard Shortcuts State interface
export interface KeyboardShortcutsState {
  keyboardShortcuts: {
    enabled: boolean
    helpOpen: boolean
  }
  shortcuts: Record<string, KeyboardShortcut>
  pressedKeys: Set<string>
  isListening: boolean
}

// Keyboard Shortcuts Actions interface
export interface KeyboardShortcutsActions {
  setKeyboardShortcutsEnabled: (enabled: boolean) => void
  toggleKeyboardShortcuts: () => void
  setKeyboardShortcutsHelp: (open: boolean) => void
  toggleKeyboardShortcutsHelp: () => void
  registerShortcut: (id: string, shortcut: KeyboardShortcut) => void
  unregisterShortcut: (id: string) => void
  updateShortcut: (id: string, shortcut: Partial<KeyboardShortcut>) => void
  enableShortcut: (id: string) => void
  disableShortcut: (id: string) => void
  setListening: (listening: boolean) => void
  addPressedKey: (key: string) => void
  removePressedKey: (key: string) => void
  clearPressedKeys: () => void
  resetKeyboardShortcuts: () => void
}

// Combined Keyboard Shortcuts store type
export type KeyboardShortcutsStore = KeyboardShortcutsState & KeyboardShortcutsActions

// Initial state
const initialState: KeyboardShortcutsState = {
  keyboardShortcuts: {
    enabled: true,
    helpOpen: false,
  },
  shortcuts: {},
  pressedKeys: new Set(),
  isListening: true,
}

// Keyboard Shortcuts store implementation
export const createKeyboardShortcutsStore = () =>
  create<KeyboardShortcutsStore>()(
    subscribeWithSelector(
      devtools(
        persist(
          (set, get) => ({
            ...initialState,

            // Keyboard shortcuts actions
            setKeyboardShortcutsEnabled: (enabled) => {
              set(
                (state) => ({
                  keyboardShortcuts: {
                    ...state.keyboardShortcuts,
                    enabled,
                  },
                }),
                false,
                'setKeyboardShortcutsEnabled'
              )
            },

            toggleKeyboardShortcuts: () => {
              set(
                (state) => ({
                  keyboardShortcuts: {
                    ...state.keyboardShortcuts,
                    enabled: !state.keyboardShortcuts.enabled,
                  },
                }),
                false,
                'toggleKeyboardShortcuts'
              )
            },

            setKeyboardShortcutsHelp: (helpOpen) => {
              set(
                (state) => ({
                  keyboardShortcuts: {
                    ...state.keyboardShortcuts,
                    helpOpen,
                  },
                }),
                false,
                'setKeyboardShortcutsHelp'
              )
            },

            toggleKeyboardShortcutsHelp: () => {
              set(
                (state) => ({
                  keyboardShortcuts: {
                    ...state.keyboardShortcuts,
                    helpOpen: !state.keyboardShortcuts.helpOpen,
                  },
                }),
                false,
                'toggleKeyboardShortcutsHelp'
              )
            },

            registerShortcut: (id, shortcut) => {
              set(
                (state) => ({
                  shortcuts: {
                    ...state.shortcuts,
                    [id]: {
                      key: shortcut.key || '',
                      ctrlKey: shortcut.ctrlKey || false,
                      shiftKey: shortcut.shiftKey || false,
                      altKey: shortcut.altKey || false,
                      metaKey: shortcut.metaKey || false,
                      action: shortcut.action,
                      description: shortcut.description,
                      enabled: shortcut.enabled !== undefined ? shortcut.enabled : true,
                    },
                  },
                }),
                false,
                'registerShortcut'
              )
            },

            unregisterShortcut: (id) => {
              set(
                (state) => {
                  const newShortcuts = { ...state.shortcuts }
                  delete newShortcuts[id]
                  return { ...state, shortcuts: newShortcuts }
                },
                false,
                'unregisterShortcut'
              )
            },

            updateShortcut: (id, shortcut) => {
              set(
                (state) => {
                  const existingShortcut = state.shortcuts[id];
                  const updatedShortcut: KeyboardShortcut = {
                    key: shortcut.key ?? existingShortcut?.key ?? '',
                    ctrlKey: shortcut.ctrlKey ?? existingShortcut?.ctrlKey ?? false,
                    shiftKey: shortcut.shiftKey ?? existingShortcut?.shiftKey ?? false,
                    altKey: shortcut.altKey ?? existingShortcut?.altKey ?? false,
                    metaKey: shortcut.metaKey ?? existingShortcut?.metaKey ?? false,
                    action: shortcut.action ?? existingShortcut?.action ?? (() => {}),
                    description: shortcut.description ?? existingShortcut?.description ?? '',
                    enabled: shortcut.enabled ?? existingShortcut?.enabled ?? true,
                  };
                  
                  return {
                    ...state,
                    shortcuts: {
                      ...state.shortcuts,
                      [id]: updatedShortcut,
                    },
                  };
                },
                false,
                'updateShortcut'
              )
            },

            enableShortcut: (id) => {
              set(
                (state) => {
                  const existingShortcut = state.shortcuts[id];
                  if (!existingShortcut) return state;
                  
                  return {
                    ...state,
                    shortcuts: {
                      ...state.shortcuts,
                      [id]: {
                        ...existingShortcut,
                        enabled: true,
                      },
                    },
                  };
                },
                false,
                'enableShortcut'
              )
            },

            disableShortcut: (id) => {
              set(
                (state) => {
                  const existingShortcut = state.shortcuts[id];
                  if (!existingShortcut) return state;
                  
                  return {
                    ...state,
                    shortcuts: {
                      ...state.shortcuts,
                      [id]: {
                        ...existingShortcut,
                        enabled: false,
                      },
                    },
                  };
                },
                false,
                'disableShortcut'
              )
            },

            setListening: (isListening) => {
              set({ isListening }, false, 'setListening')
            },

            addPressedKey: (key) => {
              set(
                (state) => ({
                  pressedKeys: new Set([...state.pressedKeys, key]),
                }),
                false,
                'addPressedKey'
              )
            },

            removePressedKey: (key) => {
              set(
                (state) => {
                  const newPressedKeys = new Set(state.pressedKeys)
                  newPressedKeys.delete(key)
                  return { pressedKeys: newPressedKeys }
                },
                false,
                'removePressedKey'
              )
            },

            clearPressedKeys: () => {
              set({ pressedKeys: new Set() }, false, 'clearPressedKeys')
            },

            resetKeyboardShortcuts: () => {
              set(initialState, false, 'resetKeyboardShortcuts')
            },
          }),
          {
            name: 'keyboard-shortcuts-storage',
            partialize: (state) => ({
              keyboardShortcuts: state.keyboardShortcuts,
              shortcuts: state.shortcuts,
            }),
            version: 1,
          }
        ),
        {
          name: 'keyboard-shortcuts-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useKeyboardShortcutsStore = createKeyboardShortcutsStore()

// Selectors
export const keyboardShortcutsSelectors = {
  keyboardShortcutsEnabled: (state: KeyboardShortcutsStore) => state.keyboardShortcuts.enabled,
  keyboardShortcutsHelpOpen: (state: KeyboardShortcutsStore) => state.keyboardShortcuts.helpOpen,
  shortcuts: (state: KeyboardShortcutsStore) => state.shortcuts,
  enabledShortcuts: (state: KeyboardShortcutsStore) => 
    Object.entries(state.shortcuts).filter(([_, shortcut]) => shortcut.enabled),
  disabledShortcuts: (state: KeyboardShortcutsStore) => 
    Object.entries(state.shortcuts).filter(([_, shortcut]) => !shortcut.enabled),
  shortcutCount: (state: KeyboardShortcutsStore) => Object.keys(state.shortcuts).length,
  enabledShortcutCount: (state: KeyboardShortcutsStore) => 
    Object.values(state.shortcuts).filter(shortcut => shortcut.enabled).length,
  pressedKeys: (state: KeyboardShortcutsStore) => state.pressedKeys,
  isKeyPressed: (state: KeyboardShortcutsStore, key: string) => state.pressedKeys.has(key),
  isListening: (state: KeyboardShortcutsStore) => state.isListening,
  getShortcut: (state: KeyboardShortcutsStore, id: string) => state.shortcuts[id],
  isShortcutEnabled: (state: KeyboardShortcutsStore, id: string) => 
    state.shortcuts[id]?.enabled ?? false,
  getShortcutByKey: (state: KeyboardShortcutsStore, key: string) => 
    Object.values(state.shortcuts).find(shortcut => shortcut.key === key),
}