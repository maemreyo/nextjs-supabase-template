'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  GenerateTextParams, 
  GenerateTextResponse, 
  GenerateEmbeddingParams, 
  GenerateEmbeddingResponse,
  AIModel,
  AIError 
} from '@/lib/ai/types'
import { aiServiceClient } from '@/lib/ai/ai-service-client'

interface UseAIServiceState {
  isLoading: boolean
  error: string | null
  lastResponse: GenerateTextResponse | GenerateEmbeddingResponse | null
}

interface UseAIServiceReturn extends UseAIServiceState {
  generateText: (params: GenerateTextParams) => Promise<GenerateTextResponse>
  generateEmbedding: (params: GenerateEmbeddingParams) => Promise<GenerateEmbeddingResponse>
  getModels: () => Promise<AIModel[]>
  clearError: () => void
  reset: () => void
}

export function useAIService(): UseAIServiceReturn {
  const [state, setState] = useState<UseAIServiceState>({
    isLoading: false,
    error: null,
    lastResponse: null
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      lastResponse: null
    })
  }, [])

  const generateText = useCallback(async (params: GenerateTextParams): Promise<GenerateTextResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await aiServiceClient.generateText(params)
      
      setState(prev => ({
        ...prev,
        lastResponse: response,
        error: null
      }))

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const generateEmbedding = useCallback(async (params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await aiServiceClient.generateEmbedding(params)
      
      setState(prev => ({
        ...prev,
        lastResponse: response,
        error: null
      }))

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const getModels = useCallback(async (): Promise<AIModel[]> => {
    try {
      const models = await aiServiceClient.getModels() as AIModel[]
      return models || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      return []
    }
  }, [setError])

  return {
    ...state,
    generateText,
    generateEmbedding,
    getModels,
    clearError,
    reset
  }
}

// Hook for text generation with auto-reset
export function useTextGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<GenerateTextResponse | null>(null)

  const generate = useCallback(async (params: GenerateTextParams) => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await aiServiceClient.generateText(params)
      setResponse(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsGenerating(false)
    setError(null)
    setResponse(null)
  }, [])

  return {
    isGenerating,
    error,
    response,
    generate,
    reset
  }
}

// Hook for embedding generation with auto-reset
export function useEmbeddingGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<GenerateEmbeddingResponse | null>(null)

  const generate = useCallback(async (params: GenerateEmbeddingParams) => {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await aiServiceClient.generateEmbedding(params)
      setResponse(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsGenerating(false)
    setError(null)
    setResponse(null)
  }, [])

  return {
    isGenerating,
    error,
    response,
    generate,
    reset
  }
}

// Hook for streaming text generation
export function useStreamingTextGeneration() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [response, setResponse] = useState<GenerateTextResponse | null>(null)

  const generate = useCallback(async (params: GenerateTextParams) => {
    setIsStreaming(true)
    setError(null)
    setText('')

    try {
      // For now, use non-streaming API
      // In a real implementation, you would use streaming API
      const result = await aiServiceClient.generateText(params)
      setText(result.text)
      setResponse(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsStreaming(false)
    setError(null)
    setText('')
    setResponse(null)
  }, [])

  return {
    isStreaming,
    error,
    text,
    response,
    generate,
    reset
  }
}