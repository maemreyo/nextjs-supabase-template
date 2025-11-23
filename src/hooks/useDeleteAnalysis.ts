import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSupabase } from '@/components/providers/supabase-provider';

type AnalysisType = 'word' | 'sentence' | 'paragraph';

interface DeleteAnalysisResponse {
  success: boolean;
  data: {
    deletedId: string;
    deletedType: AnalysisType;
    sessionUpdated: boolean;
  };
}

interface UseDeleteAnalysisOptions {
  onSuccess?: (data: DeleteAnalysisResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook để xóa phân tích
 * Gọi API endpoint /api/analyses/[id]
 * Xử lý loading state và error handling
 * Cập nhật cache sau khi xóa thành công
 */
export function useDeleteAnalysis(options: UseDeleteAnalysisOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;
  const { getAccessToken } = useSupabase();

  const deleteAnalysisMutation = useMutation<DeleteAnalysisResponse, Error, string>({
    mutationFn: async (id: string) => {
      console.log('🔍 [DEBUG] useDeleteAnalysis - Starting delete analysis', { id });

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
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to delete analysis: ${response.status} ${response.statusText}`
          );
        }

        const result: DeleteAnalysisResponse = await response.json();
        
        console.log('🔍 [DEBUG] useDeleteAnalysis - Delete successful', {
          deletedId: result.data.deletedId,
          deletedType: result.data.deletedType,
          sessionUpdated: result.data.sessionUpdated,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useDeleteAnalysis - Delete failed', error);
        throw error instanceof Error ? error : new Error('Failed to delete analysis');
      }
    },
    onMutate: async (id) => {
      console.log('🔍 [DEBUG] useDeleteAnalysis - onMutate', { id });

      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.api.endpoint('/api/analyses/list'),
      });

      // Snapshot previous data
      const previousData = queryClient.getQueryData(
        queryKeys.api.endpoint('/api/analyses/list')
      );

      // Optimistic update - remove the item from cache
      if (previousData && typeof previousData === 'object' && 'analyses' in previousData) {
        const typedPreviousData = previousData as { analyses: Array<{ id: string }> };
        queryClient.setQueryData(
          queryKeys.api.endpoint('/api/analyses/list'),
          {
            ...typedPreviousData,
            analyses: typedPreviousData.analyses.filter(item => item.id !== id),
          }
        );
      }

      return { previousData };
    },
    onError: (error, id, context: any) => {
      console.error('🔍 [DEBUG] useDeleteAnalysis - Mutation error callback', {
        error: error.message,
        id,
      });

      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.api.endpoint('/api/analyses/list'),
          context.previousData
        );
      }

      // Call custom error callback if provided
      onError?.(error);
    },
    onSuccess: (data, id) => {
      console.log('🔍 [DEBUG] useDeleteAnalysis - Mutation success callback', {
        deletedId: data.data.deletedId,
        deletedType: data.data.deletedType,
      });

      // Invalidate related queries to ensure cache consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/analyses/list'),
      });

      // Call custom success callback if provided
      onSuccess?.(data);
    },
    onSettled: () => {
      console.log('🔍 [DEBUG] useDeleteAnalysis - Mutation settled');
      
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/analyses/list'),
      });
    },
  });

  return {
    deleteAnalysis: deleteAnalysisMutation.mutate,
    deleteAnalysisAsync: deleteAnalysisMutation.mutateAsync,
    isLoading: deleteAnalysisMutation.isPending,
    isSuccess: deleteAnalysisMutation.isSuccess,
    isError: deleteAnalysisMutation.isError,
    error: deleteAnalysisMutation.error,
    data: deleteAnalysisMutation.data,
    reset: deleteAnalysisMutation.reset,
  };
}

export type { DeleteAnalysisResponse, UseDeleteAnalysisOptions };