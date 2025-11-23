import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSupabase } from '@/components/providers/supabase-provider';

type AnalysisType = 'word' | 'sentence' | 'paragraph' | 'all';

interface SavedAnalysisItem {
  id: string;
  analysis_type: AnalysisType;
  created_at: string;
  // Các trường khác tùy theo type
  [key: string]: any;
}

interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface SavedAnalysesResponse {
  analyses: SavedAnalysisItem[];
  pagination: PaginationInfo;
}

interface ListAnalysesParams {
  type?: AnalysisType;
  session_id?: string;
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface UseSavedAnalysesOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

/**
 * Hook để lấy danh sách các phân tích đã lưu
 * Hỗ trợ filter theo type, session_id, và pagination
 * Cache results với React Query
 */
export function useSavedAnalyses(
  params: ListAnalysesParams = {},
  options: UseSavedAnalysesOptions = {}
) {
  const {
    type = 'all',
    session_id,
    page = 1,
    per_page = 20,
    date_from,
    date_to,
    search,
  } = params;

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { getAccessToken } = useSupabase();

  const queryKey = queryKeys.api.withParams('/api/analyses/list', {
    type,
    session_id,
    page,
    per_page,
    date_from,
    date_to,
    search,
  });

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
      console.log('🔍 [DEBUG] useSavedAnalyses - Fetching analyses', {
        type,
        session_id,
        page,
        per_page,
        date_from,
        date_to,
        search,
      });

      try {
        // Build query string
        const queryParams = new URLSearchParams();
        
        if (type !== 'all') queryParams.append('type', type);
        if (session_id) queryParams.append('session_id', session_id);
        if (page !== 1) queryParams.append('page', page.toString());
        if (per_page !== 20) queryParams.append('per_page', per_page.toString());
        if (date_from) queryParams.append('date_from', date_from);
        if (date_to) queryParams.append('date_to', date_to);
        if (search) queryParams.append('search', search);

        const queryString = queryParams.toString();
        const url = `/api/analyses/list${queryString ? `?${queryString}` : ''}`;

        // Get access token for authentication
        const token = await getAccessToken();
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add authorization header if token is available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch analyses: ${response.status} ${response.statusText}`
          );
        }

        const result: SavedAnalysesResponse = await response.json();
        
        console.log('🔍 [DEBUG] useSavedAnalyses - Fetch successful', {
          analysesCount: result.analyses.length,
          pagination: result.pagination,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useSavedAnalyses - Fetch failed', error);
        throw error instanceof Error ? error : new Error('Failed to fetch analyses');
      }
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
  });

  // Utility functions for cache management
  const queryClient = useQueryClient();
  
  const invalidateCache = () => {
    console.log('🔍 [DEBUG] useSavedAnalyses - Invalidating cache');
    queryClient.invalidateQueries({
      queryKey: queryKeys.api.endpoint('/api/analyses/list'),
    });
  };

  const prefetchNextPage = async () => {
    if (data?.pagination && page < data.pagination.totalPages) {
      console.log('🔍 [DEBUG] useSavedAnalyses - Prefetching next page', {
        currentPage: page,
        nextPage: page + 1,
      });
      
      await queryClient.prefetchQuery({
        queryKey: queryKeys.api.withParams('/api/analyses/list', {
          ...params,
          page: page + 1,
        }),
        queryFn: async () => {
          const nextPageParams = { ...params, page: page + 1 };
          const queryParams = new URLSearchParams();
          
          if (nextPageParams.type && nextPageParams.type !== 'all')
            queryParams.append('type', nextPageParams.type);
          if (nextPageParams.session_id)
            queryParams.append('session_id', nextPageParams.session_id);
          if (nextPageParams.page !== 1)
            queryParams.append('page', nextPageParams.page.toString());
          if (nextPageParams.per_page && nextPageParams.per_page !== 20)
            queryParams.append('per_page', nextPageParams.per_page.toString());
          if (nextPageParams.date_from)
            queryParams.append('date_from', nextPageParams.date_from);
          if (nextPageParams.date_to)
            queryParams.append('date_to', nextPageParams.date_to);
          if (nextPageParams.search)
            queryParams.append('search', nextPageParams.search);

          const queryString = queryParams.toString();
          const url = `/api/analyses/list${queryString ? `?${queryString}` : ''}`;

          // Get access token for authentication
          const token = await getAccessToken();
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          // Add authorization header if token is available
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error('Failed to prefetch');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  return {
    analyses: data?.analyses || [],
    pagination: data?.pagination || {
      page: 1,
      perPage: per_page,
      total: 0,
      totalPages: 0,
    },
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    invalidateCache,
    prefetchNextPage,
    hasNextPage: data?.pagination ? page < data.pagination.totalPages : false,
    hasPreviousPage: page > 1,
  };
}

export type { 
  AnalysisType, 
  SavedAnalysisItem, 
  PaginationInfo, 
  SavedAnalysesResponse, 
  ListAnalysesParams, 
  UseSavedAnalysesOptions 
};