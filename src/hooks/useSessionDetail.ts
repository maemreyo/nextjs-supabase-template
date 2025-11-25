import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';

interface UseSessionDetailProps {
  sessionId: string | undefined;
  enabled?: boolean;
  staleTime?: number;
}

interface SessionDetailResponse {
  session: {
    id: string;
    title: string;
    content?: string;
    content_html?: string;
    content_format?: string;
    created_at: string;
    updated_at: string;
  };
  settings?: any;
  tags?: any[];
}

/**
 * Hook để tải thông tin chi tiết của session
 * Được sử dụng chung để tránh truy vấn lặp lại
 */
export function useSessionDetail({
  sessionId,
  enabled = true,
  staleTime = 10 * 60 * 1000, // 10 minutes
}: UseSessionDetailProps) {
  return useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      try {
        const apiResponse = await api.sessions.getDetail(sessionId);
        
        // Handle different response formats
        if (apiResponse.success && apiResponse.data) {
          return apiResponse.data as SessionDetailResponse;
        } else {
          return apiResponse as SessionDetailResponse;
        }
      } catch (error) {
        console.error('Failed to fetch session detail', error);
        throw error instanceof Error ? error : new Error('Failed to fetch session detail');
      }
    },
    enabled: enabled && !!sessionId,
    staleTime,
    refetchOnWindowFocus: false,
  });
}

export default useSessionDetail;