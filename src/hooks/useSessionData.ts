import { useQuery, useQueryClient } from '@tanstack/react-query';
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
}

interface UseSessionDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
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
  } = options;

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
        // Use the new API client instead of manual fetch
        const apiResponse = await api.sessions.get(sessionId);
        
        // Handle different response formats
        let result: SessionDataResponse;
        
        if (apiResponse.success && apiResponse.data) {
          // API returns { success: true, data: { session, analyses, settings, tags } }
          result = apiResponse.data;
        } else {
          // API returns directly { session, analyses, settings, tags }
          result = apiResponse;
        }
        
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
  const getSessionText = () => {
    // First, try to get content from session content column
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
      return data.session.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }
    
    // Fallback: Extract text from analyses and convert to HTML
    if (!data?.analyses) return '';
    
    console.log('🔍 [DEBUG] getSessionHTML - Falling back to analyses');
    const textParts: string[] = [];
    
    data.analyses.forEach(analysis => {
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
    
    return data.analyses.filter(analysis => analysis.analysis_type === type);
  };

  // Get word list from word analyses
  const getWordList = () => {
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
  };

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
    getSessionHTML,
    getAnalysesByType,
    getWordList,
  };
}