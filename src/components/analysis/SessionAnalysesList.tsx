import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Grid, List } from 'lucide-react';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client-client';
import { 
  AnalysisItem, 
  AnalysisType, 
  SessionAnalysesListProps,
  DEFAULT_LAYOUTS,
  COMPACT_LAYOUTS
} from './types/analysis-types';
import { AnalysisItemCard } from './components/AnalysisItemCard';
import { MixedAnalysisSkeleton } from './components/AnalysisSkeleton';
import { transformAnalysisData, groupAnalysesByType, sortAnalyses, filterAnalysesByType } from './helpers/data-transformers';
import { getAnalysisTypeDisplayName, getAnalysisTypeIcon } from './helpers/data-transformers';

// Height estimates for different analysis types
const ANALYSIS_HEIGHTS = {
  word: 140,
  phrase: 160,
  sentence: 180,
  paragraph: 220,
};

export function SessionAnalysesList({
  sessionId,
  analyses: providedAnalyses,
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,
  className = "",
  emptyMessage = "Chưa có phân tích nào trong session này.",
  compact = false,
  pageSize = 20
}: SessionAnalysesListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTypes, setSelectedTypes] = useState<AnalysisType[]>(['word', 'phrase', 'sentence', 'paragraph']);

  // Use provided analyses if available, otherwise fetch with infinite scroll
  const shouldUseInfiniteScroll = !!sessionId && !providedAnalyses;
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: queryKeys.api.withParams('/api/sessions/analyses', { sessionId }),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.sessions.getAnalyses(sessionId!, {
        limit: pageSize,
        offset: pageParam,
        type: 'all', // Fetch all types, we'll filter on the client
      });
      
      return {
        analyses: response.data?.analyses || [],
        pagination: response.data?.pagination,
        nextPage: pageParam + pageSize,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.words?.hasMore) {
        return lastPage.nextPage;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled: shouldUseInfiniteScroll,
  });

  // Transform and process data
  const allAnalyses = useMemo(() => {
    let analyses: AnalysisItem[] = [];
    
    if (providedAnalyses) {
      analyses = providedAnalyses;
    } else if (data?.pages) {
      const allPages = data.pages.flatMap(page => page.analyses);
      analyses = transformAnalysisData(allPages);
    }
    
    // Sort analyses
    analyses = sortAnalyses(analyses);
    
    // Filter by selected types
    if (selectedTypes.length < 4) {
      analyses = filterAnalysesByType(analyses, selectedTypes);
    }
    
    return analyses;
  }, [providedAnalyses, data, selectedTypes]);

  // Group analyses by type for display
  const groupedAnalyses = useMemo(() => {
    return groupAnalysesByType(allAnalyses);
  }, [allAnalyses]);

  // Create virtualizer - always call hook, but only use when needed
  const virtualizer = useVirtualizer({
    count: shouldUseInfiniteScroll && viewMode === 'grid' ? allAnalyses.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const analysis = allAnalyses[index];
      return analysis ? ANALYSIS_HEIGHTS[analysis.analysisType] || 160 : 160;
    },
    overscan: 5,
  });

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    
    // When user is near the bottom (within 200px), fetch more
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = parentRef.current;
    if (!element || !shouldUseInfiniteScroll) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll, shouldUseInfiniteScroll]);

  const handleTypeFilter = (type: AnalysisType) => {
    setSelectedTypes((prev: AnalysisType[]) =>
      prev.includes(type)
        ? prev.filter((t: AnalysisType) => t !== type)
        : [...prev, type]
    );
  };

  const getLayoutConfig = (type: AnalysisType) => {
    const layouts = compact ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
    return layouts[type];
  };
  
  const getGridClassName = (analysisType: AnalysisType) => {
    return `analysis-grid analysis-grid-${analysisType} ${compact ? 'analysis-grid-' + analysisType + '-compact' : ''}`;
  };

  if (isLoading) {
    return (
      <Card className={`flex flex-col ${className}`}>
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-4">
          <MixedAnalysisSkeleton count={10} compact={compact} />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách phân tích.'}
        </p>
      </Card>
    );
  }

  if (allAnalyses.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Chưa có phân tích</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      {/* Header with filters and controls */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Danh sách phân tích
          </h3>
          <Badge variant="secondary" className="text-xs">
            {shouldUseInfiniteScroll 
              ? data?.pages[0]?.pagination?.words?.total || allAnalyses.length 
              : allAnalyses.length
            } mục
          </Badge>
        </div>
        
        {/* Type filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(['word', 'phrase', 'sentence', 'paragraph'] as AnalysisType[]).map(type => (
            <Button
              key={type}
              variant={selectedTypes.includes(type) ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeFilter(type)}
              className="flex items-center gap-1 h-8 text-xs"
            >
              <span>{getAnalysisTypeIcon(type)}</span>
              {getAnalysisTypeDisplayName(type)}
            </Button>
          ))}
        </div>
        
        {/* View controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ height: '500px' }}
      >
        {viewMode === 'grid' ? (
          // Grid view with virtualization
          <div
            style={{
              height: shouldUseInfiniteScroll && viewMode === 'grid' && virtualizer ? `${virtualizer.getTotalSize()}px` : 'auto',
              width: '100%',
              position: 'relative',
            }}
          >
            {shouldUseInfiniteScroll && viewMode === 'grid' && virtualizer?.getVirtualItems().map((virtualItem) => {
              const analysis = allAnalyses[virtualItem.index];
              if (!analysis) return null;
              
              const layout = getLayoutConfig(analysis.analysisType);
              
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className={`${getGridClassName(analysis.analysisType)} gap-3 p-4`}>
                    <AnalysisItemCard
                      analysis={analysis}
                      onClick={onAnalysisClick}
                      onAnalyze={onAnalysisAnalyze}
                      onRemove={onAnalysisRemove}
                      compact={compact}
                      showPhonetic={true}
                      truncateLength={layout.truncateLength}
                    />
                  </div>
                </div>
              );
            })}
            
            {/* Fallback rendering when not using infinite scroll */}
            {!shouldUseInfiniteScroll && (
              <div className="p-4 space-y-4">
                {(['word', 'phrase', 'sentence', 'paragraph'] as AnalysisType[]).map(type => {
                  const typeAnalyses = groupedAnalyses[type];
                  if (!typeAnalyses || typeAnalyses.length === 0) return null;
                  
                  const layout = getLayoutConfig(type);
                  
                  return (
                    <div key={type} className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{getAnalysisTypeIcon(type)}</span>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {getAnalysisTypeDisplayName(type)} ({typeAnalyses.length})
                        </h4>
                      </div>
                      <div className={`${getGridClassName(type)} gap-3`}>
                        {typeAnalyses.filter(Boolean).map((analysis: AnalysisItem) => (
                          <AnalysisItemCard
                            key={analysis.id}
                            analysis={analysis}
                            onClick={onAnalysisClick}
                            onAnalyze={onAnalysisAnalyze}
                            onRemove={onAnalysisRemove}
                            compact={compact}
                            showPhonetic={true}
                            truncateLength={layout.truncateLength}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // List view (non-virtualized)
          <div className="p-4 space-y-3">
            {allAnalyses.map(analysis => (
              <AnalysisItemCard
                key={analysis.id}
                analysis={analysis}
                onClick={onAnalysisClick}
                onAnalyze={onAnalysisAnalyze}
                onRemove={onAnalysisRemove}
                compact={compact}
                showPhonetic={true}
                truncateLength={300}
              />
            ))}
          </div>
        )}
        
        {/* Loading indicator for infinite scroll */}
        {shouldUseInfiniteScroll && isFetchingNextPage && (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Đang tải thêm phân tích...</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default SessionAnalysesList;