import { createClient } from '@/lib/supabase/server'
import { createAIService } from './ai-service'
import { 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse,
  UsageCheckResponse,
  UserTier,
  AIUsageStats
} from './types'

// Server-side AI service with database integration
export class AIServiceServer {
  private aiService = createAIService()

  async generateText(userId: string, params: GenerateTextParams): Promise<GenerateTextResponse> {
    // Check user permissions and usage limits
    await this.checkUserLimits(userId, 'text-generation')

    try {
      const response = await this.aiService.generateText(params)
      
      // Log usage to database
      await this.logUsage(userId, {
        provider: response.provider,
        model: response.model,
        operation: 'text-generation',
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
        cost: response.cost,
        success: true,
        metadata: params.metadata
      })

      return response
    } catch (error) {
      // Log failed usage
      await this.logUsage(userId, {
        provider: 'unknown',
        model: params.model || 'unknown',
        operation: 'text-generation',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: params.metadata
      })

      throw error
    }
  }

  async generateEmbedding(userId: string, params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    // Check user permissions and usage limits
    await this.checkUserLimits(userId, 'embedding')

    try {
      const response = await this.aiService.generateEmbedding(params)
      
      // Log usage to database
      await this.logUsage(userId, {
        provider: response.provider,
        model: response.model,
        operation: 'embedding',
        inputTokens: response.usage.promptTokens,
        outputTokens: 0,
        totalTokens: response.usage.totalTokens,
        cost: response.cost,
        success: true,
        metadata: params.metadata
      })

      return response
    } catch (error) {
      // Log failed usage
      await this.logUsage(userId, {
        provider: 'unknown',
        model: params.model || 'unknown',
        operation: 'embedding',
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: params.metadata
      })

      throw error
    }
  }

  async checkUsage(userId: string): Promise<UsageCheckResponse> {
    const supabase = await createClient()
    
    try {
      // Get user tier
      const { data: userTier } = await supabase
        .from('user_ai_tiers')
        .select('*, tiers(*)')
        .eq('user_id', userId)
        .single()

      const tier = userTier?.tiers || this.getDefaultTier()

      // Get current usage
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', today)
        .lte('timestamp', today + 'T23:59:59.999Z')

      const stats = this.calculateUsageStats(usageData || [])

      return {
        canUseAI: this.canUseAI(stats, tier),
        remainingRequests: Math.max(0, tier.maxRequestsPerDay - stats.totalRequests),
        remainingTokens: Math.max(0, tier.maxTokensPerDay - stats.totalTokens),
        remainingCost: Math.max(0, tier.maxCostPerDay - stats.totalCost),
        resetTime: this.getNextResetTime(),
        tier,
        usage: stats
      }
    } catch (error) {
      console.error('Failed to check usage:', error)
      
      // Return default tier on error
      const defaultTier = this.getDefaultTier()
      return {
        canUseAI: true,
        remainingRequests: defaultTier.maxRequestsPerDay,
        remainingTokens: defaultTier.maxTokensPerDay,
        remainingCost: defaultTier.maxCostPerDay,
        resetTime: this.getNextResetTime(),
        tier: defaultTier,
        usage: {
          totalRequests: 0,
          totalTokens: 0,
          totalCost: 0,
          averageResponseTime: 0,
          successRate: 0,
          requestsByProvider: {},
          requestsByModel: {},
          costByProvider: {},
          dailyUsage: []
        }
      }
    }
  }

  private async checkUserLimits(userId: string, operation: string): Promise<void> {
    const usageCheck = await this.checkUsage(userId)
    
    if (!usageCheck.canUseAI) {
      throw new Error(`AI usage limit reached. Reset at ${usageCheck.resetTime.toISOString()}`)
    }

    // Check operation-specific limits
    if (operation === 'text-generation' && usageCheck.remainingRequests <= 0) {
      throw new Error('Daily request limit reached')
    }

    if (operation === 'embedding' && usageCheck.remainingTokens <= 0) {
      throw new Error('Daily token limit reached')
    }
  }

  private async logUsage(userId: string, logEntry: any): Promise<void> {
    const supabase = await createClient()
    
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        provider: logEntry.provider,
        model: logEntry.model,
        operation: logEntry.operation,
        input_tokens: logEntry.inputTokens,
        output_tokens: logEntry.outputTokens,
        total_tokens: logEntry.totalTokens,
        cost: logEntry.cost,
        success: logEntry.success,
        error: logEntry.error,
        metadata: logEntry.metadata,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log usage:', error)
      // Don't throw here to avoid breaking the main flow
    }
  }

  private calculateUsageStats(usageLogs: any[]): AIUsageStats {
    const stats: AIUsageStats = {
      totalRequests: usageLogs.length,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0,
      requestsByProvider: {},
      requestsByModel: {},
      costByProvider: {},
      dailyUsage: []
    }

    let successCount = 0
    let totalResponseTime = 0

    usageLogs.forEach(log => {
      stats.totalTokens += log.total_tokens || 0
      stats.totalCost += parseFloat(log.cost) || 0
      
      if (log.success) {
        successCount++
      }

      if (log.duration) {
        totalResponseTime += log.duration
      }

      // Provider stats
      const provider = log.provider || 'unknown'
      stats.requestsByProvider[provider] = (stats.requestsByProvider[provider] || 0) + 1
      stats.costByProvider[provider] = (stats.costByProvider[provider] || 0) + parseFloat(log.cost || 0)

      // Model stats
      const model = log.model || 'unknown'
      stats.requestsByModel[model] = (stats.requestsByModel[model] || 0) + 1
    })

    stats.successRate = stats.totalRequests > 0 ? (successCount / stats.totalRequests) * 100 : 0
    stats.averageResponseTime = successCount > 0 ? totalResponseTime / successCount : 0

    return stats
  }

  private canUseAI(usage: AIUsageStats, tier: UserTier): boolean {
    return (
      usage.totalRequests < tier.maxRequestsPerDay &&
      usage.totalTokens < tier.maxTokensPerDay &&
      usage.totalCost < tier.maxCostPerDay
    )
  }

  private getNextResetTime(): Date {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }

  private getDefaultTier(): UserTier {
    return {
      id: 'free',
      name: 'Free Tier',
      maxRequestsPerDay: 100,
      maxTokensPerDay: 10000,
      maxCostPerDay: 1.0,
      features: ['text-generation', 'embedding'],
      rateLimitPerMinute: 10,
      rateLimitPerHour: 100
    }
  }

  async getModels() {
    return await this.aiService.getAvailableModels()
  }

  async getProviderStatus() {
    return await this.aiService.getProviderStatus()
  }

  async getUserTier(userId: string): Promise<UserTier> {
    const supabase = await createClient()
    
    try {
      const { data: userTier } = await supabase
        .from('user_ai_tiers')
        .select('*, tiers(*)')
        .eq('user_id', userId)
        .single()

      return userTier?.tiers || this.getDefaultTier()
    } catch (error) {
      console.error('Failed to get user tier:', error)
      return this.getDefaultTier()
    }
  }

  async updateUserTier(userId: string, tierId: string): Promise<void> {
    const supabase = await createClient()
    
    try {
      await supabase
        .from('user_ai_tiers')
        .upsert({
          user_id: userId,
          tier_id: tierId,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to update user tier:', error)
      throw new Error('Failed to update user tier')
    }
  }
}

// Default server instance
export const aiServiceServer = new AIServiceServer()

// Factory function
export function createAIServiceServer(): AIServiceServer {
  return new AIServiceServer()
}