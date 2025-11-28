import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Modal types
export interface ModalState {
  [key: string]: {
    isOpen: boolean
    data?: any
  }
}

// Modal Manager State interface
export interface ModalManagerState {
  modals: ModalState
}

// Modal Manager Actions interface
export interface ModalManagerActions {
  openModal: (modalId: string, data?: any) => void
  closeModal: (modalId: string) => void
  closeAllModals: () => void
  toggleModal: (modalId: string, data?: any) => void
  resetModalManager: () => void
}

// Combined Modal Manager store type
export type ModalManagerStore = ModalManagerState & ModalManagerActions

// Initial state
const initialState: ModalManagerState = {
  modals: {},
}

// Modal Manager store implementation
export const createModalManagerStore = () =>
  create<ModalManagerStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Modal actions
          openModal: (modalId, data) => {
            set(
              (state) => ({
                modals: {
                  ...state.modals,
                  [modalId]: {
                    isOpen: true,
                    data,
                  },
                },
              }),
              false,
              'openModal'
            )
          },

          closeModal: (modalId) => {
            set(
              (state) => ({
                modals: {
                  ...state.modals,
                  [modalId]: {
                    ...state.modals[modalId],
                    isOpen: false,
                    data: undefined,
                  },
                },
              }),
              false,
              'closeModal'
            )
          },

          closeAllModals: () => {
            set(
              (state) => ({
                modals: Object.keys(state.modals).reduce(
                  (acc, key) => ({
                    ...acc,
                    [key]: {
                      ...state.modals[key],
                      isOpen: false,
                      data: undefined,
                    },
                  }),
                  {}
                ),
              }),
              false,
              'closeAllModals'
            )
          },

          toggleModal: (modalId, data) => {
            const { modals } = get()
            const isOpen = modals[modalId]?.isOpen || false
            
            if (isOpen) {
              get().closeModal(modalId)
            } else {
              get().openModal(modalId, data)
            }
          },

          resetModalManager: () => {
            set(initialState, false, 'resetModalManager')
          },
        }),
        {
          name: 'modal-manager-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useModalManagerStore = createModalManagerStore()

// Selectors
export const modalManagerSelectors = {
  modals: (state: ModalManagerStore) => state.modals,
  isModalOpen: (state: ModalManagerStore, modalId: string) => 
    state.modals[modalId]?.isOpen || false,
  getModalData: (state: ModalManagerStore, modalId: string) => 
    state.modals[modalId]?.data,
  anyModalOpen: (state: ModalManagerStore) => 
    Object.values(state.modals).some(modal => modal.isOpen),
  openModals: (state: ModalManagerStore) => 
    Object.entries(state.modals)
      .filter(([_, modal]) => modal.isOpen)
      .map(([id, modal]) => ({ id, ...modal })),
  openModalCount: (state: ModalManagerStore) => 
    Object.values(state.modals).filter(modal => modal.isOpen).length,
}