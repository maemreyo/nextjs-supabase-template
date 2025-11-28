import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import { useSupabase } from '@/components/providers/supabase-provider';
import { clientLogger } from '@/services/logger';

type AnalysisType = 'word' | 'sentence' | 'paragraph' | 'phrase';
type AnalysisData = WordAnalysis | SentenceAnalysis | ParagraphAnalysis | PhraseAnalysis;

interface SaveAnalysisParams {
  type: AnalysisType;
  text: string;
  analysisData: AnalysisData;
  sessionId?: string;
  documentId?: string;
}

interface SaveAnalysisResponse {
  success: boolean;
  data: {
    analysisId: string;
    sessionAnalysisId?: string;
    type: AnalysisType;
  };
}

interface UseAnalysisSaveOptions {
  onSuccess?: (data: SaveAnalysisResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook để lưu kết quả phân tích vào database
 * Hỗ trợ lưu cả 3 loại phân tích: word, sentence, paragraph
 */
export function useAnalysisSave(options: UseAnalysisSaveOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;
  const { getAccessToken } = useSupabase();

  const saveAnalysisMutation = useMutation<SaveAnalysisResponse, Error, SaveAnalysisParams>({
    mutationFn: async (params: SaveAnalysisParams) => {
      clientLogger.start('Analysis save', { type: params.type })

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

        const response = await fetch('/api/analyses/save', {
          method: 'POST',
          headers,
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to save analysis: ${response.status} ${response.statusText}`
          );
        }

        const result: SaveAnalysisResponse = await response.json();

        clientLogger.success('Analysis saved successfully', { analysisId: result.data.analysisId, type: result.data.type })

        return result;
      } catch (error) {
        clientLogger.error('Analysis save failed', { type: params.type })
        throw error instanceof Error ? error : new Error('Failed to save analysis');
      }
    },
    onSuccess: (data, variables) => {
      console.log('🔍 [DEBUG] useAnalysisSave - Mutation success callback', {
        analysisId: data.data.analysisId,
        type: data.data.type,
      });

      // Invalidate related queries to refresh cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/analyses/list'),
      });

      // Call custom success callback if provided
      onSuccess?.(data);
    },
    onError: (error, variables) => {
      console.error('🔍 [DEBUG] useAnalysisSave - Mutation error callback', {
        error: error.message,
        variables: {
          type: variables.type,
          textLength: variables.text.length,
        },
      });

      // Call custom error callback if provided
      onError?.(error);
    },
  });

  return {
    saveAnalysis: saveAnalysisMutation.mutate,
    saveAnalysisAsync: saveAnalysisMutation.mutateAsync,
    isLoading: saveAnalysisMutation.isPending,
    isSuccess: saveAnalysisMutation.isSuccess,
    isError: saveAnalysisMutation.isError,
    error: saveAnalysisMutation.error,
    data: saveAnalysisMutation.data,
    reset: saveAnalysisMutation.reset,
  };
}

export type { SaveAnalysisParams, SaveAnalysisResponse, UseAnalysisSaveOptions };