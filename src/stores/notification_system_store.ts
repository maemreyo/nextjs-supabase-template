import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Notification System State interface
export interface NotificationSystemState {
  notifications: Notification[]
}

// Notification System Actions interface
export interface NotificationSystemActions {
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  resetNotificationSystem: () => void
}

// Combined Notification System store type
export type NotificationSystemStore = NotificationSystemState & NotificationSystemActions

// Initial state
const initialState: NotificationSystemState = {
  notifications: [],
}

// Notification System store implementation
export const createNotificationSystemStore = () =>
  create<NotificationSystemStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Notification actions
          addNotification: (notification) => {
            const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const newNotification = { ...notification, id }
            
            set(
              (state) => ({
                notifications: [...state.notifications, newNotification],
              }),
              false,
              'addNotification'
            )

            // Auto-remove notification after duration
            if (notification.duration !== 0) {
              setTimeout(() => {
                get().removeNotification(id)
              }, notification.duration || 5000)
            }
          },

          removeNotification: (id) => {
            set(
              (state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
              }),
              false,
              'removeNotification'
            )
          },

          clearNotifications: () => {
            set({ notifications: [] }, false, 'clearNotifications')
          },

          resetNotificationSystem: () => {
            set(initialState, false, 'resetNotificationSystem')
          },
        }),
        {
          name: 'notification-system-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useNotificationSystemStore = createNotificationSystemStore()

// Selectors
export const notificationSystemSelectors = {
  notifications: (state: NotificationSystemStore) => state.notifications,
  notificationCount: (state: NotificationSystemStore) => state.notifications.length,
  hasNotifications: (state: NotificationSystemStore) => state.notifications.length > 0,
  notificationsByType: (state: NotificationSystemStore, type: Notification['type']) =>
    state.notifications.filter(n => n.type === type),
  successNotifications: (state: NotificationSystemStore) =>
    state.notifications.filter(n => n.type === 'success'),
  errorNotifications: (state: NotificationSystemStore) =>
    state.notifications.filter(n => n.type === 'error'),
  warningNotifications: (state: NotificationSystemStore) =>
    state.notifications.filter(n => n.type === 'warning'),
  infoNotifications: (state: NotificationSystemStore) =>
    state.notifications.filter(n => n.type === 'info'),
  hasErrorNotifications: (state: NotificationSystemStore) =>
    state.notifications.some(n => n.type === 'error'),
  hasUnreadNotifications: (state: NotificationSystemStore) =>
    state.notifications.length > 0,
}