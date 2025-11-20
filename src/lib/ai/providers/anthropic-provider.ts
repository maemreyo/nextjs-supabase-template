import { 
  AIProvider, 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse, 
  AIModel, 
  AIError,
  AnthropicConfig 
} from '../types'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'
  private config: AnthropicConfig

  constructor(config: AnthropicConfig) {
    this.config = config
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    // Implementation for Anthropic Claude API
    throw new Error('Anthropic provider not fully implemented yet')
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    // Anthropic doesn't currently support embeddings
    throw new Error('Anthropic does not support embeddings')
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: this.name,
        type: 'text',
        maxTokens: 200000,
        costPerToken: 0.00000025,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: this.name,
        type: 'text',
        maxTokens: 200000,
        costPerToken: 0.000003,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      }
    ]
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': this.config.version || '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        }),
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  private handleError(error: any): AIError {
    const aiError: AIError = new Error(error.message) as AIError
    aiError.code = 'UNKNOWN_ERROR'
    aiError.provider = this.name
    aiError.isRetryable = true
    return aiError
  }
}