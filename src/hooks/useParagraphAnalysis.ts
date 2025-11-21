import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ParagraphAnalysis, AnalyzeParagraphRequest, AnalysisResponse } from '@/lib/ai/types';

// Query keys cho paragraph analysis
export const paragraphAnalysisKeys = {
  all: ['paragraph-analysis'] as const,
  detail: (paragraph: string) => 
    ['paragraph-analysis', 'detail', paragraph] as const,
};

/**
 * Hook để phân tích đoạn văn
 */
export function useParagraphAnalysis(
  paragraph: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options || {};

  return useQuery({
    queryKey: paragraphAnalysisKeys.detail(paragraph),
    queryFn: async (): Promise<ParagraphAnalysis> => {
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paragraph,
        } as AnalyzeParagraphRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze paragraph: ${response.statusText}`);
      }

      const result: AnalysisResponse<ParagraphAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze paragraph');
      }

      return result.data;
    },
    enabled: enabled && !!paragraph,
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
 * Hook để phân tích đoạn văn với mutation
 */
export function useParagraphAnalysisMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AnalyzeParagraphRequest): Promise<ParagraphAnalysis> => {
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze paragraph: ${response.statusText}`);
      }

      const result: AnalysisResponse<ParagraphAnalysis> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to analyze paragraph');
      }

      return result.data;
    },
    onSuccess: (data, variables) => {
      // Cache kết quả
      queryClient.setQueryData(
        paragraphAnalysisKeys.detail(variables.paragraph),
        data
      );
    },
    onError: (error) => {
      console.error('Paragraph analysis error:', error);
    },
  });
}

/**
 * Hook để prefetch paragraph analysis
 */
export function usePrefetchParagraphAnalysis() {
  const queryClient = useQueryClient();

  return (paragraph: string) => {
    queryClient.prefetchQuery({
      queryKey: paragraphAnalysisKeys.detail(paragraph),
      queryFn: async (): Promise<ParagraphAnalysis> => {
        const response = await fetch('/api/ai/analyze-paragraph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paragraph,
          } as AnalyzeParagraphRequest),
        });

        if (!response.ok) {
          throw new Error(`Failed to prefetch paragraph analysis: ${response.statusText}`);
        }

        const result: AnalysisResponse<ParagraphAnalysis> = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to prefetch paragraph analysis');
        }

        return result.data;
      },
      staleTime: 1000 * 60 * 30,
    });
  };
}

/**
 * Hook để invalidate paragraph analysis cache
 */
export function useInvalidateParagraphAnalysis() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: paragraphAnalysisKeys.all });
  };
}

/**
 * Hook để xóa paragraph analysis cache
 */
export function useClearParagraphAnalysisCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: paragraphAnalysisKeys.all });
  };
}

export default useParagraphAnalysis;