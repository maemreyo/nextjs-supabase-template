import { useState, useCallback, useEffect } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { clientLogger } from '@/services/logger';

export interface Highlight {
  id: string;
  session_id: string;
  highlight_type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  selected_text: string;
  start_position: number;
  end_position: number;
  color: string;
  status: 'pending_analysis' | 'analyzed' | 'error';
  content?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateHighlightData {
  sessionId: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  text: string;
  startPosition: number;
  endPosition: number;
  color?: string;
  content?: string;
}

export interface UpdateHighlightData {
  color?: string;
  status?: 'pending_analysis' | 'analyzed' | 'error';
  content?: string;
}

export interface HighlightFilters {
  type?: 'word' | 'phrase' | 'sentence' | 'paragraph';
  status?: 'pending_analysis' | 'analyzed' | 'error';
  limit?: number;
  offset?: number;
}

interface UseHighlightsProps {
  sessionId: string;
  filters?: HighlightFilters;
  autoRefresh?: boolean;
}

interface UseHighlightsReturn {
  highlights: Highlight[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  refetch: () => void;
  createHighlight: (data: CreateHighlightData) => Promise<Highlight>;
  updateHighlight: (id: string, data: UpdateHighlightData) => Promise<Highlight>;
  deleteHighlight: (id: string) => Promise<boolean>;
  analyzeHighlight: (id: string, options?: { provider?: string; model?: string }) => Promise<any>;
}

export function useHighlights({
  sessionId,
  filters = {},
  autoRefresh = true
}: UseHighlightsProps): UseHighlightsReturn {
  const [localHighlights, setLocalHighlights] = useState<Highlight[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const { getAccessToken } = useSupabase();

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set('sessionId', sessionId);
  
  if (filters.type) queryParams.set('type', filters.type);
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.limit) queryParams.set('limit', filters.limit.toString());
  if (filters.offset) queryParams.set('offset', filters.offset.toString());

  const queryString = queryParams.toString();

  // Fetch highlights using direct fetch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const fetchHighlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get access token using the same method as other hooks
      const token = await getAccessToken();
      clientLogger.debug('Token authentication check', {
        hasToken: !!token,
        tokenSource: 'useSupabase',
        timestamp: new Date().toISOString()
      });
      
      if (!token) {
        clientLogger.error('No authentication token found', {
          tokenSource: 'useSupabase',
          error: 'getAccessToken returned null'
        });
        throw new Error('No authentication token found');
      }

      const res = await fetch(`/api/highlights?${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      clientLogger.debug('Fetch highlights request sent', {
        url: `/api/highlights?${queryString}`,
        hasAuthorization: !!token,
        tokenLength: token?.length || 0
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch highlights');
      }

      const data = await res.json();
      setResponse(data);
      
      clientLogger.success('Highlights fetched successfully', {
        sessionId,
        count: data.data?.highlights?.length || 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      clientLogger.error('Failed to fetch highlights', {
        sessionId,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, queryString]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoRefresh) {
      fetchHighlights();
    }
  }, [fetchHighlights, autoRefresh]);

  // Update local state when data changes
  useEffect(() => {
    if (response?.data?.highlights) {
      setLocalHighlights(response.data.highlights);
      setTotalCount(response.data.pagination?.total || 0);
      setHasMore(response.data.pagination?.hasMore || false);
    } else {
      setLocalHighlights([]);
      setTotalCount(0);
      setHasMore(false);
    }
  }, [response]);

  const createHighlight = useCallback(async (data: CreateHighlightData): Promise<Highlight> => {
    clientLogger.info('Creating highlight', {
      sessionId: data.sessionId,
      type: data.type,
      textLength: data.text.length
    });

    try {
      // Get access token using the same method as other hooks
      const token = await getAccessToken();
      clientLogger.debug('Create highlight token check', {
        hasToken: !!token,
        tokenSource: 'useSupabase',
        timestamp: new Date().toISOString()
      });
      
      if (!token) {
        clientLogger.error('No authentication token found', {
          tokenSource: 'useSupabase',
          error: 'getAccessToken returned null'
        });
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      clientLogger.debug('Create highlight request sent', {
        url: '/api/highlights',
        hasAuthorization: !!token,
        tokenLength: token?.length || 0,
        requestData: {
          sessionId: data.sessionId,
          type: data.type,
          textLength: data.text.length
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create highlight');
      }

      const result = await response.json();
      const newHighlight = result.data;

      clientLogger.success('Highlight created successfully', {
        highlightId: newHighlight.highlightId,
        type: newHighlight.type
      });

      // Update local state optimistically
      setLocalHighlights(prev => [newHighlight, ...prev]);
      setTotalCount(prev => prev + 1);

      return newHighlight;
    } catch (error) {
      clientLogger.error('Failed to create highlight', {
        sessionId: data.sessionId,
        type: data.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  const updateHighlight = useCallback(async (id: string, data: UpdateHighlightData): Promise<Highlight> => {
    clientLogger.info('Updating highlight', {
      highlightId: id,
      updatedFields: Object.keys(data)
    });

    try {
      const token = await getAccessToken();
      
      const response = await fetch(`/api/highlights/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update highlight');
      }

      const result = await response.json();
      const updatedHighlight = result.data;

      clientLogger.success('Highlight updated successfully', {
        highlightId: id,
        updatedFields: result.data.updatedFields
      });

      // Update local state
      setLocalHighlights(prev => 
        prev.map(highlight => 
          highlight.id === id ? { ...highlight, ...data } : highlight
        )
      );

      return updatedHighlight;
    } catch (error) {
      clientLogger.error('Failed to update highlight', {
        highlightId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  const deleteHighlight = useCallback(async (id: string): Promise<boolean> => {
    clientLogger.info('Deleting highlight', {
      highlightId: id
    });

    try {
      const token = await getAccessToken();
      
      const response = await fetch(`/api/highlights/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete highlight');
      }

      const result = await response.json();

      clientLogger.success('Highlight deleted successfully', {
        highlightId: id,
        type: result.data.type
      });

      // Update local state
      setLocalHighlights(prev => prev.filter(highlight => highlight.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      clientLogger.error('Failed to delete highlight', {
        highlightId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  const analyzeHighlight = useCallback(async (id: string, options: { provider?: string; model?: string } = {}): Promise<any> => {
    clientLogger.info('Analyzing highlight', {
      highlightId: id,
      provider: options.provider,
      model: options.model
    });

    try {
      const token = await getAccessToken();
      
      const response = await fetch(`/api/highlights/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze highlight');
      }

      const result = await response.json();

      clientLogger.success('Highlight analysis initiated', {
        highlightId: id,
        provider: options.provider,
        model: options.model
      });

      // Update local state to reflect analysis status
      setLocalHighlights(prev => 
        prev.map(highlight => 
          highlight.id === id ? { ...highlight, status: 'analyzed' } : highlight
        )
      );

      return result.data;
    } catch (error) {
      clientLogger.error('Failed to analyze highlight', {
        highlightId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  const refetch = useCallback(() => {
    clientLogger.info('Refetching highlights', { sessionId });
    fetchHighlights();
  }, [sessionId, fetchHighlights]);

  return {
    highlights: localHighlights,
    loading,
    // @ts-ignore
    error: (error instanceof Error ? error.message : String(error)) || null,
    totalCount,
    hasMore,
    refetch,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    analyzeHighlight
  };
}

// Update index.ts to export the new hook