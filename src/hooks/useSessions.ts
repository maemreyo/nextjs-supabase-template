import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useSupabase } from '@/components/providers/supabase-provider';
import type { AnalysisSession, SessionAnalysis, SessionSettings } from '@/types/sessions';

interface ListSessionsParams {
  status?: 'all' | 'active' | 'archived' | 'deleted';
  type?: 'all' | 'word' | 'sentence' | 'paragraph' | 'mixed';
  search?: string;
  page?: number;
  limit?: number;
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
 */
export function useSessions(params: ListSessionsParams = {}, options: UseSessionsOptions = {}) {
  const {
    status = 'all',
    type = 'all',
    search = '',
    page = 1,
    limit = 20,
  } = params;

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { getAccessToken } = useSupabase();

  const queryKey = queryKeys.api.withParams('/api/sessions/list', {
    status,
    type,
    search,
    page,
    limit,
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
      console.log('🔍 [DEBUG] useSessions - Fetching sessions', {
        status,
        type,
        search,
        page,
        limit,
      });

      try {
        // Build query string
        const queryParams = new URLSearchParams();
        
        if (status !== 'all') queryParams.append('status', status);
        if (type !== 'all') queryParams.append('type', type);
        if (search) queryParams.append('search', search);
        if (page !== 1) queryParams.append('page', page.toString());
        if (limit !== 20) queryParams.append('limit', limit.toString());

        const queryString = queryParams.toString();
        const url = `/api/sessions/list${queryString ? `?${queryString}` : ''}`;

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
            errorData.error || `Failed to fetch sessions: ${response.status} ${response.statusText}`
          );
        }

        const result: SessionsListResponse = await response.json();
        
        console.log('🔍 [DEBUG] useSessions - Fetch successful', {
          sessionsCount: result.sessions.length,
          total: result.total,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useSessions - Fetch failed', error);
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
    console.log('🔍 [DEBUG] useSessions - Invalidating cache');
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

  const { getAccessToken } = useSupabase();

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
      console.log('🔍 [DEBUG] useSession - Fetching session', { sessionId });

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
            errorData.error || `Failed to fetch session: ${response.status} ${response.statusText}`
          );
        }

        const result: SessionLoadResponse = await response.json();
        
        console.log('🔍 [DEBUG] useSession - Fetch successful', {
          sessionId,
          analysesCount: result.analyses.length,
          hasSettings: !!result.settings,
        });

        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] useSession - Fetch failed', error);
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
  const { getAccessToken } = useSupabase();

  const mutation = useMutation({
    mutationFn: async (sessionData: {
      title: string;
      description?: string;
      session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
    }) => {
      console.log('🔍 [DEBUG] useCreateSession - Creating session', sessionData);

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

        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers,
          body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to create session: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create session');
        }

        console.log('🔍 [DEBUG] useCreateSession - Create successful', result.data);
        return result.data;
      } catch (error) {
        console.error('🔍 [DEBUG] useCreateSession - Create failed', error);
        throw error instanceof Error ? error : new Error('Failed to create session');
      }
    },
    onSuccess: (newSession) => {
      console.log('🔍 [DEBUG] useCreateSession - Invalidating sessions cache');
      // Invalidate sessions list cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      
      return newSession;
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] useCreateSession - Mutation error', error);
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
  const { getAccessToken } = useSupabase();

  const mutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string;
      updates: Partial<AnalysisSession>;
    }) => {
      console.log('🔍 [DEBUG] useUpdateSession - Updating session', { id, updates });

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

        const response = await fetch(`/api/sessions/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to update session: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update session');
        }

        console.log('🔍 [DEBUG] useUpdateSession - Update successful', result.data);
        return result.data;
      } catch (error) {
        console.error('🔍 [DEBUG] useUpdateSession - Update failed', error);
        throw error instanceof Error ? error : new Error('Failed to update session');
      }
    },
    onSuccess: (updatedSession) => {
      console.log('🔍 [DEBUG] useUpdateSession - Invalidating cache');
      // Invalidate sessions list cache and specific session cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/load'),
      });
      
      return updatedSession;
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] useUpdateSession - Mutation error', error);
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
  const { getAccessToken } = useSupabase();

  const mutation = useMutation({
    mutationFn: async (sessionId: string) => {
      console.log('🔍 [DEBUG] useDeleteSession - Deleting session', { sessionId });

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

        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to delete session: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete session');
        }

        console.log('🔍 [DEBUG] useDeleteSession - Delete successful', { sessionId });
        return sessionId;
      } catch (error) {
        console.error('🔍 [DEBUG] useDeleteSession - Delete failed', error);
        throw error instanceof Error ? error : new Error('Failed to delete session');
      }
    },
    onSuccess: (deletedSessionId) => {
      console.log('🔍 [DEBUG] useDeleteSession - Invalidating cache');
      // Invalidate sessions list cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.endpoint('/api/sessions/list'),
      });
      
      // Also invalidate specific session cache if it exists
      queryClient.invalidateQueries({
        queryKey: queryKeys.api.withParams('/api/sessions/load', { sessionId: deletedSessionId }),
      });
      
      return deletedSessionId;
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] useDeleteSession - Mutation error', error);
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