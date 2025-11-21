import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SentenceAnalysis, AnalyzeSentenceRequest, AnalysisResponse } from '@/lib/ai/types';

// Query keys cho sentence analysis
export const sentenceAnalysisKeys = {
  all: ['sentence-analysis'] as const,
  detail: (sentence: string, paragraphContext?: string) => 
    ['sentence-analysis', 'detail', sentence, paragraphContext] as const,
};

/**
 * Hook để phân tích câu
 */
export function useSentenceAnalysis(
  sentence: string,
  paragraphContext?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options || {};

  return useQuery({
    queryKey: sentenceAnalysisKeys.detail(sentence, paragraphContext),
    queryFn: async (): Promise<SentenceAnalysis> => {
      const response = await fetch('/api/ai/analyze-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentence,
          paragraphContext,
        } as AnalyzeSentenceRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze sentence: ${response.statusText}`);
      }

      const result: AnalysisResponse<SentenceAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze sentence');
      }

      return result.data;
    },
    enabled: enabled && !!sentence,
    staleTime,
    retry: (failureCount, error) => {
      // Không retry cho lỗi 4xx (client errors)
      if (error.message.includes('4') || failureCount >= 3) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook để phân tích câu với mutation
 */
export function useSentenceAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AnalyzeSentenceRequest): Promise<SentenceAnalysis> => {
      const response = await fetch('/api/ai/analyze-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze sentence: ${response.statusText}`);
      }

      const result: AnalysisResponse<SentenceAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze sentence');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Cache kết quả
      queryClient.setQueryData(
        sentenceAnalysisKeys.detail(variables.sentence, variables.paragraphContext),
        data
      );
    },
    onError: (error) => {
      console.error('Sentence analysis error:', error);
    },
  });
}

/**
 * Hook để prefetch sentence analysis
 */
export function usePrefetchSentenceAnalysis() {
  const queryClient = useQueryClient();

  return (sentence: string, paragraphContext?: string) => {
    queryClient.prefetchQuery({
      queryKey: sentenceAnalysisKeys.detail(sentence, paragraphContext),
      queryFn: async (): Promise<SentenceAnalysis> => {
        const response = await fetch('/api/ai/analyze-sentence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sentence,
            paragraphContext,
          } as AnalyzeSentenceRequest),
        });

        if (!response.ok) {
          throw new Error(`Failed to prefetch sentence analysis: ${response.statusText}`);
        }

        const result: AnalysisResponse<SentenceAnalysis> = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to prefetch sentence analysis');
        }

        return result.data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };
}

/**
 * Hook để invalidate sentence analysis cache
 */
export function useInvalidateSentenceAnalysis() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: sentenceAnalysisKeys.all });
  };
}

/**
 * Hook để xóa sentence analysis cache
 */
export function useClearSentenceAnalysisCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: sentenceAnalysisKeys.all });
  };
}

export default useSentenceAnalysis;