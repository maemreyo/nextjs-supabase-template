import { AIProvider, AIModel } from '../types'
import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { GoogleAIProvider } from './gemini-provider'
import { CohereProvider } from './cohere-provider'

export class ProviderRegistry {
  private static instance: ProviderRegistry
  private providers: Map<string, AIProvider> = new Map()
  private models: Map<string, AIModel[]> = new Map()

  private constructor() {
    this.initializeProviders()
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry()
    }
    return ProviderRegistry.instance
  }

  private async initializeProviders() {
    // Initialize providers with their configurations
    const openaiConfig = this.getProviderConfig('openai')
    const anthropicConfig = this.getProviderConfig('anthropic')
    const googleConfig = this.getProviderConfig('google')
    const cohereConfig = this.getProviderConfig('cohere')

    if (openaiConfig?.apiKey) {
      this.registerProvider('openai', new OpenAIProvider(openaiConfig))
    }

    if (anthropicConfig?.apiKey) {
      this.registerProvider('anthropic', new AnthropicProvider(anthropicConfig))
    }

    if (googleConfig?.apiKey) {
      this.registerProvider('google', new GoogleAIProvider(googleConfig))
    }

    if (cohereConfig?.apiKey) {
      this.registerProvider('cohere', new CohereProvider(cohereConfig))
    }
  }

  private getProviderConfig(provider: string) {
    switch (provider) {
      case 'openai':
        return {
          apiKey: process.env.OPENAI_API_KEY || '',
          organization: process.env.OPENAI_ORGANIZATION,
          baseURL: process.env.OPENAI_BASE_URL,
          timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
          retryAttempts: parseInt(process.env.OPENAI_RETRY_ATTEMPTS || '3'),
          retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY || '1000'),
          maxConcurrency: parseInt(process.env.OPENAI_MAX_CONCURRENCY || '5')
        }
      case 'anthropic':
        return {
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          baseURL: process.env.ANTHROPIC_BASE_URL,
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
          retryAttempts: parseInt(process.env.ANTHROPIC_RETRY_ATTEMPTS || '3'),
          retryDelay: parseInt(process.env.ANTHROPIC_RETRY_DELAY || '1000'),
          maxConcurrency: parseInt(process.env.ANTHROPIC_MAX_CONCURRENCY || '5'),
          version: process.env.ANTHROPIC_VERSION || '2023-06-01'
        }
      case 'google':
        return {
          apiKey: process.env.GOOGLE_AI_API_KEY || '',
          baseURL: process.env.GOOGLE_AI_BASE_URL,
          timeout: parseInt(process.env.GOOGLE_AI_TIMEOUT || '30000'),
          retryAttempts: parseInt(process.env.GOOGLE_AI_RETRY_ATTEMPTS || '3'),
          retryDelay: parseInt(process.env.GOOGLE_AI_RETRY_DELAY || '1000'),
          maxConcurrency: parseInt(process.env.GOOGLE_AI_MAX_CONCURRENCY || '5'),
          projectId: process.env.GOOGLE_AI_PROJECT_ID,
          location: process.env.GOOGLE_AI_LOCATION || 'us-central1'
        }
      case 'cohere':
        return {
          apiKey: process.env.COHERE_API_KEY || '',
          baseURL: process.env.COHERE_BASE_URL,
          timeout: parseInt(process.env.COHERE_TIMEOUT || '30000'),
          retryAttempts: parseInt(process.env.COHERE_RETRY_ATTEMPTS || '3'),
          retryDelay: parseInt(process.env.COHERE_RETRY_DELAY || '1000'),
          maxConcurrency: parseInt(process.env.COHERE_MAX_CONCURRENCY || '5'),
          clientName: process.env.COHERE_CLIENT_NAME || 'nextjs-supabase-template'
        }
      default:
        return null
    }
  }

  public registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider)
  }

  public getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name)
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values())
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  public async getModelsForProvider(provider: string): Promise<AIModel[]> {
    if (this.models.has(provider)) {
      return this.models.get(provider)!
    }

    const providerInstance = this.getProvider(provider)
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not found`)
    }

    try {
      const models = await providerInstance.getModels()
      this.models.set(provider, models)
      return models
    } catch (error) {
      console.error(`Failed to fetch models for provider ${provider}:`, error)
      return []
    }
  }

  public async getAllModels(): Promise<AIModel[]> {
    const allModels: AIModel[] = []
    
    for (const provider of this.getAvailableProviders()) {
      try {
        const models = await this.getModelsForProvider(provider)
        allModels.push(...models)
      } catch (error) {
        console.error(`Failed to fetch models for provider ${provider}:`, error)
      }
    }

    return allModels
  }

  public async findModel(modelId: string): Promise<AIModel | null> {
    const allModels = await this.getAllModels()
    return allModels.find(model => model.id === modelId) || null
  }

  public async validateProvider(provider: string): Promise<boolean> {
    const providerInstance = this.getProvider(provider)
    if (!providerInstance) {
      return false
    }

    try {
      const config = this.getProviderConfig(provider)
      if (!config?.apiKey) {
        return false
      }

      return await providerInstance.validateApiKey(config.apiKey)
    } catch (error) {
      console.error(`Failed to validate provider ${provider}:`, error)
      return false
    }
  }

  public async validateAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const provider of this.getAvailableProviders()) {
      results[provider] = await this.validateProvider(provider)
    }

    return results
  }

  public getDefaultProvider(): string {
    const defaultProvider = process.env.AI_DEFAULT_PROVIDER || 'openai'
    const availableProviders = this.getAvailableProviders()
    
    if (availableProviders.includes(defaultProvider)) {
      return defaultProvider
    }

    // Fallback to first available provider
    return availableProviders[0] || 'openai'
  }

  public getDefaultModel(provider?: string): string {
    const providerName = provider || this.getDefaultProvider()
    const defaultModel = process.env.AI_DEFAULT_MODEL

    if (defaultModel) {
      return defaultModel
    }

    // Provider-specific defaults
    const providerDefaults: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-pro',
      cohere: 'command'
    }

    return providerDefaults[providerName] || 'gpt-3.5-turbo'
  }

  public getProviderForModel(modelId: string): string | null {
    // Extract provider from model ID or use mapping
    if (modelId.startsWith('gpt-') || modelId.startsWith('text-davinci')) {
      return 'openai'
    }
    if (modelId.startsWith('claude-')) {
      return 'anthropic'
    }
    if (modelId.startsWith('gemini-')) {
      return 'google'
    }
    if (modelId.startsWith('command') || modelId.startsWith('embed-')) {
      return 'cohere'
    }

    return null
  }

  public async refreshModels(): Promise<void> {
    this.models.clear()
    
    for (const provider of this.getAvailableProviders()) {
      try {
        await this.getModelsForProvider(provider)
      } catch (error) {
        console.error(`Failed to refresh models for provider ${provider}:`, error)
      }
    }
  }

  public getProviderCapabilities(provider: string): string[] {
    const capabilities: Record<string, string[]> = {
      openai: ['text-generation', 'embedding', 'image-generation', 'function-calling'],
      anthropic: ['text-generation', 'function-calling'],
      google: ['text-generation', 'embedding', 'image-generation'],
      cohere: ['text-generation', 'embedding', 'rerank']
    }

    return capabilities[provider] || []
  }

  public getModelCapabilities(modelId: string): string[] {
    const provider = this.getProviderForModel(modelId)
    return provider ? this.getProviderCapabilities(provider) : []
  }
}

// Export singleton instance
export const providerRegistry = ProviderRegistry.getInstance()

// Export convenience functions
export const getProvider = (name: string) => providerRegistry.getProvider(name)
export const getAvailableProviders = () => providerRegistry.getAvailableProviders()
export const getDefaultProvider = () => providerRegistry.getDefaultProvider()
export const getDefaultModel = (provider?: string) => providerRegistry.getDefaultModel(provider)
export const getModelsForProvider = (provider: string) => providerRegistry.getModelsForProvider(provider)
export const getAllModels = () => providerRegistry.getAllModels()
export const validateProvider = (provider: string) => providerRegistry.validateProvider(provider)
export const validateAllProviders = () => providerRegistry.validateAllProviders()