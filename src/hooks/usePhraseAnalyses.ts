import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { Database } from '@/lib/database.types';
import { PhraseAnalysis } from '@/components/analysis/types/analysis-types';

interface UsePhraseAnalysesProps {
  sessionId: string;
  pageSize?: number;
  enabled?: boolean;
  invalidateOnMount?: boolean;
  staleTime?: number;
  tabId?: string;
  componentId?: string;
}

interface PhraseAnalysesResponse {
  analyses: PhraseAnalysis[];
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
    limit: number;
  };
  nextPage: number;
}

// Transform database phrase analysis to frontend PhraseAnalysis format
const transformPhraseAnalysis = (phraseAnalysis: Database['public']['Tables']['phrase_analyses']['Row']): PhraseAnalysis => {
  return {
    id: phraseAnalysis.id,
    analysisId: phraseAnalysis.id,
    sessionId: phraseAnalysis.document_id || '',
    analysisType: 'phrase',
    position: undefined,
    createdAt: phraseAnalysis.created_at || undefined,
    updatedAt: phraseAnalysis.updated_at || undefined,
    phrase: phraseAnalysis.phrase,
    naturalTranslation: phraseAnalysis.natural_translation || undefined,
    literalMeaning: phraseAnalysis.literal_meaning || undefined,
    contextualMeaning: phraseAnalysis.contextual_meaning || undefined,
    vietnameseTranslation: phraseAnalysis.vietnamese_translation || undefined,
    partOfSpeech: phraseAnalysis.part_of_speech || undefined,
    phraseType: phraseAnalysis.phrase_type || undefined,
    grammaticalPattern: phraseAnalysis.grammatical_pattern || undefined,
    registerLevel: phraseAnalysis.register_level || undefined,
    complexityLevel: phraseAnalysis.complexity_level || undefined,
    frequencyLevel: phraseAnalysis.frequency_level || undefined,
    culturalNotes: phraseAnalysis.cultural_notes || undefined,
    stylisticNotes: phraseAnalysis.stylistic_notes || undefined,
    memoryAid: phraseAnalysis.memory_aid || undefined,
    usageExamples: phraseAnalysis.usage_examples || undefined,
    usageTips: phraseAnalysis.usage_tips || undefined,
    synonyms: phraseAnalysis.synonyms || undefined,
    antonyms: phraseAnalysis.antonyms || undefined,
    variations: phraseAnalysis.variations || undefined,
    sentenceContext: phraseAnalysis.sentence_context || undefined,
    paragraphContext: phraseAnalysis.paragraph_context || undefined,
  };
};

export function usePhraseAnalyses({
  sessionId,
  pageSize = 15,
  enabled = true,
  invalidateOnMount = false,
  staleTime = 5 * 60 * 1000, // 5 minutes
  tabId,
  componentId,
}: UsePhraseAnalysesProps) {
  // Create unique queryKey with tabId/componentId to avoid multiple instances
  const queryKey = tabId
    ? ['phrase-analyses', sessionId, 'tab', tabId] as const
    : componentId
      ? ['phrase-analyses', sessionId, 'component', componentId] as const
      : ['phrase-analyses', sessionId] as const;
      
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }): Promise<PhraseAnalysesResponse> => {
      const response = await api.sessions.getAnalyses(sessionId, {
        limit: pageSize,
        offset: pageParam,
        type: 'phrase',
        sort: 'created_at', // Sort by created_at
        order: 'desc', // Order descending (newest first)
      });
      
      // Extract phrase analyses from the response
      const phraseAnalyses = response.data?.analyses
        .filter((analysis: any) => analysis.analysis_type === 'phrase' && analysis.phrase_analysis)
        .map((analysis: any) => transformPhraseAnalysis(analysis.phrase_analysis));
      
      return {
        analyses: phraseAnalyses,
        pagination: response.data?.pagination?.phrase || {
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

export default usePhraseAnalyses;