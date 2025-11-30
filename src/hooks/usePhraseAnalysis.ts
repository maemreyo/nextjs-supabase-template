import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PhraseAnalysis, AnalyzePhraseRequest, AnalysisResponse } from '@/lib/ai/types';
import { useSupabase } from '@/components/providers/supabase-provider';
import { clientLogger, analysisLogger } from '@/services/logger';

// Query keys cho phrase analysis
export const phraseAnalysisKeys = {
  all: ['phrase-analysis'] as const,
  detail: (phrase: string, sentenceContext: string, paragraphContext?: string) =>
    ['phrase-analysis', 'detail', phrase, sentenceContext, paragraphContext] as const,
};

/**
 * Hook để phân tích cụm từ
 */
export function usePhraseAnalysis(
  phrase: string,
  sentenceContext: string,
  paragraphContext?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options || {};
  const { getAccessToken } = useSupabase();

  return useQuery({
    queryKey: phraseAnalysisKeys.detail(phrase, sentenceContext, paragraphContext),
    queryFn: async (): Promise<PhraseAnalysis> => {
      // DEBUG: Log để kiểm tra authentication state
      // Get access token for authentication
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
      }
      
      const response = await fetch('/api/ai/analyze-phrase', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phrase,
          sentenceContext,
          paragraphContext,
        } as AnalyzePhraseRequest),
      });
      

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze phrase: ${response.statusText}`);
      }

      const result: AnalysisResponse<PhraseAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze phrase');
      }

      return result.data;
    },
    enabled: enabled && !!phrase && !!sentenceContext,
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
 * Hook để phân tích cụm từ với mutation
 */
export function usePhraseAnalysisMutation(options?: {
  onSuccess?: (data: PhraseAnalysis, variables: AnalyzePhraseRequest) => void;
  onSwitchToTab?: (analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
}) {
  const queryClient = useQueryClient();
  const { getAccessToken } = useSupabase();
  const { onSuccess, onSwitchToTab } = options || {};

  return useMutation({
    mutationFn: async (params: AnalyzePhraseRequest): Promise<PhraseAnalysis> => {
      // Get access token for authentication
      const token = await getAccessToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/ai/analyze-phrase', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze phrase: ${response.statusText}`);
      }

      const result: AnalysisResponse<PhraseAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze phrase');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Cache kết quả
      queryClient.setQueryData(
        phraseAnalysisKeys.detail(variables.phrase, variables.sentenceContext, variables.paragraphContext),
        data
      );
      
      // Invalidate phrase analyses queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['phrase-analyses'],
        refetchType: 'active'
      });
      
      // Log success
      analysisLogger.success('Phrase analysis completed successfully', {
        phrase: variables.phrase,
        analysisType: 'phrase'
      });
      
      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data, variables);
      }
      
      // Auto-switch to phrase tab on success if callback provided
      if (onSwitchToTab) {
        onSwitchToTab('phrase');
        analysisLogger.info('Auto-switched to phrase tab after successful analysis', {
          phrase: variables.phrase
        });
      }
    },
    onError: (error) => {
      clientLogger.error('Phrase analysis mutation failed', {
        error: error.message || error,
        operation: 'phrase-analysis'
      });
    },
  });
}

/**
 * Hook để prefetch phrase analysis
 */
export function usePrefetchPhraseAnalysis() {
  const queryClient = useQueryClient();
  const { getAccessToken } = useSupabase();

  return (phrase: string, sentenceContext: string, paragraphContext?: string) => {
    queryClient.prefetchQuery({
      queryKey: phraseAnalysisKeys.detail(phrase, sentenceContext, paragraphContext),
      queryFn: async (): Promise<PhraseAnalysis> => {
        // Get access token for authentication
        const token = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/ai/analyze-phrase', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phrase,
            sentenceContext,
            paragraphContext,
          } as AnalyzePhraseRequest),
        });

        if (!response.ok) {
          throw new Error(`Failed to prefetch phrase analysis: ${response.statusText}`);
        }

        const result: AnalysisResponse<PhraseAnalysis> = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to prefetch phrase analysis');
        }

        return result.data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };
}

/**
 * Hook để invalidate phrase analysis cache
 */
export function useInvalidatePhraseAnalysis() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: phraseAnalysisKeys.all });
  };
}

/**
 * Hook để xóa phrase analysis cache
 */
export function useClearPhraseAnalysisCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: phraseAnalysisKeys.all });
  };
}

export default usePhraseAnalysis;