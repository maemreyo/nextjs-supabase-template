import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
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
  pagination?: {
    words: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      currentCount: number;
    };
  };
}

interface UseSessionDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  wordsLimit?: number;
  wordsOffset?: number;
}

/**
 * Hook để tải dữ liệu chi tiết của một session
 * Bao gồm thông tin session, danh sách analyses, settings và tags
 * Sử dụng API client mới để giảm code duplication
 */
export function useSessionData(sessionId: string | undefined, options: UseSessionDataOptions = {}) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    wordsLimit = 20,
    wordsOffset = 0,
  } = options;

  const queryClient = useQueryClient();

  // Query keys for parallel queries
  const detailQueryKey = queryKeys.api.withParams('/api/sessions/detail', { sessionId });
  const analysesQueryKey = queryKeys.api.withParams('/api/sessions/analyses', { sessionId, wordsLimit, wordsOffset });

  // Parallel queries using useQueries
  const [
    detailQuery,
    analysesQuery
  ] = useQueries({
    queries: [
      {
        queryKey: detailQueryKey,
        queryFn: async () => {
          if (!sessionId) {
            throw new Error('Session ID is required');
          }

          console.log('🔍 [DEBUG] useSessionData - Fetching session detail', { sessionId });

          try {
            const apiResponse = await api.sessions.getDetail(sessionId);
            
            // Handle different response formats
            if (apiResponse.success && apiResponse.data) {
              return apiResponse.data;
            } else {
              return apiResponse;
            }
          } catch (error) {
            console.error('🔍 [DEBUG] useSessionData - Detail fetch failed', error);
            throw error instanceof Error ? error : new Error('Failed to fetch session detail');
          }
        },
        enabled: enabled && !!sessionId,
        refetchOnWindowFocus,
        staleTime,
      },
      {
        queryKey: analysesQueryKey,
        queryFn: async () => {
          if (!sessionId) {
            throw new Error('Session ID is required');
          }

          console.log('🔍 [DEBUG] useSessionData - Analyses fetch REMOVED to avoid duplicate API call');
          return {
            analyses: [],
            pagination: {
              words: {
                limit: wordsLimit,
                offset: wordsOffset,
                total: 0,
                hasMore: false,
                currentCount: 0
              }
            }
          };
        },
        enabled: enabled && !!sessionId,
        refetchOnWindowFocus,
        staleTime,
      }
    ]
  });

  // Combine data from both queries
  const data = useMemo(() => {
    if (!detailQuery.data && !analysesQuery.data) return undefined;
    
    const combinedData: SessionDataResponse = {
      session: detailQuery.data?.session,
      settings: detailQuery.data?.settings,
      tags: detailQuery.data?.tags || [],
      analyses: analysesQuery.data?.analyses || [],
      pagination: analysesQuery.data?.pagination
    };
    
    return combinedData;
  }, [detailQuery.data, analysesQuery.data]);

  const isLoading = detailQuery.isLoading || analysesQuery.isLoading;
  const isError = detailQuery.isError || analysesQuery.isError;
  const error = detailQuery.error || analysesQuery.error;
  const isFetching = detailQuery.isFetching || analysesQuery.isFetching;
  const isRefetching = detailQuery.isRefetching || analysesQuery.isRefetching;

  const refetch = () => {
    return Promise.all([
      detailQuery.refetch(),
      analysesQuery.refetch()
    ]);
  };

  // Utility functions for cache management
  const invalidateCache = () => {
    console.log('🔍 [DEBUG] useSessionData - Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: detailQueryKey,
    });
    queryClient.invalidateQueries({
      queryKey: analysesQueryKey,
    });
  };

  // Extract session text content from content column first, then fallback to analyses
  const getSessionText = () => {
    // First, try to get content from session content column
    if (data?.session?.content) {
      return data.session.content;
    }
    
    // Fallback: Extract text from different analysis types
    if (!data?.analyses) return '';
    
    const textParts: string[] = [];
    
    data.analyses.forEach((analysis: any) => {
      if (analysis.word_analysis?.paragraph_context) {
        textParts.push(analysis.word_analysis.paragraph_context);
      } else if (analysis.sentence_analysis?.sentence) {
        textParts.push(analysis.sentence_analysis.sentence);
      } else if (analysis.paragraph_analysis?.paragraph) {
        textParts.push(analysis.paragraph_analysis.paragraph);
      }
    });
    
    return textParts.join('\n\n');
  };

  // Extract session HTML content for rich text editor
  const getSessionHTML = () => {
    console.log('🔍 [DEBUG] getSessionHTML - Session data:', {
      hasContent: !!data?.session?.content,
      hasContentHTML: !!data?.session?.content_html,
      hasContentData: !!data?.session?.content_data,
      contentFormat: data?.session?.content_format
    });
    
    // First, try to get HTML content from content_html column (new format)
    if (data?.session?.content_html) {
      console.log('🔍 [DEBUG] getSessionHTML - Using content_html:', data.session.content_html.substring(0, 100) + '...');
      return data.session.content_html;
    }
    
    // Fallback to legacy content column
    if (data?.session?.content) {
      console.log('🔍 [DEBUG] getSessionHTML - Using legacy content column');
      // Check if content contains HTML tags
      const hasHTML = /<[a-z][\s\S]*>/i.test(data.session.content);
      if (hasHTML) {
        return data.session.content;
      }
      // If it's plain text, convert to simple HTML with paragraphs
      return data.session.content.split('\n\n').map((p: any) => `<p>${p}</p>`).join('');
    }
    
    // Fallback: Extract text from analyses and convert to HTML
    if (!data?.analyses) return '';
    
    console.log('🔍 [DEBUG] getSessionHTML - Falling back to analyses');
    const textParts: string[] = [];
    
    data.analyses.forEach((analysis: any) => {
      if (analysis.word_analysis?.paragraph_context) {
        textParts.push(`<p>${analysis.word_analysis.paragraph_context}</p>`);
      } else if (analysis.sentence_analysis?.sentence) {
        textParts.push(`<p>${analysis.sentence_analysis.sentence}</p>`);
      } else if (analysis.paragraph_analysis?.paragraph) {
        textParts.push(`<p>${analysis.paragraph_analysis.paragraph}</p>`);
      }
    });
    
    return textParts.join('');
  };

  // Get analyses by type
  const getAnalysesByType = (type: 'word' | 'sentence' | 'paragraph') => {
    if (!data?.analyses) return [];
    
    return data.analyses.filter((analysis: any) => analysis.analysis_type === type);
  };

  // Get word list from word analyses
  const getWordList = () => {
    if (!data?.analyses) return [];
    
    const wordAnalyses = data.analyses.filter((analysis: any) =>
      analysis.analysis_type === 'word' && analysis.word_analysis
    );
    
    return wordAnalyses.map((analysis: any) => ({
      word: analysis.word_analysis!.word,
      translation: analysis.word_analysis!.vietnamese_translation,
      definition: analysis.word_analysis!.context_meaning,
      analysis: analysis.word_analysis,
      sessionId: analysis.session_id,
      analysisId: analysis.id,
    }));
  };

  return {
    session: data?.session,
    analyses: data?.analyses || [],
    settings: data?.settings,
    tags: data?.tags || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    invalidateCache,
    getSessionText,
    getSessionHTML,
    getAnalysesByType,
    getWordList,
  };
}