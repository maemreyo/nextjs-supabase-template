import { 
  AIProvider, 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse, 
  AIModel, 
  AIError,
  OpenAIConfig 
} from '../types'

export class OpenAIProvider implements AIProvider {
  name = 'openai'
  private config: OpenAIConfig

  constructor(config: OpenAIConfig) {
    this.config = config
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    try {
      const response = await this.makeRequest('/chat/completions', {
        model: params.model || 'gpt-3.5-turbo',
        messages: this.buildMessages(params),
        max_tokens: params.maxTokens || 1000,
        temperature: params.temperature || 0.7,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stop: params.stopSequences,
        stream: false
      })

      return this.parseTextResponse(response, params)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    try {
      const response = await this.makeRequest('/embeddings', {
        model: params.model || 'text-embedding-ada-002',
        input: params.input
      })

      return this.parseEmbeddingResponse(response, params)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await this.makeRequest('/models', {})
      const models = response.data.filter((model: any) => 
        model.id.includes('gpt') || 
        model.id.includes('text-embedding') ||
        model.id.includes('dall-e') ||
        model.id.includes('tts') ||
        model.id.includes('whisper')
      )

      return models.map((model: any) => this.mapModelToAIModel(model))
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error)
      return this.getDefaultModels()
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
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

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const url = this.config.baseURL || 'https://api.openai.com/v1'
    const maxRetries = this.config.retryAttempts || 3
    const retryDelay = this.config.retryDelay || 1000

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${url}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            ...(this.config.organization && { 'OpenAI-Organization': this.config.organization })
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.config.timeout || 30000)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  private buildMessages(params: GenerateTextParams): any[] {
    const messages: any[] = []

    // Add system message if provided
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt })
    }

    // Add conversation history if provided
    if (params.conversationHistory) {
      messages.push(...params.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })))
    }

    // Add current user message
    messages.push({ role: 'user', content: params.prompt })

    return messages
  }

  private parseTextResponse(response: any, params: GenerateTextParams): GenerateTextResponse {
    const choice = response.choices[0]
    const usage = response.usage

    return {
      text: choice.message.content,
      model: response.model,
      provider: this.name,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost: this.calculateCost(response.model, usage.total_tokens),
      finishReason: choice.finish_reason,
      metadata: {
        ...params.metadata,
        responseId: response.id,
        created: response.created,
        systemFingerprint: response.system_fingerprint
      }
    }
  }

  private parseEmbeddingResponse(response: any, params: GenerateEmbeddingParams): GenerateEmbeddingResponse {
    const usage = response.usage
    const embeddings = Array.isArray(response.data[0].embedding) 
      ? [response.data[0].embedding]
      : response.data.map((item: any) => item.embedding)

    return {
      embeddings,
      model: response.model,
      provider: this.name,
      usage: {
        promptTokens: usage.prompt_tokens,
        totalTokens: usage.total_tokens
      },
      cost: this.calculateCost(response.model, usage.total_tokens),
      metadata: params.metadata
    }
  }

  private mapModelToAIModel(model: any): AIModel {
    const modelInfo = this.getModelInfo(model.id)
    
    return {
      id: model.id,
      name: modelInfo.displayName || model.id,
      provider: this.name,
      type: modelInfo.type,
      maxTokens: modelInfo.maxTokens,
      costPerToken: modelInfo.costPerToken,
      costPerRequest: modelInfo.costPerRequest,
      capabilities: modelInfo.capabilities
    }
  }

  private getModelInfo(modelId: string) {
    const modelMap: Record<string, any> = {
      // GPT models
      'gpt-4-turbo-preview': {
        displayName: 'GPT-4 Turbo',
        type: 'text',
        maxTokens: 128000,
        costPerToken: 0.00001,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      'gpt-4': {
        displayName: 'GPT-4',
        type: 'text',
        maxTokens: 8192,
        costPerToken: 0.00003,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      'gpt-3.5-turbo': {
        displayName: 'GPT-3.5 Turbo',
        type: 'text',
        maxTokens: 4096,
        costPerToken: 0.0000015,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      // Embedding models
      'text-embedding-ada-002': {
        displayName: 'Text Embedding Ada',
        type: 'embedding',
        maxTokens: 8191,
        costPerToken: 0.0000001,
        costPerRequest: 0,
        capabilities: ['embedding']
      },
      // Image models
      'dall-e-3': {
        displayName: 'DALL-E 3',
        type: 'image',
        maxTokens: 0,
        costPerToken: 0,
        costPerRequest: 0.04,
        capabilities: ['image-generation']
      }
    }

    return modelMap[modelId] || {
      displayName: modelId,
      type: 'text',
      maxTokens: 4096,
      costPerToken: 0.000001,
      costPerRequest: 0,
      capabilities: ['text-generation']
    }
  }

  private calculateCost(model: string, tokens: number): number {
    const modelInfo = this.getModelInfo(model)
    return (tokens * modelInfo.costPerToken) + modelInfo.costPerRequest
  }

  private getDefaultModels(): AIModel[] {
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: this.name,
        type: 'text',
        maxTokens: 4096,
        costPerToken: 0.0000015,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: this.name,
        type: 'text',
        maxTokens: 8192,
        costPerToken: 0.00003,
        costPerRequest: 0,
        capabilities: ['text-generation', 'function-calling']
      },
      {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada',
        provider: this.name,
        type: 'embedding',
        maxTokens: 8191,
        costPerToken: 0.0000001,
        costPerRequest: 0,
        capabilities: ['embedding']
      }
    ]
  }

  private handleError(error: any): AIError {
    if (error.name === 'AbortError') {
      const aiError: AIError = new Error('Request timeout') as AIError
      aiError.code = 'TIMEOUT'
      aiError.provider = this.name
      aiError.isRetryable = true
      return aiError
    }

    if (error.message.includes('401')) {
      const aiError: AIError = new Error('Invalid API key') as AIError
      aiError.code = 'INVALID_API_KEY'
      aiError.provider = this.name
      aiError.statusCode = 401
      aiError.isRetryable = false
      return aiError
    }

    if (error.message.includes('429')) {
      const aiError: AIError = new Error('Rate limit exceeded') as AIError
      aiError.code = 'RATE_LIMIT'
      aiError.provider = this.name
      aiError.statusCode = 429
      aiError.isRetryable = true
      return aiError
    }

    if (error.message.includes('insufficient_quota')) {
      const aiError: AIError = new Error('Insufficient quota') as AIError
      aiError.code = 'INSUFFICIENT_QUOTA'
      aiError.provider = this.name
      aiError.statusCode = 402
      aiError.isRetryable = false
      return aiError
    }

    const aiError: AIError = new Error(error.message) as AIError
    aiError.code = 'UNKNOWN_ERROR'
    aiError.provider = this.name
    aiError.isRetryable = true
    aiError.metadata = { originalError: error }
    return aiError
  }
}