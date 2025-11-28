import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'

// Performance Metrics State interface
export interface PerformanceMetricsState {
  performance: {
    loadTime: number
    renderTime: number
    apiResponseTime: number
    errorRate: number
  }
}

// Performance Metrics Actions interface
export interface PerformanceMetricsActions {
  updatePerformance: (metrics: Partial<PerformanceMetricsState['performance']>) => void
  setLoadTime: (time: number) => void
  setRenderTime: (time: number) => void
  setApiResponseTime: (time: number) => void
  setErrorRate: (rate: number) => void
  recordApiResponseTime: (time: number) => void
  recordError: () => void
  resetPerformance: () => void
  resetPerformanceMetrics: () => void
}

// Combined Performance Metrics store type
export type PerformanceMetricsStore = PerformanceMetricsState & PerformanceMetricsActions

// Initial state
const initialState: PerformanceMetricsState = {
  performance: {
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
  },
}

// Performance Metrics store implementation
export const createPerformanceMetricsStore = () =>
  create<PerformanceMetricsStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
          ...initialState,

          // Performance actions
          updatePerformance: (metrics) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  ...metrics,
                },
              }),
              false,
              'updatePerformance'
            )
          },

          setLoadTime: (loadTime) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  loadTime,
                },
              }),
              false,
              'setLoadTime'
            )
          },

          setRenderTime: (renderTime) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  renderTime,
                },
              }),
              false,
              'setRenderTime'
            )
          },

          setApiResponseTime: (apiResponseTime) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  apiResponseTime,
                },
              }),
              false,
              'setApiResponseTime'
            )
          },

          setErrorRate: (errorRate) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  errorRate,
                },
              }),
              false,
              'setErrorRate'
            )
          },

          recordApiResponseTime: (time) => {
            set(
              (state) => ({
                performance: {
                  ...state.performance,
                  apiResponseTime: (state.performance.apiResponseTime + time) / 2, // Moving average
                },
              }),
              false,
              'recordApiResponseTime'
            )
          },

          recordError: () => {
            set(
              (state) => {
                const totalRequests = state.performance.apiResponseTime > 0 ? 100 : 1 // Simplified
                const newErrorRate = ((state.performance.errorRate * totalRequests / 100) + 1) / totalRequests * 100
                return {
                  performance: {
                    ...state.performance,
                    errorRate: newErrorRate,
                  },
                }
              },
              false,
              'recordError'
            )
          },

          resetPerformance: () => {
            set({ performance: initialState.performance }, false, 'resetPerformance')
          },

          resetPerformanceMetrics: () => {
            set(initialState, false, 'resetPerformanceMetrics')
          },
        }),
        {
          name: 'performance-metrics-store',
          enabled: process.env.NODE_ENV === 'development',
        }
      )
    )
  )

// Create the store instance
export const usePerformanceMetricsStore = createPerformanceMetricsStore()

// Selectors
export const performanceMetricsSelectors = {
  performance: (state: PerformanceMetricsStore) => state.performance,
  loadTime: (state: PerformanceMetricsStore) => state.performance.loadTime,
  renderTime: (state: PerformanceMetricsStore) => state.performance.renderTime,
  apiResponseTime: (state: PerformanceMetricsStore) => state.performance.apiResponseTime,
  errorRate: (state: PerformanceMetricsStore) => state.performance.errorRate,
  isPerformant: (state: PerformanceMetricsStore) => 
    state.performance.loadTime < 1000 && 
    state.performance.renderTime < 100 && 
    state.performance.apiResponseTime < 500 &&
    state.performance.errorRate < 1,
  hasLoadTimeIssues: (state: PerformanceMetricsStore) => state.performance.loadTime >= 1000,
  hasRenderTimeIssues: (state: PerformanceMetricsStore) => state.performance.renderTime >= 100,
  hasApiResponseTimeIssues: (state: PerformanceMetricsStore) => state.performance.apiResponseTime >= 500,
  hasHighErrorRate: (state: PerformanceMetricsStore) => state.performance.errorRate >= 5,
  hasPerformanceIssues: (state: PerformanceMetricsStore) => 
    state.performance.loadTime >= 1000 || 
    state.performance.renderTime >= 100 || 
    state.performance.apiResponseTime >= 500 || 
    state.performance.errorRate >= 1,
  performanceScore: (state: PerformanceMetricsStore) => {
    let score = 100
    
    // Deduct points for load time issues
    if (state.performance.loadTime >= 1000) score -= 25
    else if (state.performance.loadTime >= 500) score -= 10
    
    // Deduct points for render time issues
    if (state.performance.renderTime >= 100) score -= 25
    else if (state.performance.renderTime >= 50) score -= 10
    
    // Deduct points for API response time issues
    if (state.performance.apiResponseTime >= 500) score -= 25
    else if (state.performance.apiResponseTime >= 300) score -= 10
    
    // Deduct points for error rate
    if (state.performance.errorRate >= 5) score -= 30
    else if (state.performance.errorRate >= 2) score -= 15
    else if (state.performance.errorRate >= 1) score -= 5
    
    return Math.max(0, score)
  },
  performanceGrade: (state: PerformanceMetricsStore) => {
    const score = performanceMetricsSelectors.performanceScore(state)
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  },
}