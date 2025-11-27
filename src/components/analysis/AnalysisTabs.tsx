import React, { useRef, useCallback, useMemo, memo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Type, MessageSquare, FileText } from 'lucide-react';
import { AnalysisType, AnalysisItem, SessionAnalysesListProps, isWordAnalysis, isPhraseAnalysis, isSentenceAnalysis, isParagraphAnalysis } from './types/analysis-types';
import { AnalysisItemCard } from './components/AnalysisItemCard';
import { DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from './types/analysis-types';
import { getAnalysisTypeDisplayName } from './helpers/data-transformers';
import useWordAnalyses from '@/hooks/useWordAnalyses';
import usePhraseAnalyses from '@/hooks/usePhraseAnalyses';
import useSentenceAnalyses from '@/hooks/useSentenceAnalyses';
import useParagraphAnalyses from '@/hooks/useParagraphAnalyses';

// Height estimates for different analysis types (increased to prevent overlap)
const ANALYSIS_HEIGHTS = {
  word: 150,
  phrase: 170,
  sentence: 190,
  paragraph: 230,
};

// Maximum height limits to prevent overly tall cards
const MAX_ANALYSIS_HEIGHTS = {
  word: 300,
  phrase: 350,
  sentence: 400,
  paragraph: 500,
};

// Single column layout for all analysis types
const GRID_COLUMNS = 1;

// Helper function to calculate dynamic height based on content length
const calculateItemHeight = (analysis: AnalysisItem, type: AnalysisType): number => {
  const baseHeight = ANALYSIS_HEIGHTS[type];
  const maxHeight = MAX_ANALYSIS_HEIGHTS[type];
  
  // Get content length based on analysis type using type guards
  let contentLength = 0;
  if (isWordAnalysis(analysis)) {
    contentLength = Math.max(
      analysis.word?.length || 0,
      analysis.translation?.length || 0,
      analysis.definition?.length || 0,
      analysis.contextMeaning?.length || 0
    );
  } else if (isPhraseAnalysis(analysis)) {
    contentLength = Math.max(
      analysis.phrase?.length || 0,
      analysis.naturalTranslation?.length || 0,
      analysis.contextualMeaning?.length || 0,
      analysis.literalMeaning?.length || 0
    );
  } else if (isSentenceAnalysis(analysis)) {
    contentLength = Math.max(
      analysis.sentence?.length || 0,
      analysis.naturalTranslation?.length || 0,
      analysis.mainIdea?.length || 0
    );
  } else if (isParagraphAnalysis(analysis)) {
    contentLength = Math.max(
      analysis.paragraph?.length || 0,
      analysis.mainTopic?.length || 0
    );
  }
  
  // Calculate additional height based on content length
  // Rough estimate: every 100 characters adds about 20px of height
  const additionalHeight = Math.floor(contentLength / 100) * 20;
  
  return Math.min(baseHeight + additionalHeight, maxHeight);
};

interface AnalysisTabContentProps {
  sessionId: string;
  type: AnalysisType;
  onAnalysisClick?: (analysis: AnalysisItem) => void;
  onAnalysisAnalyze?: (analysis: AnalysisItem) => void;
  onAnalysisRemove?: (analysisId: string, analysisType: AnalysisType) => void;
  compact?: boolean;
  enableDialogSystem?: boolean;
  // Query data passed from parent instead of calling hooks
  queryData: {
    data: {
      flatAnalyses?: AnalysisItem[];
      totalCount?: number;
    } | undefined;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
  };
}

// Tab content component with infinite scroll and virtualization
const AnalysisTabContent = memo(function AnalysisTabContent({
  type,
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,
  compact = false,
  enableDialogSystem = true,
  queryData
}: AnalysisTabContentProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Use query data passed from parent instead of calling hooks
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = queryData;

  // Set isClient on mount to handle SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track scroll position for infinite scroll trigger
  const scrollRangeRef = useRef({ start: 0, end: 0 });
  
  // Auto-load more when approaching end of list
  const handleScrollRangeChanged = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const totalItems = data?.flatAnalyses?.length || 0;
    const visibleEnd = scrollRangeRef.current.end;
    const threshold = 5; // Load more when 5 items from end are visible
    
    
    if (visibleEnd >= totalItems - threshold) {
      fetchNextPage();
    }
  }, [type, hasNextPage, isFetchingNextPage, fetchNextPage, data?.flatAnalyses?.length]);

  // Create virtualizer with item-based virtualization (single column)
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: data?.flatAnalyses?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const analysis = data?.flatAnalyses?.[index];
      if (!analysis) return ANALYSIS_HEIGHTS[type] || 160;
      return calculateItemHeight(analysis, type);
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

  const layout = getLayoutConfig();
  
  // If not client-side yet, show loading state
  if (!isClient) {
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
  
  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ height: '600px' }}
    >
      <div
        className="p-4"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const analysis = data?.flatAnalyses?.[virtualItem.index];
          if (!analysis) return null;
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: '8px 16px',
              }}
            >
              <AnalysisItemCard
                analysis={analysis}
                onClick={onAnalysisClick}
                onAnalyze={onAnalysisAnalyze}
                onRemove={onAnalysisRemove}
                compact={compact}
                showPhonetic={true}
                truncateLength={layout.truncateLength}
                enableDialogSystem={enableDialogSystem} // Pass through the enableDialogSystem prop
              />
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
  compact = false,
  enableDialogSystem = true
}: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = React.useState<AnalysisType>('word');

  // Handle tab change with debug logging
  const handleTabChange = React.useCallback((value: string) => {
    const newTab = value as AnalysisType;
    setActiveTab(newTab);
  }, [activeTab]);
  
  const wordQuery = useWordAnalyses({
    sessionId,
    pageSize: 15,
    enabled: activeTab === 'word', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const phraseQuery = usePhraseAnalyses({
    sessionId,
    pageSize: 15,
    enabled: activeTab === 'phrase', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const sentenceQuery = useSentenceAnalyses({
    sessionId,
    pageSize: 15,
    enabled: activeTab === 'sentence', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  const paragraphQuery = useParagraphAnalyses({
    sessionId,
    pageSize: 15,
    enabled: activeTab === 'paragraph', // Only fetch when active
    invalidateOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
  
  // Memoize tab queries object to prevent re-renders
  const tabQueries = useMemo(() => {
    return {
      word: wordQuery,
      phrase: phraseQuery,
      sentence: sentenceQuery,
      paragraph: paragraphQuery,
    };
  }, [wordQuery, phraseQuery, sentenceQuery, paragraphQuery]);

  const tabConfig = [
    { value: 'word' as AnalysisType, label: 'Từ', icon: Type },
    { value: 'phrase' as AnalysisType, label: 'Cụm từ', icon: MessageSquare },
    { value: 'sentence' as AnalysisType, label: 'Câu', icon: MessageSquare },
    { value: 'paragraph' as AnalysisType, label: 'Đoạn', icon: FileText },
  ];

  const getTabCount = useCallback((type: AnalysisType) => {
    switch (type) {
      case 'word':
        return (tabQueries.word.data as { totalCount?: number })?.totalCount || 0;
      case 'phrase':
        return (tabQueries.phrase.data as { totalCount?: number })?.totalCount || 0;
      case 'sentence':
        return (tabQueries.sentence.data as { totalCount?: number })?.totalCount || 0;
      case 'paragraph':
        return (tabQueries.paragraph.data as { totalCount?: number })?.totalCount || 0;
      default:
        return 0;
    }
  }, [tabQueries]);

  return (
    <Card className="flex flex-col">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Header with tabs */}
        <div className="p-2 border-b">
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
            enableDialogSystem={enableDialogSystem}
            queryData={tabQueries[activeTab]}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
});

export default AnalysisTabs;