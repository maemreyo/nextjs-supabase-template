import {
  AIProvider,
  GenerateTextParams,
  GenerateTextResponse,
  GenerateEmbeddingParams,
  GenerateEmbeddingResponse,
  AIModel,
  AIError,
  GoogleAIConfig
} from '../types'
import { GoogleGenAI } from '@google/genai'

export class GoogleAIProvider implements AIProvider {
  name = 'google'
  private config: GoogleAIConfig
  private client: GoogleGenAI

  constructor(config: GoogleAIConfig) {
    this.config = config
    this.client = new GoogleGenAI({ apiKey: config.apiKey })
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    try {
      const response = await this.client.models.generateContent({
        model: params.model || 'gemini-2.5-flash',
        contents: params.prompt,
        config: {
          maxOutputTokens: params.maxTokens || 4000,
          temperature: params.temperature || 0.7,
          topP: params.topP,
          stopSequences: params.stopSequences
        }
      })

      if (!response.text) {
        throw new Error('No response generated from Google AI')
      }

      const text = response.text
      const rawFinishReason = response.candidates?.[0]?.finishReason
      let finishReason: 'stop' | 'length' | 'content_filter' = 'stop'
      
      // Map Google's FinishReason to our expected types
      if (rawFinishReason) {
        if (rawFinishReason.toString().includes('STOP')) {
          finishReason = 'stop'
        } else if (rawFinishReason.toString().includes('LENGTH')) {
          finishReason = 'length'
        } else if (rawFinishReason.toString().includes('FILTER')) {
          finishReason = 'content_filter'
        }
      }
      
      // Use token count from response if available, otherwise estimate
      const promptTokens = response.usageMetadata?.promptTokenCount || this.estimateTokens(params.prompt)
      const completionTokens = response.usageMetadata?.candidatesTokenCount || this.estimateTokens(text)
      const totalTokens = response.usageMetadata?.totalTokenCount || (promptTokens + completionTokens)

      return {
        text,
        model: params.model || 'gemini-2.5-flash',
        provider: this.name,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens
        },
        cost: this.calculateCost(totalTokens, params.model || 'gemini-2.5-flash'),
        finishReason,
        metadata: {
          safetyRatings: response.candidates?.[0]?.safetyRatings,
          citationMetadata: response.candidates?.[0]?.citationMetadata
        }
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    try {
      const inputText = Array.isArray(params.input) ? (params.input[0] || '') : (params.input || '')
      
      const response = await this.client.models.embedContent({
        model: 'text-embedding-004',
        contents: [inputText],
        config: {
          taskType: "RETRIEVAL_DOCUMENT"
        }
      })

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('No embedding generated from Google AI')
      }

      const firstEmbedding = response.embeddings[0]
      if (!firstEmbedding) {
        throw new Error('Invalid embedding response from Google AI')
      }
      
      const tokens = firstEmbedding.statistics?.tokenCount || this.estimateTokens(inputText)

      return {
        embeddings: [firstEmbedding.values || []],
        model: 'text-embedding-004',
        provider: this.name,
        usage: {
          promptTokens: tokens,
          totalTokens: tokens
        },
        cost: this.calculateCost(tokens, 'text-embedding-004'),
        metadata: {
          taskType: "RETRIEVAL_DOCUMENT"
        }
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getModels(): Promise<AIModel[]> {
    return [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: this.name,
        type: 'text',
        maxTokens: 32768,
        costPerToken: 0.000000075,
        costPerRequest: 0,
        capabilities: ['text-generation']
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: this.name,
        type: 'text',
        maxTokens: 32768,
        costPerToken: 0.0000005,
        costPerRequest: 0,
        capabilities: ['text-generation']
      },
      {
        id: 'text-embedding-004',
        name: 'Text Embedding Model',
        provider: this.name,
        type: 'embedding',
        maxTokens: 2048,
        costPerToken: 0.0000001,
        costPerRequest: 0,
        capabilities: ['embedding']
      }
    ]
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new GoogleGenAI({ apiKey })
      const response = await client.models.list()
      // Handle Pager response - check if we got any models
      const models = []
      for await (const model of response) {
        models.push(model)
      }
      return models.length > 0
    } catch (error) {
      return false
    }
  }

  private handleError(error: any): AIError {
    const aiError: AIError = new Error(error.message || 'Unknown error') as AIError
    aiError.code = error.code || 'UNKNOWN_ERROR'
    aiError.provider = this.name
    aiError.isRetryable = error.isRetryable !== false
    return aiError
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    // This is a simplified estimation - in production, you'd want to use a proper tokenizer
    return Math.ceil(text.length / 4)
  }

  private calculateCost(tokens: number, model: string): number {
    const costPerToken: Record<string, number> = {
      'gemini-2.5-flash': 0.000000075,
      'gemini-pro': 0.0000005,
      'text-embedding-004': 0.0000001
    }
    
    return tokens * (costPerToken[model] || 0.0000005)
  }
}