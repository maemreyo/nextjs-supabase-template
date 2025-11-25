import React, { useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Type, MessageSquare, FileText } from 'lucide-react';
import { AnalysisType, AnalysisItem, SessionAnalysesListProps } from './types/analysis-types';
import { AnalysisItemCard } from './components/AnalysisItemCard';
import { DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from './types/analysis-types';
import { getAnalysisTypeDisplayName, getAnalysisTypeIcon } from './helpers/data-transformers';
import useSessionAnalysesByType from '@/hooks/useSessionAnalysesByType';
import useSessionDetail from '@/hooks/useSessionDetail';

// Height estimates for different analysis types
const ANALYSIS_HEIGHTS = {
  word: 140,
  phrase: 160,
  sentence: 180,
  paragraph: 220,
};

interface AnalysisTabContentProps {
  sessionId: string;
  type: AnalysisType;
  onAnalysisClick?: (analysis: AnalysisItem) => void;
  onAnalysisAnalyze?: (analysis: AnalysisItem) => void;
  onAnalysisRemove?: (analysisId: string, analysisType: AnalysisType) => void;
  compact?: boolean;
}

// Tab content component with infinite scroll and virtualization
const AnalysisTabContent = memo(function AnalysisTabContent({
  sessionId,
  type,
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,
  compact = false,
  isActive = true
}: AnalysisTabContentProps & { isActive?: boolean }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  console.log(`[AnalysisTabContent] Rendering tab: ${type}, active: ${isActive}`);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useSessionAnalysesByType({
    sessionId,
    type,
    pageSize: 15, // Standardized limit for all tabs
    enabled: isActive, // Only fetch when tab is active
    invalidateOnMount: false, // Lazy loading
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track scroll position for infinite scroll trigger
  const scrollRangeRef = useRef({ start: 0, end: 0 });
  
  // Auto-load more when approaching end of list
  const handleScrollRangeChanged = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const totalItems = data?.flatAnalyses?.length || 0;
    const visibleEnd = scrollRangeRef.current.end;
    const threshold = 5; // Load more when 5 items from end are visible
    
    console.log(`[ScrollRange] ${type}: visibleEnd=${visibleEnd}, totalItems=${totalItems}, threshold=${threshold}, hasNextPage=${hasNextPage}`);
    
    if (visibleEnd >= totalItems - threshold) {
      console.log(`[InfiniteScroll] Triggering fetchNextPage for ${type}, visibleEnd=${visibleEnd}, totalItems=${totalItems}`);
      fetchNextPage();
    }
  }, [type, hasNextPage, isFetchingNextPage, fetchNextPage, data?.flatAnalyses?.length]);

  // Create virtualizer with scroll range tracking
  const virtualizer = useVirtualizer({
    count: data?.flatAnalyses?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      return ANALYSIS_HEIGHTS[type] || 160;
    },
    overscan: 5,
    onChange: (instance) => {
      // Track scroll range for infinite scroll trigger
      const range = instance.calculateRange();
      if (range) {
        scrollRangeRef.current = {
          start: range.startIndex,
          end: range.endIndex
        };
        handleScrollRangeChanged();
      }
    },
  });

  const getLayoutConfig = () => {
    const layouts = compact ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
    return layouts[type];
  };

  const getGridClassName = () => {
    const layouts = compact ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
    return layouts[type].gridCols;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách phân tích.'}
        </p>
      </div>
    );
  }

  if (!data?.flatAnalyses?.length) {
    return (
      <div className="p-8 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Chưa có phân tích</h3>
        <p className="text-muted-foreground">Chưa có phân tích {getAnalysisTypeDisplayName(type).toLowerCase()} nào trong session này.</p>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto"
      style={{ height: '500px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const analysis = data.flatAnalyses[virtualItem.index];
          if (!analysis) return null;
          
          const layout = getLayoutConfig();
          
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
              <div className={`${getGridClassName()} grid gap-3 p-4`}>
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
      </div>
      
      
      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Đang tải thêm phân tích...</span>
          </div>
        </div>
      )}
    </div>
  );
});

interface AnalysisTabsProps extends Omit<SessionAnalysesListProps, 'className' | 'emptyMessage' | 'pageSize'> {
  sessionId: string;
}

export const AnalysisTabs = memo(function AnalysisTabs({
  sessionId,
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,
  compact = false
}: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = React.useState<AnalysisType>('word');

  // Get session detail once
  const sessionDetail = useSessionDetail({ sessionId });
  
  // Handle tab change with debug logging
  const handleTabChange = React.useCallback((value: string) => {
    const newTab = value as AnalysisType;
    console.log(`[TabChange] Switching from ${activeTab} to ${newTab}`);
    setActiveTab(newTab);
  }, [activeTab]);
  
  // Call hooks at top level - KHÔNG VI PHẠM QUY TẮC HOOKS
  console.log('[AnalysisTabs] DEBUG: Gọi hooks ở top level - ĐÚNG QUY TẮC');
  console.log('[AnalysisTabs] DEBUG: activeTab hiện tại:', activeTab);
  
  const wordQuery = useSessionAnalysesByType({
    sessionId,
    type: 'word',
    pageSize: 15,
    enabled: activeTab === 'word', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const phraseQuery = useSessionAnalysesByType({
    sessionId,
    type: 'phrase',
    pageSize: 15,
    enabled: activeTab === 'phrase', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const sentenceQuery = useSessionAnalysesByType({
    sessionId,
    type: 'sentence',
    pageSize: 15,
    enabled: activeTab === 'sentence', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const paragraphQuery = useSessionAnalysesByType({
    sessionId,
    type: 'paragraph',
    pageSize: 15,
    enabled: activeTab === 'paragraph', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  // Memoize tab queries object to prevent re-renders
  const tabQueries = useMemo(() => {
    console.log('[AnalysisTabs] DEBUG: Tạo tabQueries object - ĐÚNG QUY TẮC');
    return {
      word: wordQuery,
      phrase: phraseQuery,
      sentence: sentenceQuery,
      paragraph: paragraphQuery,
    };
  }, [sessionId, wordQuery, phraseQuery, sentenceQuery, paragraphQuery]);

  const tabConfig = [
    { value: 'word' as AnalysisType, label: 'Từ', icon: Type },
    { value: 'phrase' as AnalysisType, label: 'Cụm từ', icon: MessageSquare },
    { value: 'sentence' as AnalysisType, label: 'Câu', icon: MessageSquare },
    { value: 'paragraph' as AnalysisType, label: 'Đoạn', icon: FileText },
  ];

  const getTabCount = useCallback((type: AnalysisType) => {
    switch (type) {
      case 'word':
        return (tabQueries.word.data as any)?.totalCount || 0;
      case 'phrase':
        return (tabQueries.phrase.data as any)?.totalCount || 0;
      case 'sentence':
        return (tabQueries.sentence.data as any)?.totalCount || 0;
      case 'paragraph':
        return (tabQueries.paragraph.data as any)?.totalCount || 0;
      default:
        return 0;
    }
  }, [tabQueries]);

  return (
    <Card className="flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with tabs */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Danh sách phân tích
            </h3>
          </div>
          
          <TabsList className="grid w-full grid-cols-4">
            {tabConfig.map(({ value, label, icon: Icon }) => {
              const count = getTabCount(value);
              const shouldShowBadge = count > 0;
              
              return (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 text-xs"
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                  {shouldShowBadge && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab content */}
        <TabsContent value={activeTab} className="flex-1 outline-none">
          <AnalysisTabContent
            sessionId={sessionId}
            type={activeTab}
            onAnalysisClick={onAnalysisClick}
            onAnalysisAnalyze={onAnalysisAnalyze}
            onAnalysisRemove={onAnalysisRemove}
            compact={compact}
            isActive={true} // Always active since we're in the active tab content
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
});

export default AnalysisTabs;