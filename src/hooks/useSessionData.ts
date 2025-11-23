import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSupabase } from '@/components/providers/supabase-provider';
import type { AnalysisSession, SessionAnalysis, SessionSettings, SessionTag } from '@/types/sessions';

interface SessionDataResponse {
  session: AnalysisSession;
  analyses: (SessionAnalysis & {
    word_analysis?: any;
    sentence_analysis?: any;
    paragraph_analysis?: any;
  })[];
  settings?: SessionSettings;
  tags?: SessionTag[];
}

interface UseSessionDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

/**
 * Hook để tải dữ liệu chi tiết của một session
 * Bao gồm thông tin session, danh sách analyses, settings và tags
 */
export function useSessionData(sessionId: string | undefined, options: UseSessionDataOptions = {}) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { getAccessToken } = useSupabase();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.api.withParams('/api/sessions/load', { sessionId });

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
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      console.log('🔍 [DEBUG] useSessionData - Fetching session data', { sessionId });

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

        const response = await fetch(`/api/sessions/${sessionId}/load`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch session data: ${response.status} ${response.statusText}`
          );
        }

        const apiResponse = await response.json();
        
        // Handle different response formats
        let result: SessionDataResponse;
        
        if (apiResponse.success && apiResponse.data) {
          // API returns { success: true, data: { session, analyses, settings, tags } }
          result = apiResponse.data;
        } else {
          // API returns directly { session, analyses, settings, tags }
          result = apiResponse;
        }
        
        console.log('🔍 [DEBUG] useSessionData - Fetch successful', {
          sessionId,
          sessionTitle: result.session.title,
          analysesCount: result.analyses.length,
          hasSettings: !!result.settings,
          tagsCount: result.tags?.length || 0,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useSessionData - Fetch failed', error);
        throw error instanceof Error ? error : new Error('Failed to fetch session data');
      }
    },
    enabled: enabled && !!sessionId,
    refetchOnWindowFocus,
    staleTime,
  });

  // Utility functions for cache management
  const invalidateCache = () => {
    console.log('🔍 [DEBUG] useSessionData - Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: queryKeys.api.withParams('/api/sessions/load', { sessionId }),
    });
  };

  // Extract session text content from content column first, then fallback to analyses
  const getSessionText = useCallback(() => {
    // First, try to get content from the session content column
    if (data?.session?.content) {
      return data.session.content;
    }
    
    // Fallback: Extract text from different analysis types
    if (!data?.analyses) return '';
    
    const textParts: string[] = [];
    
    data.analyses.forEach(analysis => {
      if (analysis.word_analysis?.paragraph_context) {
        textParts.push(analysis.word_analysis.paragraph_context);
      } else if (analysis.sentence_analysis?.sentence) {
        textParts.push(analysis.sentence_analysis.sentence);
      } else if (analysis.paragraph_analysis?.paragraph) {
        textParts.push(analysis.paragraph_analysis.paragraph);
      }
    });
    
    return textParts.join('\n\n');
  }, [data]);

  // Get analyses by type
  const getAnalysesByType = useCallback((type: 'word' | 'sentence' | 'paragraph') => {
    if (!data?.analyses) return [];
    
    return data.analyses.filter(analysis => analysis.analysis_type === type);
  }, [data]);

  // Get word list from word analyses
  const getWordList = useCallback(() => {
    if (!data?.analyses) return [];
    
    const wordAnalyses = data.analyses.filter(analysis => 
      analysis.analysis_type === 'word' && analysis.word_analysis
    );
    
    return wordAnalyses.map(analysis => ({
      word: analysis.word_analysis!.word,
      translation: analysis.word_analysis!.vietnamese_translation,
      definition: analysis.word_analysis!.context_meaning,
      analysis: analysis.word_analysis,
      sessionId: analysis.session_id,
      analysisId: analysis.id,
    }));
  }, [data]);

  return {
    session: data?.session,
    analyses: data?.analyses || [],
    settings: data?.settings,
    tags: data?.tags || [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    invalidateCache,
    getSessionText,
    getAnalysesByType,
    getWordList,
  };
}

// Helper function for useCallback import
import { useCallback } from 'react';