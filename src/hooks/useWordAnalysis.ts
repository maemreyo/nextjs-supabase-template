import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WordAnalysis, AnalyzeWordRequest, AnalysisResponse } from '@/lib/ai/types';

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
  }
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options || {};

  return useQuery({
    queryKey: wordAnalysisKeys.detail(word, sentenceContext, paragraphContext),
    queryFn: async (): Promise<WordAnalysis> => {
      // DEBUG: Log để kiểm tra authentication state
      console.log('DEBUG: useWordAnalysis - Starting API call for word:', word);
      
      // DEBUG: Kiểm tra xem có access token không
      const { useSupabase } = await import('@/components/providers/supabase-provider');
      const { getAccessToken } = useSupabase();
      const accessToken = await getAccessToken();
      console.log('DEBUG: useWordAnalysis - Access token exists:', !!accessToken);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // DEBUG: Thêm authorization header nếu có token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
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
    enabled: enabled && !!word && !!sentenceContext,
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
 * Hook để phân tích từ với mutation
 */
export function useWordAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AnalyzeWordRequest): Promise<WordAnalysis> => {
      // Lấy access token cho mutation
      const { useSupabase } = await import('@/components/providers/supabase-provider');
      const { getAccessToken } = useSupabase();
      const accessToken = await getAccessToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
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

  return (word: string, sentenceContext: string, paragraphContext?: string) => {
    queryClient.prefetchQuery({
      queryKey: wordAnalysisKeys.detail(word, sentenceContext, paragraphContext),
      queryFn: async (): Promise<WordAnalysis> => {
        // Lấy access token cho prefetch
        const { useSupabase } = await import('@/components/providers/supabase-provider');
        const { getAccessToken } = useSupabase();
        const accessToken = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
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