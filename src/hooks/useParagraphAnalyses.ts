import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { Database } from '@/lib/database.types';
import { ParagraphAnalysis } from '@/components/analysis/types/analysis-types';

interface UseParagraphAnalysesProps {
  sessionId: string;
  pageSize?: number;
  enabled?: boolean;
  invalidateOnMount?: boolean;
  staleTime?: number;
  tabId?: string;
  componentId?: string;
}

interface ParagraphAnalysesResponse {
  analyses: ParagraphAnalysis[];
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
  };
  nextPage: number;
}

// Transform database paragraph analysis to frontend ParagraphAnalysis format
const transformParagraphAnalysis = (paragraphAnalysis: Database['public']['Tables']['paragraph_analyses']['Row']): ParagraphAnalysis => {
  return {
    id: paragraphAnalysis.id,
    analysisId: paragraphAnalysis.id,
    sessionId: paragraphAnalysis.document_id || '',
    analysisType: 'paragraph',
    position: undefined,
    createdAt: paragraphAnalysis.created_at || undefined,
    updatedAt: paragraphAnalysis.updated_at || undefined,
    paragraph: paragraphAnalysis.paragraph,
    mainTopic: paragraphAnalysis.main_topic || undefined,
    tone: paragraphAnalysis.tone || undefined,
    targetAudience: paragraphAnalysis.target_audience || undefined,
    type: paragraphAnalysis.type || undefined,
    vocabularyLevel: paragraphAnalysis.vocabulary_level || undefined,
    sentimentLabel: paragraphAnalysis.sentiment_label || undefined,
    sentimentIntensity: paragraphAnalysis.sentiment_intensity || undefined,
    sentimentJustification: paragraphAnalysis.sentiment_justification || undefined,
    flowScore: paragraphAnalysis.flow_score || undefined,
    logicScore: paragraphAnalysis.logic_score || undefined,
    sentenceVariety: paragraphAnalysis.sentence_variety || undefined,
    betterVersion: paragraphAnalysis.better_version || undefined,
    gapAnalysis: paragraphAnalysis.gap_analysis || undefined,
    keywords: paragraphAnalysis.keywords || undefined,
    transitionWords: paragraphAnalysis.transition_words || undefined,
  };
};

export function useParagraphAnalyses({
  sessionId,
  pageSize = 15,
  enabled = true,
  invalidateOnMount = false,
  staleTime = 5 * 60 * 1000, // 5 minutes
  tabId,
  componentId,
}: UseParagraphAnalysesProps) {
  // Create unique queryKey with tabId/componentId to avoid multiple instances
  const queryKey = tabId
    ? ['paragraph-analyses', sessionId, 'tab', tabId] as const
    : componentId
      ? ['paragraph-analyses', sessionId, 'component', componentId] as const
      : ['paragraph-analyses', sessionId] as const;
      
  console.log(`[useParagraphAnalyses] Initializing hook, enabled: ${enabled}, pageSize: ${pageSize}, queryKey:`, queryKey);
  
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }): Promise<ParagraphAnalysesResponse> => {
      console.log(`[API] Fetching paragraph analyses, offset: ${pageParam}, limit: ${pageSize}`);
      
      const response = await api.sessions.getAnalyses(sessionId, {
        limit: pageSize,
        offset: pageParam,
        type: 'paragraph',
      });
      
      console.log(`[API] Response for paragraph analyses, analyses count: ${response.data?.analyses?.length || 0}, hasMore: ${response.data?.pagination?.paragraph?.hasMore}`);
      
      // Extract paragraph analyses from the response
      const paragraphAnalyses = response.data?.analyses
        .filter((analysis: any) => analysis.analysis_type === 'paragraph' && analysis.paragraph_analysis)
        .map((analysis: any) => transformParagraphAnalysis(analysis.paragraph_analysis));
      
      return {
        analyses: paragraphAnalyses,
        pagination: response.data?.pagination?.paragraph || {
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
      
      console.log(`[getNextPageParam] paragraph: hasMore=${hasMore}, nextPageOffset=${nextPageOffset}, currentTotalItems=${currentTotalItems}`);
      
      if (hasMore) {
        console.log(`[fetchNextPage] Will fetch next page for paragraph at offset ${nextPageOffset}`);
        return nextPageOffset;
      }
      console.log(`[fetchNextPage] No more pages for paragraph, hasMore=${hasMore}`);
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
      
      console.log(`[select] paragraph: total analyses: ${allAnalyses.length}, totalCount: ${totalCount}`);
      
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        flatAnalyses: allAnalyses,
        totalCount,
      };
    },
  });
}

export default useParagraphAnalyses;