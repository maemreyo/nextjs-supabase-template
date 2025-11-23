import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSupabase } from '@/components/providers/supabase-provider';

interface AnalysisDetailResponse {
  success: boolean;
  data: any; // Dữ liệu phân tích với các trường liên quan
}

interface UseSavedAnalysisDetailOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

/**
 * Hook để lấy chi tiết một phân tích đã lưu
 * Hỗ trợ cả 3 loại phân tích: word, sentence, paragraph
 * Cache results với React Query
 */
export function useSavedAnalysisDetail(
  id: string | null,
  options: UseSavedAnalysisDetailOptions = {}
) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { getAccessToken } = useSupabase();

  const queryKey = queryKeys.api.withParams('/api/analyses/[id]', { id });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!id) {
        throw new Error('Analysis ID is required');
      }

      console.log('🔍 [DEBUG] useSavedAnalysisDetail - Fetching analysis detail', { id });

      try {
        // Get access token for authentication
        const token = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add authorization header if token is available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/analyses/${id}`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch analysis detail: ${response.status} ${response.statusText}`
          );
        }

        const result: AnalysisDetailResponse = await response.json();
        
        console.log('🔍 [DEBUG] useSavedAnalysisDetail - Fetch successful', {
          analysisType: result.data?.analysis_type,
          hasData: !!result.data,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useSavedAnalysisDetail - Fetch failed', error);
        throw error instanceof Error ? error : new Error('Failed to fetch analysis detail');
      }
    },
    enabled: enabled && !!id,
    refetchOnWindowFocus,
    staleTime,
  });

  // Utility functions for cache management
  const queryClient = useQueryClient();
  
  const invalidateCache = () => {
    console.log('🔍 [DEBUG] useSavedAnalysisDetail - Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: queryKeys.api.endpoint('/api/analyses/[id]'),
    });
  };

  return {
    analysis: data?.data || null,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    invalidateCache,
  };
}

export type { AnalysisDetailResponse, UseSavedAnalysisDetailOptions };