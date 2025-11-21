import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResponse,
  GenerateEmbeddingParams,
  GenerateEmbeddingResponse,
  AIServiceConfig,
  AIError,
  UsageTrackingConfig,
  CacheConfig,
  RateLimitConfig,
  WordAnalysis,
  SentenceAnalysis,
  ParagraphAnalysis,
  AnalyzeWordRequest,
  AnalyzeSentenceRequest,
  AnalyzeParagraphRequest
} from './types'
import { providerRegistry } from './providers'
import {
  buildWordAnalysisPrompt,
  buildSentenceAnalysisPrompt,
  buildParagraphAnalysisPrompt,
  validateWordAnalysis,
  validateSentenceAnalysis,
  validateParagraphAnalysis,
  createFallbackWordAnalysis,
  createFallbackSentenceAnalysis,
  createFallbackParagraphAnalysis
} from './prompt-utils'

export class AIService {
  private config: AIServiceConfig
  private cache: Map<string, any> = new Map()
  private usageTracker: UsageTracker

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'openai',
      defaultModel: config.defaultModel || 'gpt-3.5-turbo',
      providers: config.providers || {},
      usageTracking: {
        enabled: true,
        realTimeUpdates: true,
        batchSize: 10,
        flushInterval: 5000,
        retentionDays: 30,
        ...config.usageTracking
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 100,
        strategy: 'lru',
        ...config.cache
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        tokensPerDay: 1000000,
        costPerDay: 100,
        ...config.rateLimit
      },
      fallbackProviders: config.fallbackProviders || ['anthropic', 'google'],
      errorReporting: config.errorReporting !== false
    }

    this.usageTracker = new UsageTracker(this.config.usageTracking)
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const startTime = Date.now()
    let lastError: AIError | null = null

    // Check cache first
    if (this.config.cache.enabled) {
      const cacheKey = this.generateCacheKey('text', params)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check rate limits
    if (this.config.rateLimit.enabled) {
      await this.checkRateLimits('text-generation')
    }

    // Try primary provider first
    const provider = this.getProvider(params.model || this.config.defaultModel)
    
    try {
      const response = await provider.generateText(params)
      
      // Cache the response
      if (this.config.cache.enabled) {
        const cacheKey = this.generateCacheKey('text', params)
        this.setCache(cacheKey, response)
      }

      // Track usage
      if (this.config.usageTracking.enabled) {
        await this.usageTracker.trackUsage({
          provider: provider.name,
          model: response.model,
          operation: 'text-generation',
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
          totalTokens: response.usage.totalTokens,
          cost: response.cost,
          duration: Date.now() - startTime,
          success: true,
          metadata: params.metadata
        })
      }

      return response
    } catch (error) {
      lastError = error as AIError

      // Try fallback providers
      if (this.config.fallbackProviders.length > 0) {
        for (const fallbackProviderName of this.config.fallbackProviders) {
          try {
            const fallbackProvider = providerRegistry.getProvider(fallbackProviderName)
            if (!fallbackProvider) continue

            const response = await fallbackProvider.generateText(params)
            
            // Track usage for fallback
            if (this.config.usageTracking.enabled) {
              await this.usageTracker.trackUsage({
                provider: fallbackProvider.name,
                model: response.model,
                operation: 'text-generation',
                inputTokens: response.usage.promptTokens,
                outputTokens: response.usage.completionTokens,
                totalTokens: response.usage.totalTokens,
                cost: response.cost,
                duration: Date.now() - startTime,
                success: true,
                metadata: { ...params.metadata, fallbackFrom: provider.name }
              })
            }

            return response
          } catch (fallbackError) {
            console.error(`Fallback provider ${fallbackProviderName} failed:`, fallbackError)
          }
        }
      }

      // Track failed usage
      if (this.config.usageTracking.enabled) {
        await this.usageTracker.trackUsage({
          provider: provider.name,
          model: params.model || this.config.defaultModel,
          operation: 'text-generation',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          duration: Date.now() - startTime,
          success: false,
          error: lastError?.message,
          metadata: params.metadata
        })
      }

      throw lastError
    }
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    const startTime = Date.now()

    // Check cache first
    if (this.config.cache.enabled) {
      const cacheKey = this.generateCacheKey('embedding', params)
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Check rate limits
    if (this.config.rateLimit.enabled) {
      await this.checkRateLimits('embedding')
    }

    const provider = this.getProvider(params.model || this.config.defaultModel)
    
    try {
      const response = await provider.generateEmbedding(params)
      
      // Cache the response
      if (this.config.cache.enabled) {
        const cacheKey = this.generateCacheKey('embedding', params)
        this.setCache(cacheKey, response)
      }

      // Track usage
      if (this.config.usageTracking.enabled) {
        await this.usageTracker.trackUsage({
          provider: provider.name,
          model: response.model,
          operation: 'embedding',
          inputTokens: response.usage.promptTokens,
          outputTokens: 0,
          totalTokens: response.usage.totalTokens,
          cost: response.cost,
          duration: Date.now() - startTime,
          success: true,
          metadata: params.metadata
        })
      }

      return response
    } catch (error) {
      const aiError = error as AIError

      // Track failed usage
      if (this.config.usageTracking.enabled) {
        await this.usageTracker.trackUsage({
          provider: provider.name,
          model: params.model || this.config.defaultModel,
          operation: 'embedding',
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          duration: Date.now() - startTime,
          success: false,
          error: aiError?.message,
          metadata: params.metadata
        })
      }

      throw aiError
    }
  }

  async getAvailableModels() {
    return await providerRegistry.getAllModels()
  }

  async getProviderStatus() {
    return await providerRegistry.validateAllProviders()
  }

  private getProvider(model?: string): AIProvider {
    if (model) {
      const providerName = providerRegistry.getProviderForModel(model)
      const provider = providerRegistry.getProvider(providerName || '')
      if (provider) return provider
    }

    const provider = providerRegistry.getProvider(this.config.defaultProvider)
    if (!provider) {
      throw new Error(`Default provider ${this.config.defaultProvider} not available`)
    }

    return provider
  }

  private generateCacheKey(operation: string, params: any): string {
    const keyData = {
      operation,
      ...params,
      // Remove sensitive data from cache key
      metadata: undefined
    }
    return btoa(JSON.stringify(keyData))
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (!cached) return null

    const { data, timestamp } = cached
    const age = Date.now() - timestamp
    
    if (age > this.config.cache.ttl) {
      this.cache.delete(key)
      return null
    }

    return data
  }

  private setCache(key: string, data: any): void {
    // Implement cache size limit
    if (this.cache.size >= this.config.cache.maxSize) {
      // Simple LRU: delete first item
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private async checkRateLimits(operation: string): Promise<void> {
    // This would integrate with your rate limiting system
    // For now, it's a placeholder
    return Promise.resolve()
  }

  // Public methods for usage tracking
  async getUsageStats(userId?: string) {
    return this.usageTracker.getStats(userId)
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
  }

  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Word Analysis Method
  async analyzeWord(request: AnalyzeWordRequest): Promise<WordAnalysis> {
    const startTime = Date.now()
    
    try {
      const prompt = buildWordAnalysisPrompt(request)
      const response = await this.generateText({
        prompt,
        temperature: 0.3,
        maxTokens: 4000,
        metadata: {
          operation: 'word-analysis',
          word: request.word,
          context: request.sentenceContext
        }
      })
      
      // Parse and validate response
      const analysisResult = JSON.parse(response.text)
      const validatedAnalysis = validateWordAnalysis(analysisResult)
      
      return validatedAnalysis
    } catch (error) {
      console.error('Error analyzing word:', error)
      
      // Return fallback response
      return createFallbackWordAnalysis(request.word)
    }
  }

  // Sentence Analysis Method
  async analyzeSentence(request: AnalyzeSentenceRequest): Promise<SentenceAnalysis> {
    const startTime = Date.now()
    
    try {
      const prompt = buildSentenceAnalysisPrompt(request)
      const response = await this.generateText({
        prompt,
        temperature: 0.3,
        maxTokens: 4000,
        metadata: {
          operation: 'sentence-analysis',
          sentence: request.sentence
        }
      })
      
      // Parse and validate response
      const analysisResult = JSON.parse(response.text)
      const validatedAnalysis = validateSentenceAnalysis(analysisResult)
      
      return validatedAnalysis
    } catch (error) {
      console.error('Error analyzing sentence:', error)
      
      // Return fallback response
      return createFallbackSentenceAnalysis(request.sentence)
    }
  }

  // Paragraph Analysis Method
  async analyzeParagraph(request: AnalyzeParagraphRequest): Promise<ParagraphAnalysis> {
    const startTime = Date.now()
    
    try {
      const prompt = buildParagraphAnalysisPrompt(request)
      const response = await this.generateText({
        prompt,
        temperature: 0.3,
        maxTokens: 6000,
        metadata: {
          operation: 'paragraph-analysis',
          paragraphLength: request.paragraph.length
        }
      })
      
      // Parse and validate response
      const analysisResult = JSON.parse(response.text)
      const validatedAnalysis = validateParagraphAnalysis(analysisResult)
      
      return validatedAnalysis
    } catch (error) {
      console.error('Error analyzing paragraph:', error)
      
      // Return fallback response
      return createFallbackParagraphAnalysis(request.paragraph)
    }
  }

  // Batch Analysis Methods for optimization
  async analyzeWordsBatch(requests: AnalyzeWordRequest[]): Promise<WordAnalysis[]> {
    const maxItems = requests[0]?.maxItems || 5
    
    const prompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích các từ khóa sau để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON array hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần Synonyms/Antonyms: Giới hạn tối đa ${maxItems} từ mỗi loại, sắp xếp theo độ phổ biến/độ sát nghĩa giảm dần.

WORDS TO ANALYZE:
${requests.map((w, i) => `
${i + 1}. Word: "${w.word}"
   Sentence: "${w.sentenceContext}"
   Paragraph: "${w.paragraphContext || ''}"
`).join('\n')}

JSON SCHEMA FOR EACH WORD:
{
  "meta": {
    "word": "từ",
    "ipa": "Phiên âm IPA",
    "pos": "Từ loại (Noun/Verb...)",
    "cefr": "Trình độ (A1-C2)",
    "tone": "Sắc thái (Formal/Neutral/Irony...)"
  },
  "definitions": {
    "root_meaning": "Nghĩa gốc trong từ điển",
    "context_meaning": "Nghĩa trong câu này (dịch thoát ý để hợp văn cảnh)",
    "vietnamese_translation": "Từ/Cụm từ tiếng Việt tương đương nhất"
  },
  "inference_strategy": {
    "clues": "Dấu hiệu nào trong câu giúp đoán nghĩa? (VD: Tiền tố 'un-', từ nối 'but', hoặc tân ngữ đi kèm...)",
    "reasoning": "Giải thích ngắn gọn quy trình suy luận để ra nghĩa của từ mà không cần tra từ điển"
  },
  "relations": {
    "synonyms": [
      {
        "word": "Từ đồng nghĩa 1",
        "ipa": "/ipa/",
        "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
        "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
      }
    ],
    "antonyms": [
      {
        "word": "Từ trái nghĩa 1",
        "ipa": "/ipa/",
        "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
        "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
      }
    ]
  },
  "usage": {
    "collocations": [
      {
        "phrase": "Cụm từ collocation",
        "meaning": "Nghĩa của cụm từ",
        "usage_example": "Ví dụ sử dụng cụm từ trong câu",
        "frequency_level": "common"
      }
    ],
    "example_sentence": "Một câu ví dụ khác (khác input)",
    "example_translation": "Dịch câu ví dụ"
  }
}
`
    
    try {
      const response = await this.generateText({
        prompt,
        temperature: 0.3,
        maxTokens: 8000,
        metadata: {
          operation: 'batch-word-analysis',
          batchSize: requests.length
        }
      })
      
      // Parse JSON array response
      const analysisResults = JSON.parse(response.text)
      
      // Validate each result
      return analysisResults.map((result: any) => {
        try {
          return validateWordAnalysis(result)
        } catch (error) {
          console.error('Invalid word analysis in batch:', error)
          // Return fallback for invalid result
          const word = result?.meta?.word || 'unknown'
          return createFallbackWordAnalysis(word)
        }
      })
    } catch (error) {
      console.error('Error analyzing words batch:', error)
      
      // Fallback: return empty analyses
      return requests.map(request => createFallbackWordAnalysis(request.word))
    }
  }
}

class UsageTracker {
  private config: UsageTrackingConfig
  private pendingLogs: any[] = []

  constructor(config: UsageTrackingConfig) {
    this.config = config
    
    if (config.enabled && config.flushInterval > 0) {
      setInterval(() => {
        this.flushLogs()
      }, config.flushInterval)
    }
  }

  async trackUsage(logEntry: any): Promise<void> {
    if (!this.config.enabled) return

    this.pendingLogs.push({
      ...logEntry,
      timestamp: new Date(),
      id: this.generateId()
    })

    if (this.config.realTimeUpdates || this.pendingLogs.length >= this.config.batchSize) {
      await this.flushLogs()
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    const logsToFlush = [...this.pendingLogs]
    this.pendingLogs = []

    try {
      // This would integrate with your database/logging system
      console.log('Flushing usage logs:', logsToFlush)
    } catch (error) {
      console.error('Failed to flush usage logs:', error)
      // Re-add logs to pending if flush failed
      this.pendingLogs.unshift(...logsToFlush)
    }
  }

  async getStats(userId?: string): Promise<any> {
    // This would query your database for usage stats
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      successRate: 0
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Default instance
export const aiService = new AIService()

// Factory function for creating instances with custom config
export function createAIService(config?: Partial<AIServiceConfig>): AIService {
  return new AIService(config)
}