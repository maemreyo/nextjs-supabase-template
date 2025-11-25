import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { AnalysisType, AnalysisItem } from '@/components/analysis/types/analysis-types';
import { transformAnalysisData } from '@/components/analysis/helpers/data-transformers';

interface UseSessionAnalysesByTypeProps {
  sessionId: string;
  type: AnalysisType;
  pageSize?: number;
  enabled?: boolean;
  invalidateOnMount?: boolean;
  staleTime?: number;
}

interface SessionAnalysesResponse {
  analyses: AnalysisItem[];
  pagination: {
    [key in AnalysisType]?: {
      total: number;
      hasMore: boolean;
      offset: number;
      limit: number;
    };
  };
  nextPage: number;
}

export function useSessionAnalysesByType({
  sessionId,
  type,
  pageSize = 15,
  enabled = true,
  invalidateOnMount = false,
  staleTime = 5 * 60 * 1000, // 5 minutes
}: UseSessionAnalysesByTypeProps) {
  console.log(`[useSessionAnalysesByType] Initializing hook for ${type}, enabled: ${enabled}, pageSize: ${pageSize}`);
  
  return useInfiniteQuery({
    queryKey: ['session-analyses', sessionId, type] as const,
    queryFn: async ({ pageParam = 0 }): Promise<SessionAnalysesResponse> => {
      console.log(`[API] Fetching analyses for ${type}, offset: ${pageParam}, limit: ${pageSize}`);
      
      const response = await api.sessions.getAnalyses(sessionId, {
        limit: pageSize,
        offset: pageParam,
        type: type, // Fetch specific type
      });
      
      console.log(`[API] Response for ${type}, analyses count: ${response.data?.analyses?.length || 0}, hasMore: ${response.data?.pagination?.[type]?.hasMore}`);
      
      return {
        analyses: response.data?.analyses || [],
        pagination: response.data?.pagination || {},
        nextPage: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Check if there's more data for this specific type
      const hasMore = lastPage.pagination[type]?.hasMore;
      const nextPageOffset = lastPageParam + pageSize;
      const currentTotalItems = allPages.reduce((sum, page) => sum + (page.analyses?.length || 0), 0);
      
      console.log(`[getNextPageParam] ${type}: hasMore=${hasMore}, nextPageOffset=${nextPageOffset}, currentTotalItems=${currentTotalItems}`);
      
      if (hasMore) {
        console.log(`[fetchNextPage] Will fetch next page for ${type} at offset ${nextPageOffset}`);
        return nextPageOffset;
      }
      console.log(`[fetchNextPage] No more pages for ${type}, hasMore=${hasMore}`);
      return undefined;
    },
    initialPageParam: 0,
    enabled: enabled && !!sessionId,
    refetchOnMount: invalidateOnMount ? 'always' : false,
    staleTime,
    refetchOnWindowFocus: false,
    select: (data) => {
      // Transform all analyses and filter by type
      const allAnalyses = data.pages.flatMap(page =>
        transformAnalysisData(page.analyses)
      ).filter(analysis => analysis.analysisType === type);
      
      const totalCount = data.pages[0]?.pagination[type]?.total || 0;
      
      console.log(`[select] ${type}: total analyses after filtering: ${allAnalyses.length}, totalCount: ${totalCount}`);
      
      return {
        pages: data.pages.map(page => ({
          ...page,
          analyses: transformAnalysisData(page.analyses)
            .filter(analysis => analysis.analysisType === type)
        })),
        pageParams: data.pageParams,
        flatAnalyses: allAnalyses,
        totalCount,
      };
    },
  });
}

export default useSessionAnalysesByType;