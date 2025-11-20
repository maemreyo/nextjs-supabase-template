'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UsageCheckResponse, 
  AIUsageStats,
  UserTier 
} from '@/lib/ai/types'
import { aiServiceClient } from '@/lib/ai/ai-service-client'

interface UseAIUsageOptimizedState {
  usage: UsageCheckResponse | null
  isLoading: boolean
  error: string | null
  canUseAI: boolean
  remainingRequests: number
  remainingTokens: number
  remainingCost: number
}

interface UseAIUsageOptimizedReturn extends UseAIUsageOptimizedState {
  refreshUsage: () => Promise<void>
  checkUsage: () => Promise<boolean>
  updateUsage: (updates: Partial<UsageCheckResponse>) => void
}

export function useAIUsageOptimized(userId?: string): UseAIUsageOptimizedReturn {
  const [state, setState] = useState<UseAIUsageOptimizedState>({
    usage: null,
    isLoading: false,
    error: null,
    canUseAI: true,
    remainingRequests: 0,
    remainingTokens: 0,
    remainingCost: 0
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const updateUsage = useCallback((updates: Partial<UsageCheckResponse>) => {
    setState(prev => {
      if (!prev.usage) return prev

      const newUsage = { ...prev.usage, ...updates }
      
      return {
        ...prev,
        usage: newUsage,
        canUseAI: newUsage.canUseAI,
        remainingRequests: newUsage.remainingRequests,
        remainingTokens: newUsage.remainingTokens,
        remainingCost: newUsage.remainingCost
      }
    })
  }, [])

  const refreshUsage = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const usageData = await aiServiceClient.checkUsage(userId)
      
      setState({
        usage: usageData,
        isLoading: false,
        error: null,
        canUseAI: usageData.canUseAI,
        remainingRequests: usageData.remainingRequests,
        remainingTokens: usageData.remainingTokens,
        remainingCost: usageData.remainingCost
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check usage'
      setError(errorMessage)
      setLoading(false)
    }
  }, [userId, setLoading, setError])

  const checkUsage = useCallback(async (): Promise<boolean> => {
    try {
      const usageData = await aiServiceClient.checkUsage(userId)
      return usageData.canUseAI
    } catch (error) {
      console.error('Failed to check usage:', error)
      return false
    }
  }, [userId])

  // Auto-refresh usage every 30 seconds
  useEffect(() => {
    refreshUsage()

    const interval = setInterval(() => {
      refreshUsage()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshUsage])

  return {
    ...state,
    refreshUsage,
    checkUsage,
    updateUsage
  }
}

// Hook for usage statistics
export function useAIUsageStats(userId?: string) {
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const usageData = await aiServiceClient.checkUsage(userId)
      setStats(usageData.usage)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats
  }
}

// Hook for tier management
export function useAITier(userId?: string) {
  const [tier, setTier] = useState<UserTier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTier = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const usageData = await aiServiceClient.checkUsage(userId)
      setTier(usageData.tier)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tier'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTier()
  }, [fetchTier])

  return {
    tier,
    isLoading,
    error,
    refresh: fetchTier
  }
}

// Hook for real-time usage updates
export function useAIUsageRealtime(userId?: string) {
  const [usage, setUsage] = useState<UsageCheckResponse | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Simulate real-time updates
  // In a real implementation, you would use WebSocket or Supabase realtime
  useEffect(() => {
    const connectRealtime = () => {
      setIsConnected(true)
      
      // Simulate real-time updates
      const interval = setInterval(async () => {
        try {
          const usageData = await aiServiceClient.checkUsage(userId)
          setUsage(usageData)
        } catch (error) {
          console.error('Real-time usage update failed:', error)
        }
      }, 5000) // Update every 5 seconds

      return () => {
        clearInterval(interval)
        setIsConnected(false)
      }
    }

    const cleanup = connectRealtime()
    return cleanup
  }, [userId])

  return {
    usage,
    isConnected,
    refresh: async () => {
      try {
        const usageData = await aiServiceClient.checkUsage(userId)
        setUsage(usageData)
      } catch (error) {
        console.error('Failed to refresh usage:', error)
      }
    }
  }
}

// Hook for usage limits and warnings
export function useAIUsageLimits(userId?: string) {
  const [warnings, setWarnings] = useState<string[]>([])
  const [limits, setLimits] = useState<{
    requests: number
    tokens: number
    cost: number
  } | null>(null)

  useEffect(() => {
    const checkLimits = async () => {
      try {
        const usageData = await aiServiceClient.checkUsage(userId)
        const newWarnings: string[] = []

        // Check for approaching limits
        if (usageData.remainingRequests < 10) {
          newWarnings.push(`Running low on requests: ${usageData.remainingRequests} remaining`)
        }

        if (usageData.remainingTokens < 1000) {
          newWarnings.push(`Running low on tokens: ${usageData.remainingTokens} remaining`)
        }

        if (usageData.remainingCost < 0.5) {
          newWarnings.push(`Running low on credits: $${usageData.remainingCost.toFixed(2)} remaining`)
        }

        setWarnings(newWarnings)
        setLimits({
          requests: usageData.tier.maxRequestsPerDay,
          tokens: usageData.tier.maxTokensPerDay,
          cost: usageData.tier.maxCostPerDay
        })
      } catch (error) {
        console.error('Failed to check limits:', error)
      }
    }

    checkLimits()
    const interval = setInterval(checkLimits, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [userId])

  return {
    warnings,
    limits,
    hasWarnings: warnings.length > 0
  }
}