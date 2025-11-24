'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { PhraseAnalysis } from '@/lib/ai/types'
import { aiServiceClient } from '@/lib/ai/ai-service-client'

interface UsePhraseAnalysisState {
  isAnalyzing: boolean
  error: string | null
  data: PhraseAnalysis | null
}

interface UsePhraseAnalysisReturn extends UsePhraseAnalysisState {
  analyzePhrase: (phrase: string, sentenceContext?: string, paragraphContext?: string) => Promise<void>
  reset: () => void
}

export function usePhraseAnalysis(): UsePhraseAnalysisReturn {
  const [state, setState] = useState<UsePhraseAnalysisState>({
    isAnalyzing: false,
    error: null,
    data: null
  })

  const analyzePhrase = useCallback(async (
    phrase: string,
    sentenceContext?: string,
    paragraphContext?: string
  ) => {
    if (!phrase.trim()) {
      toast.error('Vui lòng nhập cụm từ cần phân tích')
      return
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const result = await aiServiceClient.analyzePhrase({
        phrase,
        sentenceContext: sentenceContext || '',
        paragraphContext: paragraphContext || ''
      })

      setState({
        isAnalyzing: false,
        error: null,
        data: result
      })

      toast.success('Phân tích cụm từ thành công')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Phân tích cụm từ thất bại'
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))

      toast.error(errorMessage)
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      error: null,
      data: null
    })
  }, [])

  return {
    ...state,
    analyzePhrase,
    reset
  }
}

export default usePhraseAnalysis