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
      // DEBUG: Log để kiểm tra authentication state
      console.log('DEBUG: useParagraphAnalysis - Starting API call for paragraph:', paragraph.substring(0, 50) + '...');
      
      // DEBUG: Kiểm tra xem có access token không
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('DEBUG: useParagraphAnalysis - Session exists:', !!session);
      console.log('DEBUG: useParagraphAnalysis - Access token exists:', !!session?.access_token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // DEBUG: Thêm authorization header nếu có token
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('DEBUG: useParagraphAnalysis - Added Authorization header');
      } else {
        console.log('DEBUG: useParagraphAnalysis - No access token available');
      }
      
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          paragraph,
        } as AnalyzeParagraphRequest),
      });
      
      console.log('DEBUG: useParagraphAnalysis - Response status:', response.status);
      console.log('DEBUG: useParagraphAnalysis - Response ok:', response.ok);

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
      // FIX: Sử dụng supabase client trực tiếp thay vì hook
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        throw new Error('Authentication required: Please sign in to analyze paragraphs.');
      }
      
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      // Handle 401 specifically
      if (response.status === 401) {
        throw new Error('Authentication failed: Please sign in again to continue.');
      }

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
      // Don't retry authentication errors
      if (error.message.includes('Authentication')) {
        console.error('Authentication error detected, not retrying');
      }
    },
    retry: (failureCount, error) => {
      // Don't retry for authentication errors or after 2 attempts
      if (error.message.includes('Authentication') || failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
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
        // FIX: Sử dụng supabase client trực tiếp thay vì hook
        const { supabase } = await import('@/lib/supabase/client');
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const response = await fetch('/api/ai/analyze-paragraph', {
          method: 'POST',
          headers,
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