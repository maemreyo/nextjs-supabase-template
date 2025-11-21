import { useState, useCallback, useRef, useEffect } from 'react';
import { useWordAnalysisMutation } from './useWordAnalysis';
import { useSentenceAnalysisMutation } from './useSentenceAnalysis';
import { useParagraphAnalysisMutation } from './useParagraphAnalysis';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

interface UseOptimizedAnalysisOptions {
  debounceMs?: number;
  enableAutoAnalysis?: boolean;
  onSuccess?: (result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis) => void;
  onError?: (error: Error) => void;
}

export function useOptimizedAnalysis(options: UseOptimizedAnalysisOptions = {}) {
  const {
    debounceMs = 800,
    enableAutoAnalysis = true,
    onSuccess,
    onError
  } = options;

  // Mutations
  const wordAnalysisMutation = useWordAnalysisMutation();
  const sentenceAnalysisMutation = useSentenceAnalysisMutation();
  const paragraphAnalysisMutation = useParagraphAnalysisMutation();

  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<{ text: string; type: 'word' | 'sentence' | 'paragraph' } | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  // Get appropriate mutation based on type
  const getMutation = useCallback((type: 'word' | 'sentence' | 'paragraph') => {
    switch (type) {
      case 'word':
        return wordAnalysisMutation;
      case 'sentence':
        return sentenceAnalysisMutation;
      case 'paragraph':
        return paragraphAnalysisMutation;
      default:
        throw new Error(`Invalid analysis type: ${type}`);
    }
  }, [wordAnalysisMutation, sentenceAnalysisMutation, paragraphAnalysisMutation]);

  // Prepare request data based on type
  const prepareRequestData = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    switch (type) {
      case 'word': {
        const words = text.split(/\s+/);
        const wordToAnalyze = words[0];
        const sentenceContext = words.slice(0, 5).join(' '); // First 5 words as context
        
        if (!wordToAnalyze) {
          throw new Error('Không tìm thấy từ để phân tích');
        }
        
        return {
          word: wordToAnalyze,
          sentenceContext,
          paragraphContext: ''
        };
      }
      case 'sentence':
        return {
          sentence: text,
          paragraphContext: ''
        };
      case 'paragraph':
        return {
          paragraph: text
        };
      default:
        throw new Error(`Invalid analysis type: ${type}`);
    }
  }, []);

  // Core analysis function
  const performAnalysis = useCallback(async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
    if (!text.trim()) {
      throw new Error('Văn bản không được để trống');
    }

    setIsAnalyzing(true);
    setError(null);
    currentRequestRef.current = { text, type };

    try {
      const mutation = getMutation(type);
      const requestData = prepareRequestData(text, type);
      
      const result = await mutation.mutateAsync(requestData as any);
      
      setCurrentAnalysis(result);
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Phân tích thất bại');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
      currentRequestRef.current = null;
    }
  }, [getMutation, prepareRequestData, onSuccess, onError]);

  // Debounced analysis function
  const debouncedAnalysis = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    if (!enableAutoAnalysis) return;

    // Clear existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Set new timeout
    analysisTimeoutRef.current = setTimeout(() => {
      performAnalysis(text, type);
    }, debounceMs);
  }, [enableAutoAnalysis, debounceMs, performAnalysis]);

  // Cancel current analysis
  const cancelAnalysis = useCallback(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Cancel ongoing mutations if possible
    wordAnalysisMutation.reset();
    sentenceAnalysisMutation.reset();
    paragraphAnalysisMutation.reset();
    
    setIsAnalyzing(false);
    currentRequestRef.current = null;
  }, [wordAnalysisMutation, sentenceAnalysisMutation, paragraphAnalysisMutation]);

  // Retry last failed analysis
  const retryAnalysis = useCallback(() => {
    if (currentRequestRef.current) {
      const { text, type } = currentRequestRef.current;
      return performAnalysis(text, type);
    }
    throw new Error('Không có phân tích nào để thử lại');
  }, [performAnalysis]);

  // Check if analysis is cached
  const isAnalysisCached = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    // This would integrate with your caching system
    // For now, return false
    return false;
  }, []);

  // Get cached analysis
  const getCachedAnalysis = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    // This would integrate with your caching system
    // For now, return null
    return null;
  }, []);

  return {
    // State
    isAnalyzing,
    currentAnalysis,
    error,
    
    // Actions
    analyzeText: performAnalysis,
    analyzeTextDebounced: debouncedAnalysis,
    cancelAnalysis,
    retryAnalysis,
    
    // Utilities
    isAnalysisCached,
    getCachedAnalysis,
    
    // Mutation states
    wordMutation: wordAnalysisMutation,
    sentenceMutation: sentenceAnalysisMutation,
    paragraphMutation: paragraphAnalysisMutation,
  };
}

export default useOptimizedAnalysis;