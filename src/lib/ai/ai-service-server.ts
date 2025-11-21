import { createClient } from '@/lib/supabase/server'
import { createAIService } from './ai-service'
import { 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse,
  UsageCheckResponse,
  UserTier,
  AIUsageStats,
  WordAnalysis,
  SentenceAnalysis,
  ParagraphAnalysis,
  AnalyzeWordRequest,
  AnalyzeSentenceRequest,
  AnalyzeParagraphRequest,
  AnalysisResponse
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

      const tier = userTier?.tiers ? this.convertTierFromDB(userTier.tiers) : this.getDefaultTier()

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
      // Don't throw here to avoid breaking main flow
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

      return userTier?.tiers ? this.convertTierFromDB(userTier.tiers) : this.getDefaultTier()
    } catch (error) {
      console.error('Failed to get user tier:', error)
      return this.getDefaultTier()
    }
  }

  // Helper function to convert database tier to UserTier interface
  private convertTierFromDB(dbTier: any): UserTier {
    return {
      id: dbTier.id,
      name: dbTier.name,
      maxRequestsPerDay: dbTier.max_requests_per_day,
      maxTokensPerDay: dbTier.max_tokens_per_day,
      maxCostPerDay: dbTier.max_cost_per_day,
      features: dbTier.features,
      rateLimitPerMinute: dbTier.rate_limit_per_minute,
      rateLimitPerHour: dbTier.rate_limit_per_hour
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

  // Word Analysis Method
  async analyzeWord(userId: string, request: AnalyzeWordRequest): Promise<AnalysisResponse<WordAnalysis>> {
    const startTime = Date.now()
    
    try {
      // Check user permissions and usage limits
      await this.checkUserLimits(userId, 'word-analysis')
      
      const analysis = await this.aiService.analyzeWord(request)
      
      // Save to database
      await this.saveWordAnalysis(userId, request, analysis)
      
      return {
        success: true,
        data: analysis,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0, // Would be calculated from actual AI response
          cost: 0, // Would be calculated from actual AI response
          model: 'unknown', // Would come from actual AI response
          provider: 'unknown' // Would come from actual AI response
        }
      }
    } catch (error) {
      console.error('Error analyzing word:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Sentence Analysis Method
  async analyzeSentence(userId: string, request: AnalyzeSentenceRequest): Promise<AnalysisResponse<SentenceAnalysis>> {
    const startTime = Date.now()
    
    try {
      // Check user permissions and usage limits
      await this.checkUserLimits(userId, 'sentence-analysis')
      
      const analysis = await this.aiService.analyzeSentence(request)
      
      // Save to database
      await this.saveSentenceAnalysis(userId, request, analysis)
      
      return {
        success: true,
        data: analysis,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0, // Would be calculated from actual AI response
          cost: 0, // Would be calculated from actual AI response
          model: 'unknown', // Would come from actual AI response
          provider: 'unknown' // Would come from actual AI response
        }
      }
    } catch (error) {
      console.error('Error analyzing sentence:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Paragraph Analysis Method
  async analyzeParagraph(userId: string, request: AnalyzeParagraphRequest): Promise<AnalysisResponse<ParagraphAnalysis>> {
    const startTime = Date.now()
    
    try {
      // Check user permissions and usage limits
      await this.checkUserLimits(userId, 'paragraph-analysis')
      
      const analysis = await this.aiService.analyzeParagraph(request)
      
      // Save to database
      await this.saveParagraphAnalysis(userId, request, analysis)
      
      return {
        success: true,
        data: analysis,
        metadata: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0, // Would be calculated from actual AI response
          cost: 0, // Would be calculated from actual AI response
          model: 'unknown', // Would come from actual AI response
          provider: 'unknown' // Would come from actual AI response
        }
      }
    } catch (error) {
      console.error('Error analyzing paragraph:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Database save methods
  private async saveWordAnalysis(userId: string, request: AnalyzeWordRequest, analysis: WordAnalysis): Promise<void> {
    const supabase = await createClient()
    
    try {
      // Save main word analysis
      const { data: wordAnalysisData, error: wordError } = await supabase
        .from('word_analyses')
        .insert({
          user_id: userId,
          word: analysis.meta.word,
          ipa: analysis.meta.ipa,
          pos: analysis.meta.pos,
          cefr: analysis.meta.cefr,
          tone: analysis.meta.tone,
          root_meaning: analysis.definitions.root_meaning,
          context_meaning: analysis.definitions.context_meaning,
          vietnamese_translation: analysis.definitions.vietnamese_translation,
          inference_clues: analysis.inference_strategy.clues,
          inference_reasoning: analysis.inference_strategy.reasoning,
          sentence_context: request.sentenceContext,
          paragraph_context: request.paragraphContext,
          example_sentence: analysis.usage.example_sentence,
          example_translation: analysis.usage.example_translation
        })
        .select()
        .single()

      if (wordError || !wordAnalysisData) {
        throw new Error('Failed to save word analysis')
      }

      // Save synonyms
      if (analysis.relations.synonyms.length > 0) {
        const synonymsToInsert = analysis.relations.synonyms.map(synonym => ({
          word_analysis_id: wordAnalysisData.id,
          synonym_word: synonym.word,
          ipa: synonym.ipa,
          meaning_en: synonym.meaning_en,
          meaning_vi: synonym.meaning_vi
        }))

        await supabase.from('word_synonyms').insert(synonymsToInsert)
      }

      // Save antonyms
      if (analysis.relations.antonyms.length > 0) {
        const antonymsToInsert = analysis.relations.antonyms.map(antonym => ({
          word_analysis_id: wordAnalysisData.id,
          antonym_word: antonym.word,
          ipa: antonym.ipa,
          meaning_en: antonym.meaning_en,
          meaning_vi: antonym.meaning_vi
        }))

        await supabase.from('word_antonyms').insert(antonymsToInsert)
      }

      // Save collocations
      if (analysis.usage.collocations.length > 0) {
        const collocationsToInsert = analysis.usage.collocations.map(collocation => ({
          word_analysis_id: wordAnalysisData.id,
          phrase: collocation.phrase,
          meaning: collocation.meaning,
          usage_example: collocation.usage_example,
          frequency_level: collocation.frequency_level
        }))

        await supabase.from('word_collocations').insert(collocationsToInsert)
      }
    } catch (error) {
      console.error('Failed to save word analysis:', error)
      throw error
    }
  }

  private async saveSentenceAnalysis(userId: string, request: AnalyzeSentenceRequest, analysis: SentenceAnalysis): Promise<void> {
    const supabase = await createClient()
    
    try {
      // Save main sentence analysis
      const { data: sentenceAnalysisData, error: sentenceError } = await supabase
        .from('sentence_analyses')
        .insert({
          user_id: userId,
          sentence: analysis.meta.sentence,
          complexity_level: analysis.meta.complexity_level,
          sentence_type: analysis.meta.sentence_type,
          main_idea: analysis.semantics.main_idea,
          subtext: analysis.semantics.subtext,
          sentiment: analysis.semantics.sentiment,
          subject: analysis.grammar_breakdown.subject,
          main_verb: analysis.grammar_breakdown.main_verb,
          object: analysis.grammar_breakdown.object,
          function: analysis.contextual_role.function,
          relation_to_previous: analysis.contextual_role.relation_to_previous,
          literal_translation: analysis.translation.literal,
          natural_translation: analysis.translation.natural,
          paragraph_context: request.paragraphContext,
          clauses: analysis.grammar_breakdown.clauses
        })
        .select()
        .single()

      if (sentenceError || !sentenceAnalysisData) {
        throw new Error('Failed to save sentence analysis')
      }

      // Save key components
      if (analysis.key_components.length > 0) {
        const componentsToInsert = analysis.key_components.map(component => ({
          sentence_analysis_id: sentenceAnalysisData.id,
          phrase: component.phrase,
          type: component.type,
          meaning: component.meaning,
          significance: component.significance
        }))

        await supabase.from('sentence_key_components').insert(componentsToInsert)
      }

      // Save rewrite suggestions
      if (analysis.rewrite_suggestions.length > 0) {
        const suggestionsToInsert = analysis.rewrite_suggestions.map(suggestion => ({
          sentence_analysis_id: sentenceAnalysisData.id,
          style: suggestion.style,
          text: suggestion.text,
          change_log: suggestion.change_log
        }))

        await supabase.from('sentence_rewrite_suggestions').insert(suggestionsToInsert)
      }
    } catch (error) {
      console.error('Failed to save sentence analysis:', error)
      throw error
    }
  }

  private async saveParagraphAnalysis(userId: string, request: AnalyzeParagraphRequest, analysis: ParagraphAnalysis): Promise<void> {
    const supabase = await createClient()
    
    try {
      // Save main paragraph analysis
      const { data: paragraphAnalysisData, error: paragraphError } = await supabase
        .from('paragraph_analyses')
        .insert({
          user_id: userId,
          paragraph: request.paragraph,
          type: analysis.meta.type,
          tone: analysis.meta.tone,
          target_audience: analysis.meta.target_audience,
          main_topic: analysis.content_analysis.main_topic,
          sentiment_label: analysis.content_analysis.sentiment.label,
          sentiment_intensity: analysis.content_analysis.sentiment.intensity,
          sentiment_justification: analysis.content_analysis.sentiment.justification,
          keywords: analysis.content_analysis.keywords,
          logic_score: analysis.coherence_and_cohesion.logic_score,
          flow_score: analysis.coherence_and_cohesion.flow_score,
          transition_words: analysis.coherence_and_cohesion.transition_words,
          gap_analysis: analysis.coherence_and_cohesion.gap_analysis,
          vocabulary_level: analysis.stylistic_evaluation.vocabulary_level,
          sentence_variety: analysis.stylistic_evaluation.sentence_variety,
          better_version: analysis.constructive_feedback.better_version
        })
        .select()
        .single()

      if (paragraphError || !paragraphAnalysisData) {
        throw new Error('Failed to save paragraph analysis')
      }

      // Save structure breakdown
      if (analysis.structure_breakdown.length > 0) {
        const structureToInsert = analysis.structure_breakdown.map(item => ({
          paragraph_analysis_id: paragraphAnalysisData.id,
          sentence_index: item.sentence_index,
          snippet: item.snippet,
          role: item.role,
          analysis: item.analysis
        }))

        await supabase.from('paragraph_structure_breakdown').insert(structureToInsert)
      }

      // Save constructive feedback
      if (analysis.constructive_feedback.critiques.length > 0) {
        const feedbackToInsert = analysis.constructive_feedback.critiques.map(critique => ({
          paragraph_analysis_id: paragraphAnalysisData.id,
          issue_type: critique.issue_type,
          description: critique.description,
          suggestion: critique.suggestion
        }))

        await supabase.from('paragraph_constructive_feedback').insert(feedbackToInsert)
      }
    } catch (error) {
      console.error('Failed to save paragraph analysis:', error)
      throw error
    }
  }

  // Cache methods for optimization
  private analysisCache = new Map<string, any>()

  private getCacheKey(type: string, input: any): string {
    return `${type}:${JSON.stringify(input)}`
  }

  private getCachedAnalysis<T>(cacheKey: string): T | null {
    const cached = this.analysisCache.get(cacheKey)
    if (cached) {
      const { data, timestamp } = cached
      const age = Date.now() - timestamp
      
      // Cache for 1 hour
      if (age < 3600000) {
        return data
      } else {
        this.analysisCache.delete(cacheKey)
      }
    }
    
    return null
  }

  private setCachedAnalysis<T>(cacheKey: string, data: T): void {
    this.analysisCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })

    // Limit cache size
    if (this.analysisCache.size > 100) {
      const firstKey = this.analysisCache.keys().next().value
      if (firstKey) {
        this.analysisCache.delete(firstKey)
      }
    }
  }

}

// Default server instance
export const aiServiceServer = new AIServiceServer()

// Factory function
export function createAIServiceServer(): AIServiceServer {
  return new AIServiceServer()
}