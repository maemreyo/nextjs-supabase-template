import { 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse,
  AIResponse,
  UsageCheckResponse
} from './types'

// Client-side AI service that communicates with API routes
export class AIServiceClient {
  private baseURL: string

  constructor(baseURL = '/api/ai') {
    this.baseURL = baseURL
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const response = await this.fetchAPI<GenerateTextResponse>('/generate-text', {
      method: 'POST',
      body: params
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate text')
    }

    return response.data
  }

  async generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> {
    const response = await this.fetchAPI<GenerateEmbeddingResponse>('/generate-embedding', {
      method: 'POST',
      body: params
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate embedding')
    }

    return response.data
  }

  async checkUsage(userId?: string): Promise<UsageCheckResponse> {
    const response = await this.fetchAPI<UsageCheckResponse>('/check-usage', {
      method: 'GET',
      query: userId ? { userId } : undefined
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to check usage')
    }

    return response.data
  }

  async getModels() {
    const response = await this.fetchAPI('/models', {
      method: 'GET'
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get models')
    }

    return response.data
  }

  async getProviderStatus() {
    const response = await this.fetchAPI('/provider-status', {
      method: 'GET'
    })

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get provider status')
    }

    return response.data
  }

  private async fetchAPI<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      body?: any
      query?: Record<string, string>
    } = {}
  ): Promise<AIResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    // Get auth token from Supabase session
    const { supabase } = await import('@/lib/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if session exists
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers
    }

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url.toString(), fetchOptions)
      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }
}

// Default client instance
export const aiServiceClient = new AIServiceClient()

// Factory function
export function createAIServiceClient(baseURL?: string): AIServiceClient {
  return new AIServiceClient(baseURL)
}