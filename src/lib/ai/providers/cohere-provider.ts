import { 
  AIProvider, 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse, 
  AIModel, 
  AIError,
  CohereConfig 
} from '../types'

export class CohereProvider implements AIProvider {
  name = 'cohere'
  private config: CohereConfig

  constructor(config: CohereConfig) {
    this.config = config
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    // Implementation for Cohere API
    throw new Error('Cohere provider not fully implemented yet')
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    // Implementation for Cohere embedding API
    throw new Error('Cohere provider not fully implemented yet')
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'command',
        name: 'Command',
        provider: this.name,
        type: 'text',
        maxTokens: 4096,
        costPerToken: 0.000003,
        costPerRequest: 0,
        capabilities: ['text-generation']
      },
      {
        id: 'command-nightly',
        name: 'Command Nightly',
        provider: this.name,
        type: 'text',
        maxTokens: 4096,
        costPerToken: 0.000003,
        costPerRequest: 0,
        capabilities: ['text-generation']
      },
      {
        id: 'embed-english-v3.0',
        name: 'Embed English v3.0',
        provider: this.name,
        type: 'embedding',
        maxTokens: 512,
        costPerToken: 0.0000001,
        costPerRequest: 0,
        capabilities: ['embedding']
      }
    ]
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
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