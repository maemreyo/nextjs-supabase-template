import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Activity Tracking State interface
export interface ActivityTrackingState {
  activity: {
    lastActivity: string
    sessionDuration: number
    pageViews: number
    actions: number
  }
}

// Activity Tracking Actions interface
export interface ActivityTrackingActions {
  updateActivity: (updates: Partial<ActivityTrackingState['activity']>) => void
  setLastActivity: (timestamp: string) => void
  recordPageView: () => void
  recordAction: () => void
  incrementSessionDuration: (minutes: number) => void
  setSessionDuration: (duration: number) => void
  resetActivity: () => void
  resetActivityTracking: () => void
}

// Combined Activity Tracking store type
export type ActivityTrackingStore = ActivityTrackingState & ActivityTrackingActions

// Initial state
const initialState: ActivityTrackingState = {
  activity: {
    lastActivity: new Date().toISOString(),
    sessionDuration: 0,
    pageViews: 0,
    actions: 0,
  },
}

// Activity Tracking store implementation
export const createActivityTrackingStore = () =>
  create<ActivityTrackingStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Activity actions
          updateActivity: (updates) => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  ...updates,
                },
              }),
              false,
              'updateActivity'
            )
          },

          setLastActivity: (lastActivity) => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity,
                },
              }),
              false,
              'setLastActivity'
            )
          },

          recordPageView: () => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                  pageViews: state.activity.pageViews + 1,
                },
              }),
              false,
              'recordPageView'
            )
          },

          recordAction: () => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                  actions: state.activity.actions + 1,
                },
              }),
              false,
              'recordAction'
            )
          },

          incrementSessionDuration: (minutes) => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                  sessionDuration: state.activity.sessionDuration + minutes,
                },
              }),
              false,
              'incrementSessionDuration'
            )
          },

          setSessionDuration: (sessionDuration) => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  sessionDuration,
                },
              }),
              false,
              'setSessionDuration'
            )
          },

          resetActivity: () => {
            set(
              (state) => ({
                activity: {
                  ...state.activity,
                  lastActivity: new Date().toISOString(),
                },
              }),
              false,
              'resetActivity'
            )
          },

          resetActivityTracking: () => {
            set(initialState, false, 'resetActivityTracking')
          },
        }),
        {
          name: 'activity-tracking-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const useActivityTrackingStore = createActivityTrackingStore()

// Selectors
export const activityTrackingSelectors = {
  activity: (state: ActivityTrackingStore) => state.activity,
  lastActivity: (state: ActivityTrackingStore) => state.activity.lastActivity,
  sessionDuration: (state: ActivityTrackingStore) => state.activity.sessionDuration,
  pageViews: (state: ActivityTrackingStore) => state.activity.pageViews,
  actions: (state: ActivityTrackingStore) => state.activity.actions,
  isActive: (state: ActivityTrackingStore) => {
    const lastActivity = new Date(state.activity.lastActivity)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    return diffMinutes < 30 // Active if within last 30 minutes
  },
  isInactive: (state: ActivityTrackingStore) => {
    const lastActivity = new Date(state.activity.lastActivity)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    return diffMinutes >= 30 // Inactive if more than 30 minutes
  },
  sessionDurationInHours: (state: ActivityTrackingStore) => state.activity.sessionDuration / 60,
  sessionDurationInMinutes: (state: ActivityTrackingStore) => state.activity.sessionDuration,
  engagementScore: (state: ActivityTrackingStore) => {
    // Simple engagement score based on activity
    const timeScore = Math.min(state.activity.sessionDuration / 60, 10) * 10 // Max 100 points for time (10 hours)
    const actionScore = Math.min(state.activity.actions, 50) * 2 // Max 100 points for actions (50 actions)
    const pageViewScore = Math.min(state.activity.pageViews, 20) * 5 // Max 100 points for page views (20 pages)
    
    return timeScore + actionScore + pageViewScore
  },
  engagementLevel: (state: ActivityTrackingStore) => {
    const score = activityTrackingSelectors.engagementScore(state)
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    if (score >= 40) return 'low'
    return 'minimal'
  },
  timeSinceLastActivity: (state: ActivityTrackingStore) => {
    const lastActivity = new Date(state.activity.lastActivity)
    const now = new Date()
    return (now.getTime() - lastActivity.getTime()) / (1000 * 60) // minutes
  },
  activitySummary: (state: ActivityTrackingStore) => ({
    sessionDuration: state.activity.sessionDuration,
    pageViews: state.activity.pageViews,
    actions: state.activity.actions,
    engagementScore: activityTrackingSelectors.engagementScore(state),
    engagementLevel: activityTrackingSelectors.engagementLevel(state),
    isActive: activityTrackingSelectors.isActive(state),
  }),
}