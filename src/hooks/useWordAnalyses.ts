import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { Database } from '@/lib/database.types';
import { WordAnalysis } from '@/components/analysis/types/analysis-types';

interface UseWordAnalysesProps {
  sessionId: string;
  pageSize?: number;
  enabled?: boolean;
  invalidateOnMount?: boolean;
  staleTime?: number;
  tabId?: string;
  componentId?: string;
}

interface WordAnalysesResponse {
  analyses: WordAnalysis[];
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
  };
  nextPage: number;
}

// Transform database word analysis to frontend WordAnalysis format
const transformWordAnalysis = (wordAnalysis: Database['public']['Tables']['word_analyses']['Row']): WordAnalysis => {
  return {
    id: wordAnalysis.id,
    analysisId: wordAnalysis.id,
    sessionId: wordAnalysis.document_id || '',
    analysisType: 'word',
    position: undefined,
    createdAt: wordAnalysis.created_at || undefined,
    updatedAt: wordAnalysis.updated_at || undefined,
    word: wordAnalysis.word,
    translation: wordAnalysis.vietnamese_translation || undefined,
    definition: undefined, // Not in database schema
    ipa: wordAnalysis.ipa || undefined,
    pos: wordAnalysis.pos || undefined,
    cefr: wordAnalysis.cefr || undefined,
    contextMeaning: wordAnalysis.context_meaning || undefined,
    exampleSentence: wordAnalysis.example_sentence || undefined,
    exampleTranslation: wordAnalysis.example_translation || undefined,
    tone: wordAnalysis.tone || undefined,
    rootMeaning: wordAnalysis.root_meaning || undefined,
    inferenceClues: wordAnalysis.inference_clues || undefined,
    inferenceReasoning: wordAnalysis.inference_reasoning || undefined,
    paragraphContext: wordAnalysis.paragraph_context || undefined,
    sentenceContext: wordAnalysis.sentence_context || undefined,
  };
};

export function useWordAnalyses({
  sessionId,
  pageSize = 15,
  enabled = true,
  invalidateOnMount = false,
  staleTime = 5 * 60 * 1000, // 5 minutes
  tabId,
  componentId,
}: UseWordAnalysesProps) {
  // Create unique queryKey with tabId/componentId to avoid multiple instances
  const queryKey = tabId
    ? ['word-analyses', sessionId, 'tab', tabId] as const
    : componentId
      ? ['word-analyses', sessionId, 'component', componentId] as const
      : ['word-analyses', sessionId] as const;
      
  console.log(`[useWordAnalyses] Initializing hook, enabled: ${enabled}, pageSize: ${pageSize}, queryKey:`, queryKey);
  
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }): Promise<WordAnalysesResponse> => {
      console.log(`[API] Fetching word analyses, offset: ${pageParam}, limit: ${pageSize}`);
      
      const response = await api.sessions.getAnalyses(sessionId, {
        limit: pageSize,
        offset: pageParam,
        type: 'word',
        sort: 'created_at', // Sort by created_at
        order: 'desc', // Order descending (newest first)
      });
      
      console.log(`[API] Response for word analyses, analyses count: ${response.data?.analyses?.length || 0}, hasMore: ${response.data?.pagination?.word?.hasMore}`);
      
      // Extract word analyses from the response
      const wordAnalyses = response.data?.analyses
        .filter((analysis: any) => analysis.analysis_type === 'word' && analysis.word_analysis)
        .map((analysis: any) => transformWordAnalysis(analysis.word_analysis));
      
      return {
        analyses: wordAnalyses,
        pagination: response.data?.pagination?.word || {
          total: 0,
          hasMore: false,
          offset: pageParam,
          limit: pageSize,
        },
        nextPage: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const hasMore = lastPage.pagination.hasMore;
      const nextPageOffset = lastPageParam + pageSize;
      const currentTotalItems = allPages.reduce((sum, page) => sum + (page.analyses?.length || 0), 0);
      
      console.log(`[getNextPageParam] word: hasMore=${hasMore}, nextPageOffset=${nextPageOffset}, currentTotalItems=${currentTotalItems}`);
      
      if (hasMore) {
        console.log(`[fetchNextPage] Will fetch next page for word at offset ${nextPageOffset}`);
        return nextPageOffset;
      }
      console.log(`[fetchNextPage] No more pages for word, hasMore=${hasMore}`);
      return undefined;
    },
    initialPageParam: 0,
    enabled: enabled && !!sessionId,
    refetchOnMount: invalidateOnMount ? 'always' : false,
    staleTime: staleTime || 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => {
      const allAnalyses = data.pages.flatMap(page => page.analyses);
      const totalCount = data.pages[0]?.pagination.total || 0;
      
      console.log(`[select] word: total analyses: ${allAnalyses.length}, totalCount: ${totalCount}`);
      
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        flatAnalyses: allAnalyses,
        totalCount,
      };
    },
  });
}

export default useWordAnalyses;