// Core AI Types and Interfaces

export interface AIProvider {
  name: string
  generateText(params: GenerateTextParams): Promise<GenerateTextResponse>
  generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse>
  getModels(): Promise<AIModel[]>
  validateApiKey(apiKey: string): Promise<boolean>
}

export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'embedding' | 'image' | 'audio' | 'multimodal'
  maxTokens: number
  costPerToken: number
  costPerRequest: number
  capabilities: string[]
}

export interface GenerateTextParams {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  systemPrompt?: string
  conversationHistory?: Message[]
  metadata?: Record<string, any>
}

export interface GenerateTextResponse {
  text: string
  model: string
  provider: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  metadata?: Record<string, any>
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export interface GenerateEmbeddingParams {
  input: string | string[]
  model?: string
  metadata?: Record<string, any>
}

export interface GenerateEmbeddingResponse {
  embeddings: number[][]
  model: string
  provider: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
  cost: number
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AIUsageLog {
  id: string
  userId: string
  provider: string
  model: string
  operation: 'text-generation' | 'embedding' | 'image-generation' | 'other'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  timestamp: Date
  duration: number
  success: boolean
  error?: string
  metadata: Record<string, any>
}

export interface AIUsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  successRate: number
  requestsByProvider: Record<string, number>
  requestsByModel: Record<string, number>
  costByProvider: Record<string, number>
  dailyUsage: DailyUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
  cost: number
}

export interface UserTier {
  id: string
  name: string
  maxRequestsPerDay: number
  maxTokensPerDay: number
  maxCostPerDay: number
  features: string[]
  rateLimitPerMinute: number
  rateLimitPerHour: number
}

export interface AIProviderConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  maxConcurrency?: number
}

export interface AIError extends Error {
  code: string
  provider: string
  statusCode?: number
  isRetryable: boolean
  metadata?: Record<string, any>
}

export interface UsageTrackingConfig {
  enabled: boolean
  realTimeUpdates: boolean
  batchSize: number
  flushInterval: number
  retentionDays: number
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface RateLimitConfig {
  enabled: boolean
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  tokensPerDay: number
  costPerDay: number
}

export interface AIServiceConfig {
  defaultProvider: string
  defaultModel: string
  providers: Record<string, AIProviderConfig>
  usageTracking: UsageTrackingConfig
  cache: CacheConfig
  rateLimit: RateLimitConfig
  fallbackProviders: string[]
  errorReporting: boolean
}

// Provider-specific types
export interface OpenAIConfig extends AIProviderConfig {
  organization?: string
}

export interface AnthropicConfig extends AIProviderConfig {
  version?: string
}

export interface GoogleAIConfig extends AIProviderConfig {
  projectId?: string
  location?: string
}

export interface CohereConfig extends AIProviderConfig {
  clientName?: string
}

// Response types for API routes
export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export interface UsageCheckResponse {
  canUseAI: boolean
  remainingRequests: number
  remainingTokens: number
  remainingCost: number
  resetTime: Date
  tier: UserTier
  usage: AIUsageStats
}

// Event types for real-time updates
export interface AIUsageEvent {
  type: 'usage_update' | 'limit_reached' | 'error'
  userId: string
  data: any
  timestamp: Date
}

export interface ProviderPerformanceEvent {
  type: 'performance_update'
  provider: string
  model: string
  metrics: {
    averageResponseTime: number
    successRate: number
    errorRate: number
    totalRequests: number
  }
  timestamp: Date
}