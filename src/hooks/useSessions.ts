import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import type { AnalysisSession, SessionAnalysis, SessionSettings } from '@/types/sessions';
import { clientLogger } from '@/services/logger';

interface ListSessionsParams {
  status?: 'all' | 'active' | 'archived' | 'deleted';
  type?: 'all' | 'word' | 'sentence' | 'paragraph' | 'mixed';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SessionsListResponse {
  sessions: AnalysisSession[];
  total: number;
}

interface SessionLoadResponse {
  session: AnalysisSession;
  analyses: SessionAnalysis[];
  settings?: SessionSettings;
  tags?: any[];
}

interface UseSessionsOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

/**
 * Hook để lấy danh sách các phiên làm việc
 * Sử dụng API client mới để giảm code duplication
 */
export function useSessions(params: ListSessionsParams = {}, options: UseSessionsOptions = {}) {
  const {
    status = 'all',
    type = 'all',
    search = '',
    page = 1,
    limit = 20,
    sortBy = 'last_accessed_at',
    sortOrder = 'desc',
  } = params;

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const queryKey = queryKeys.api.withParams('/api/sessions/list', {
    status,
    type,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
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

      try {
        // Use new API client instead of manual fetch
        const queryParams = {
          status: status !== 'all' ? status : undefined,
          type: type !== 'all' ? type : undefined,
          search: search || undefined,
          page: page !== 1 ? page : undefined,
          limit: limit !== 20 ? limit : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        };

        // Remove undefined values
        Object.keys(queryParams).forEach(key => 
          queryParams[key as keyof typeof queryParams] === undefined && delete queryParams[key as keyof typeof queryParams]
        );

        const apiResponse = await api.sessions.list(queryParams);
        
        // Handle different response formats
        let result: SessionsListResponse;
        if (apiResponse.success && apiResponse.data) {
          // API returns { success: true, data: { sessions: [], total: 0 } }
          result = {
            sessions: apiResponse.data.sessions || [],
            total: apiResponse.data.total || 0,
          };
        } else {
          // API returns { sessions: [], total: 0 } directly
          result = {
            sessions: apiResponse.sessions || [],
            total: apiResponse.total || 0,
          };
        }
        

        return result;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch sessions');
      }
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
  });

  // Utility functions for cache management
  const queryClient = useQueryClient();
  
  const invalidateCache = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.api.endpoint('/api/sessions/list'),
    });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    sessions: data?.sessions || [],
    total: data?.total || 0,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    invalidateCache,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    currentPage: page,
  };
}

/**
 * Hook để lấy chi tiết một phiên làm việc cụ thể
 */
export function useSession(sessionId: string, options: UseSessionsOptions = {}) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

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

      try {
        // Use new API client instead of manual fetch
        const apiResponse = await api.sessions.get(sessionId);
        
        // Handle different response formats
        let result: SessionLoadResponse;
        if (apiResponse.success && apiResponse.data) {
          // API returns { success: true, data: { session, analyses, settings, tags } }
          result = apiResponse.data;
        } else {
          // API returns directly { session, analyses, settings, tags }
          result = apiResponse;
        }
        
        return result;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch session');
      }
    },
    enabled: enabled && !!sessionId,
    refetchOnWindowFocus,
    staleTime,
  });

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
  };
}

/**
 * Hook để tạo phiên làm việc mới
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sessionData: {
      title: string;
      description?: string;
      session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
    }) => {

      try {
        // Use new API client instead of manual fetch
        const result = await api.sessions.create(sessionData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create session');
        }

        clientLogger.success('Session created successfully', { sessionId: result.data.id, title: result.data.title })
        return result.data;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to create session');
      }
    },
    onSuccess: (newSession) => {
      clientLogger.info('Invalidating sessions cache after creating new session')
      // Invalidate sessions list cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      
      return newSession;
    },
    onError: (error) => {
      clientLogger.error('Create session mutation failed', {
        error: error.message || error,
        operation: 'create-session'
      });
    },
  });

  return {
    createSession: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook để cập nhật phiên làm việc
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string;
      updates: Partial<AnalysisSession>;
    }) => {

      try {
        // Use new API client instead of manual fetch
        const result = await api.sessions.update(id, updates);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update session');
        }

        return result.data;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to update session');
      }
    },
    onSuccess: (updatedSession) => {
      // Invalidate sessions list cache and specific session cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      // Invalidate new detail/analyses endpoints instead of deprecated load endpoint
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/detail'),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/analyses'),
      });
      
      return updatedSession;
    },
    onError: (error) => {
      clientLogger.error('Update session mutation failed', {
        error: error.message || error,
        operation: 'update-session'
      });
    },
  });

  return {
    updateSession: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook để xóa phiên làm việc
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sessionId: string) => {

      try {
        // Use new API client instead of manual fetch
        const result = await api.sessions.delete(sessionId);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete session');
        }

        return sessionId;
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to delete session');
      }
    },
    onSuccess: (deletedSessionId) => {
      // Invalidate sessions list cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      
      // Also invalidate specific session cache if it exists
      // Invalidate new detail/analyses endpoints instead of deprecated load endpoint
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.withParams('/api/sessions/detail', { sessionId: deletedSessionId }),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.withParams('/api/sessions/analyses', { sessionId: deletedSessionId }),
      });
      
      return deletedSessionId;
    },
    onError: (error) => {
      clientLogger.error('Delete session mutation failed', {
        error: error.message || error,
        operation: 'delete-session'
      });
    },
  });

  return {
    deleteSession: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export type {
  ListSessionsParams,
  SessionsListResponse,
  SessionLoadResponse,
  UseSessionsOptions,
};