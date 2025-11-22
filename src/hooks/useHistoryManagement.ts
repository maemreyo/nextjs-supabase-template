import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnalysisStore } from '@/stores/analysis-store';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnalysisHistoryItem } from '@/lib/history-cache-manager';
import { offlineHistoryManager } from '@/lib/offline-history-manager';

interface UseHistoryManagementProps {
  autoLoad?: boolean;
  autoSync?: boolean;
  cacheEnabled?: boolean;
  pageSize?: number;
}

interface HistoryFilters {
  type?: 'word' | 'sentence' | 'paragraph' | 'all';
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const useHistoryManagement = ({
  autoLoad = true,
  autoSync = true,
  cacheEnabled = true,
  pageSize = 20
}: UseHistoryManagementProps = {}) => {
  const {
    analysisHistory,
    databaseHistory,
    isHistoryLoading,
    historyError,
    lastHistorySync,
    historyPagination,
    isSyncing,
    syncError,
    pendingSyncItems,
    loadHistoryFromDatabase,
    loadMoreHistory,
    refreshHistory,
    syncHistoryWithDatabase,
    preloadHistory,
    clearHistoryCache,
    addToHistory,
    removeFromHistory,
    clearHistory,
    addToPendingSync,
    processPendingSync
  } = useAnalysisStore();

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [userId, setUserId] = useState<string>('current-user-id'); // TODO: Get from auth

  // Query for database history with React Query
  const {
    data: historyData,
    isLoading: queryLoading,
    error: queryError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['analysis-history', pageSize, filters],
    queryFn: async () => {
      // Get auth token from Supabase session
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        // Don't make the request if no token available
        throw new Error('Authentication required: No valid session available. Please sign in again.');
      }
      
      const response = await fetch('/api/analyses/recent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          limit: pageSize,
          offset: 0,
          type: filters.type || 'all',
          search: filters.search,
          date_range: filters.dateRange,
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      });
      
      // Handle 401 specifically
      if (response.status === 401) {
        throw new Error('Authentication failed: Please sign in again to continue.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: cacheEnabled ? 5 * 60 * 1000 : 0, // 5 minutes if cache enabled
    enabled: autoLoad && !!userId,
    retry: (failureCount, error) => {
      // Don't retry for authentication errors
      if (error.message.includes('Authentication') || failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Infinite query for pagination
  const {
    data: infiniteHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchInfiniteHistory
  } = useInfiniteQuery({
    queryKey: ['analysis-history-infinite', pageSize, filters],
    queryFn: async ({ pageParam = 0 }) => {
      // Get auth token from Supabase session
      const { supabase } = await import('@/lib/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        // Don't make the request if no token available
        throw new Error('Authentication required: No valid session available. Please sign in again.');
      }
      
      const response = await fetch('/api/analyses/recent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          limit: pageSize,
          offset: pageParam * pageSize,
          type: filters.type || 'all',
          search: filters.search,
          date_range: filters.dateRange,
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      });
      
      // Handle 401 specifically
      if (response.status === 401) {
        throw new Error('Authentication failed: Please sign in again to continue.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        ...result.data,
        page: pageParam
      };
    },
    getNextPageParam: (lastPage: any, allPages: any) => {
      return lastPage.pagination?.has_more ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: cacheEnabled ? 5 * 60 * 1000 : 0,
    enabled: autoLoad && !!userId,
    retry: (failureCount, error) => {
      // Don't retry for authentication errors
      if (error.message.includes('Authentication') || failureCount >= 2) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Mutation for adding to history
  const addToHistoryMutation = useMutation({
    mutationFn: async (item: AnalysisHistoryItem) => {
      // Add to local store immediately
      await addToHistory(item);
      
      return item;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-history-infinite'] });
    },
    onError: (error) => {
      console.error('Failed to add to history:', error);
      // Item is already in local store, so user experience is not affected
    }
  });

  // Mutation for syncing history
  const syncHistoryMutation = useMutation({
    mutationFn: async () => {
      return syncHistoryWithDatabase();
    },
    onSuccess: () => {
      // Invalidate all history queries
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-history-infinite'] });
    }
  });

  // Mutation for removing from history
  const removeFromHistoryMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await removeFromHistory(itemId);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-history-infinite'] });
    }
  });

  // Mutation for clearing history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await clearHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      queryClient.invalidateQueries({ queryKey: ['analysis-history-infinite'] });
    }
  });

  // Computed values
  const mergedHistory = useMemo(() => {
    // Merge local and database history, removing duplicates
    const allItems = [...analysisHistory, ...databaseHistory];
    const uniqueItems = new Map();
    
    allItems.forEach(item => {
      const existing = uniqueItems.get(item.id);
      if (!existing || item.timestamp > existing.timestamp) {
        uniqueItems.set(item.id, item);
      }
    });
    
    return Array.from(uniqueItems.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [analysisHistory, databaseHistory]);

  const filteredHistory = useMemo(() => {
    let filtered = mergedHistory;
    
    // Apply filters if provided
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.input.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      
      filtered = filtered.filter(item => {
        const itemTime = item.timestamp;
        return itemTime >= startTime && itemTime <= endTime;
      });
    }
    
    return filtered;
  }, [mergedHistory, filters]);

  const paginationInfo = useMemo((): PaginationInfo => {
    if (historyData?.pagination) {
      return historyData.pagination;
    }
    
    if (infiniteHistoryData?.pages && infiniteHistoryData.pages.length > 0) {
      const lastPage = infiniteHistoryData.pages[infiniteHistoryData.pages.length - 1];
      if (lastPage?.pagination) {
        return {
          total: lastPage.pagination.total,
          limit: lastPage.pagination.limit,
          offset: lastPage.pagination.offset,
          hasMore: lastPage.pagination.has_more
        };
      }
    }
    
    return historyPagination;
  }, [historyData, infiniteHistoryData, historyPagination]);

  // Actions
  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    } else {
      loadMoreHistory();
    }
  }, [hasNextPage, fetchNextPage, loadMoreHistory]);

  const handleRefresh = useCallback(() => {
    refetchHistory();
    refreshHistory();
  }, [refetchHistory, refreshHistory]);

  const handleSync = useCallback(() => {
    syncHistoryMutation.mutate();
  }, [syncHistoryMutation]);

  const handleAddToHistory = useCallback((item: AnalysisHistoryItem) => {
    addToHistoryMutation.mutate(item);
  }, [addToHistoryMutation]);

  const handleRemoveFromHistory = useCallback((itemId: string) => {
    removeFromHistoryMutation.mutate(itemId);
  }, [removeFromHistoryMutation]);

  const handleClearHistory = useCallback(async () => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  const handleFilterChange = useCallback((newFilters: Partial<HistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleTypeFilter = useCallback((type: 'word' | 'sentence' | 'paragraph' | 'all') => {
    setFilters(prev => ({ ...prev, type }));
  }, []);

  const handleDateRangeFilter = useCallback((dateRange: { start: string; end: string }) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get offline status
  const offlineStatus = offlineHistoryManager.getStatus();

  // Auto-sync effect
  useEffect(() => {
    if (autoSync && !isSyncing && pendingSyncItems.length > 0) {
      const timer = setTimeout(() => {
        processPendingSync();
      }, 5000); // Wait 5 seconds before processing pending items
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoSync, isSyncing, pendingSyncItems.length, processPendingSync]);

  // Auto-load effect
  useEffect(() => {
    if (autoLoad && !historyData && !queryLoading && userId) {
      preloadHistory();
    }
  }, [autoLoad, historyData, queryLoading, preloadHistory, userId]);

  // Network status effect
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online');
      if (autoSync) {
        handleSync();
      }
    };

    const handleOffline = () => {
      console.log('Network is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, handleSync]);

  return {
    // Data
    history: filteredHistory,
    localHistory: analysisHistory,
    databaseHistory: databaseHistory,
    mergedHistory,
    
    // Loading states
    isLoading: isHistoryLoading || queryLoading,
    isRefreshing: queryLoading || isFetchingNextPage,
    isSyncing: isSyncing || syncHistoryMutation.isPending,
    
    // Error states
    error: historyError || queryError || syncError,
    
    // Pagination
    pagination: paginationInfo,
    hasMore: hasNextPage || paginationInfo.hasMore,
    
    // Sync info
    lastSync: lastHistorySync,
    pendingItems: pendingSyncItems,
    offlineStatus,
    
    // Filters
    filters,
    
    // Actions
    loadMore: handleLoadMore,
    refresh: handleRefresh,
    sync: handleSync,
    addToHistory: handleAddToHistory,
    removeFromHistory: handleRemoveFromHistory,
    clearHistory: handleClearHistory,
    preloadHistory,
    clearCache: clearHistoryCache,
    
    // Filter actions
    setFilters: handleFilterChange,
    setSearch: handleSearch,
    setTypeFilter: handleTypeFilter,
    setDateRangeFilter: handleDateRangeFilter,
    clearFilters,
    
    // Raw data access
    historyData,
    infiniteHistoryData,
    refetchHistory,
    refetchInfiniteHistory
  };
};

export type { UseHistoryManagementProps, HistoryFilters, PaginationInfo };