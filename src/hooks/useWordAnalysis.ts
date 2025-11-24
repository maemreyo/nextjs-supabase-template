import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WordAnalysis, AnalyzeWordRequest, AnalysisResponse } from '@/lib/ai/types';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useSavedAnalysis, useSavedAnalysisByWord } from './useSavedAnalysis';

// Query keys cho word analysis
export const wordAnalysisKeys = {
  all: ['word-analysis'] as const,
  detail: (word: string, sentenceContext: string, paragraphContext?: string) => 
    ['word-analysis', 'detail', word, sentenceContext, paragraphContext] as const,
};

/**
 * Hook để phân tích từ
 */
export function useWordAnalysis(
  word: string,
  sentenceContext: string,
  paragraphContext?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    checkSavedFirst?: boolean;
    sessionId?: string;
    wordId?: string;
  }
) {
  const {
    enabled = true,
    staleTime = 1000 * 60 * 30,
    checkSavedFirst = false,
    sessionId,
    wordId
  } = options || {};
  const { getAccessToken } = useSupabase();

  // Try to get saved analysis first if enabled
  const savedAnalysisQuery = useSavedAnalysis(wordId, sessionId, {
    enabled: checkSavedFirst && !!wordId,
    staleTime
  });

  const savedAnalysisByWordQuery = useSavedAnalysisByWord(word, sessionId, {
    enabled: checkSavedFirst && !!word && !!sessionId && !wordId,
    staleTime
  });

  const savedAnalysis = wordId ? savedAnalysisQuery.data : savedAnalysisByWordQuery.data;

  return useQuery({
    queryKey: wordAnalysisKeys.detail(word, sentenceContext, paragraphContext),
    queryFn: async (): Promise<WordAnalysis> => {
      // If we have a saved analysis, return it
      if (savedAnalysis) {
        console.log('🔍 [DEBUG] useWordAnalysis - Using saved analysis', {
          word: savedAnalysis.meta.word,
          source: wordId ? 'wordId' : 'word+sessionId'
        });
        return savedAnalysis;
      }
      // DEBUG: Log để kiểm tra authentication state
      console.log('DEBUG: useWordAnalysis - Starting API call for word:', word);
      
      // Get access token for authentication
      const token = await getAccessToken();
      console.log('DEBUG: useWordAnalysis - Access token exists:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('DEBUG: useWordAnalysis - Added Authorization header');
      } else {
        console.log('DEBUG: useWordAnalysis - No access token available');
      }
      
      const response = await fetch('/api/ai/analyze-word', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          word,
          sentenceContext,
          paragraphContext,
        } as AnalyzeWordRequest),
      });
      
      console.log('DEBUG: useWordAnalysis - Response status:', response.status);
      console.log('DEBUG: useWordAnalysis - Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze word: ${response.statusText}`);
      }

      const result: AnalysisResponse<WordAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze word');
      }

      return result.data;
    },
    enabled: enabled && !!word && !!sentenceContext && (!checkSavedFirst || !savedAnalysis),
    staleTime,
    retry: (failureCount, error) => {
      // Không retry cho lỗi 4xx (client errors)
      if (error.message.includes('4') || failureCount >= 3) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Add initial data from saved analysis if available
    initialData: savedAnalysis,
    initialDataUpdatedAt: savedAnalysis ? new Date().getTime() : undefined,
  });
}

/**
 * Hook để phân tích từ với mutation
 */
export function useWordAnalysisMutation() {
  const queryClient = useQueryClient();
  const { getAccessToken } = useSupabase();
  
  return useMutation({
    mutationFn: async (params: AnalyzeWordRequest): Promise<WordAnalysis> => {
      console.log('DEBUG: useWordAnalysisMutation - params received:', params);
      // Get access token for authentication
      const token = await getAccessToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/ai/analyze-word', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze word: ${response.statusText}`);
      }

      const result: AnalysisResponse<WordAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze word');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Cache kết quả
      queryClient.setQueryData(
        wordAnalysisKeys.detail(variables.word, variables.sentenceContext, variables.paragraphContext),
        data
      );
    },
    onError: (error) => {
      console.error('Word analysis error:', error);
    },
  });
}

/**
 * Hook để prefetch word analysis
 */
export function usePrefetchWordAnalysis() {
  const queryClient = useQueryClient();
  const { getAccessToken } = useSupabase();

  return (word: string, sentenceContext: string, paragraphContext?: string) => {
    queryClient.prefetchQuery({
      queryKey: wordAnalysisKeys.detail(word, sentenceContext, paragraphContext),
      queryFn: async (): Promise<WordAnalysis> => {
        // Get access token for authentication
        const token = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/ai/analyze-word', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            word,
            sentenceContext,
            paragraphContext,
          } as AnalyzeWordRequest),
        });

        if (!response.ok) {
          throw new Error(`Failed to prefetch word analysis: ${response.statusText}`);
        }

        const result: AnalysisResponse<WordAnalysis> = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to prefetch word analysis');
        }

        return result.data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };
}

/**
 * Hook để invalidate word analysis cache
 */
export function useInvalidateWordAnalysis() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: wordAnalysisKeys.all });
  };
}

/**
 * Hook để xóa word analysis cache
 */
export function useClearWordAnalysisCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: wordAnalysisKeys.all });
  };
}

export default useWordAnalysis;