import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { Database } from '@/lib/database.types';
import { SentenceAnalysis } from '@/components/analysis/types/analysis-types';

interface UseSentenceAnalysesProps {
  sessionId: string;
  pageSize?: number;
  enabled?: boolean;
  invalidateOnMount?: boolean;
  staleTime?: number;
  tabId?: string;
  componentId?: string;
}

interface SentenceAnalysesResponse {
  analyses: SentenceAnalysis[];
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
  };
  nextPage: number;
}

// Transform database sentence analysis to frontend SentenceAnalysis format
const transformSentenceAnalysis = (sentenceAnalysis: Database['public']['Tables']['sentence_analyses']['Row']): SentenceAnalysis => {
  return {
    id: sentenceAnalysis.id,
    analysisId: sentenceAnalysis.id,
    sessionId: sentenceAnalysis.document_id || '',
    analysisType: 'sentence',
    position: undefined,
    createdAt: sentenceAnalysis.created_at || undefined,
    updatedAt: sentenceAnalysis.updated_at || undefined,
    sentence: sentenceAnalysis.sentence,
    naturalTranslation: sentenceAnalysis.natural_translation || undefined,
    literalTranslation: sentenceAnalysis.literal_translation || undefined,
    mainIdea: sentenceAnalysis.main_idea || undefined,
    subject: sentenceAnalysis.subject || undefined,
    mainVerb: sentenceAnalysis.main_verb || undefined,
    object: sentenceAnalysis.object || undefined,
    function: sentenceAnalysis.function || undefined,
    sentenceType: sentenceAnalysis.sentence_type || undefined,
    complexityLevel: sentenceAnalysis.complexity_level || undefined,
    sentiment: sentenceAnalysis.sentiment || undefined,
    subtext: sentenceAnalysis.subtext || undefined,
    clauses: sentenceAnalysis.clauses || undefined,
    paragraphContext: sentenceAnalysis.paragraph_context || undefined,
    relationToPrevious: sentenceAnalysis.relation_to_previous || undefined,
  };
};

export function useSentenceAnalyses({
  sessionId,
  pageSize = 15,
  enabled = true,
  invalidateOnMount = false,
  staleTime = 5 * 60 * 1000, // 5 minutes
  tabId,
  componentId,
}: UseSentenceAnalysesProps) {
  // Create unique queryKey with tabId/componentId to avoid multiple instances
  const queryKey = tabId
    ? ['sentence-analyses', sessionId, 'tab', tabId] as const
    : componentId
      ? ['sentence-analyses', sessionId, 'component', componentId] as const
      : ['sentence-analyses', sessionId] as const;
      
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }): Promise<SentenceAnalysesResponse> => {
      const response = await api.sessions.getAnalyses(sessionId, {
        limit: pageSize,
        offset: pageParam,
        type: 'sentence',
        sort: 'created_at', // Sort by created_at
        order: 'desc', // Order descending (newest first)
      });
      
      // Extract sentence analyses from the response
      const sentenceAnalyses = response.data?.analyses
        .filter((analysis: any) => analysis.analysis_type === 'sentence' && analysis.sentence_analysis)
        .map((analysis: any) => transformSentenceAnalysis(analysis.sentence_analysis));
      
      return {
        analyses: sentenceAnalyses,
        pagination: response.data?.pagination?.sentence || {
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
      
      if (hasMore) {
        return nextPageOffset;
      }
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
      
      return {
        pages: data.pages,
        pageParams: data.pageParams,
        flatAnalyses: allAnalyses,
        totalCount,
      };
    },
  });
}

export default useSentenceAnalyses;