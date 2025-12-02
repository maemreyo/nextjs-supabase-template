import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHighlights, type Highlight } from '@/hooks/useHighlights';
import { clientLogger, analysisLogger } from '@/services/logger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface HighlightsSidebarProps {
  sessionId: string;
  onHighlightAnalyze?: (highlight: Highlight) => void;
  onHighlightViewDetails?: (highlight: Highlight) => void;
  onHighlightRemove?: (highlightId: string) => void;
  className?: string;
}

// Status colors and labels
const STATUS_COLORS: Record<string, string> = {
  pending_analysis: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  analyzed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending_analysis: 'Chờ phân tích',
  analyzed: 'Đã phân tích',
  error: 'Lỗi',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending_analysis: Clock,
  analyzed: CheckCircle,
  error: AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  word: 'bg-blue-100 text-blue-800',
  phrase: 'bg-purple-100 text-purple-800',
  sentence: 'bg-orange-100 text-orange-800',
  paragraph: 'bg-pink-100 text-pink-800',
};

const TYPE_LABELS: Record<string, string> = {
  word: 'Từ',
  phrase: 'Cụm từ',
  sentence: 'Câu',
  paragraph: 'Đoạn',
};

export function HighlightsSidebar({
  sessionId,
  onHighlightAnalyze,
  onHighlightViewDetails,
  onHighlightRemove,
  className = ""
}: HighlightsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    highlights,
    loading,
    error,
    deleteHighlight,
    updateHighlight,
    analyzeHighlight
  } = useHighlights({
    sessionId,
    autoRefresh: true
  });

  // Filter highlights based on search and filters
  const filteredHighlights = useMemo(() => {
    let filtered = highlights;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(highlight => 
        highlight.selected_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(highlight => highlight.highlight_type === selectedType);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(highlight => highlight.status === selectedStatus);
    }

    return filtered;
  }, [highlights, searchTerm, selectedType, selectedStatus]);

  // Get counts for each type
  const typeCounts = useMemo(() => {
    const counts = {
      word: 0,
      phrase: 0,
      sentence: 0,
      paragraph: 0,
    };

    highlights.forEach(highlight => {
      counts[highlight.highlight_type]++;
    });

    return counts;
  }, [highlights]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const counts = {
      pending_analysis: 0,
      analyzed: 0,
      error: 0,
    };

    highlights.forEach(highlight => {
      counts[highlight.status]++;
    });

    return counts;
  }, [highlights]);

  const handleAnalyze = useCallback(async (highlight: Highlight) => {
    try {
      clientLogger.info('HighlightsSidebar', { type: 'analyze_clicked', highlightId: highlight.id });
      
      // Update highlight status to analyzing
      await updateHighlight(highlight.id, {
        status: 'analyzed'
      });
      
      // Call analyze function
      await analyzeHighlight(highlight.id);
      
      // Call parent callback
      onHighlightAnalyze?.(highlight);
      
      analysisLogger.success('Highlight analyzed successfully', { highlightId: highlight.id });
    } catch (error) {
      analysisLogger.error('Failed to analyze highlight', { error, highlightId: highlight.id });
    }
  }, [analyzeHighlight, updateHighlight, onHighlightAnalyze]);

  const handleViewDetails = useCallback((highlight: Highlight) => {
    // Add detailed logging to diagnose the issue
    analysisLogger.info('HighlightsSidebar: handleViewDetails called', {
      highlightId: highlight.id,
      status: highlight.status,
      selectedText: highlight.selected_text,
      highlightType: highlight.highlight_type,
      analysisId: highlight.analysis_id,
      analysisType: highlight.analysis_type
    });
    
    // Derive analysisType and analysisId from highlight
    const analysisType = highlight.analysis_type || highlight.highlight_type;
    const analysisId = highlight.analysis_id;

    // Check if we have the required data
    if (!analysisId) {
      analysisLogger.warn('No analysis_id available for highlight', {
        highlightId: highlight.id,
        status: highlight.status,
        text: highlight.selected_text,
        analysisType
      });
      // Show toast notification to user
      toast.error('Phân tích trước', {
        description: 'Highlight này chưa được phân tích. Vui lòng phân tích trước khi xem chi tiết.',
      });
      return;
    }

    if (!analysisType) {
      analysisLogger.warn('No analysis_type available for highlight', {
        highlightId: highlight.id,
        status: highlight.status,
        text: highlight.selected_text,
        analysisId
      });
      // Show toast notification to user
      toast.error('Thiếu thông tin phân tích', {
        description: 'Không xác định được loại phân tích cho highlight này.',
      });
      return;
    }
    
    analysisLogger.info('Opening analysis detail with derived values', {
      highlightId: highlight.id,
      derivedAnalysisType: analysisType,
      derivedAnalysisId: analysisId
    });
    
    clientLogger.info('HighlightsSidebar', { type: 'view_details_clicked', highlightId: highlight.id });
    
    // Create a new object with the correct analysisType and analysisId
    const analysisItem = {
      ...highlight,
      analysisType: analysisType,
      analysisId: analysisId
    };
    
    onHighlightViewDetails?.(analysisItem);
  }, [onHighlightViewDetails]);

  const handleRemove = useCallback(async (highlightId: string) => {
    try {
      clientLogger.info('HighlightsSidebar', { type: 'remove_clicked', highlightId });
      await deleteHighlight(highlightId);
      
      // Call parent callback
      onHighlightRemove?.(highlightId);
      
      analysisLogger.success('Highlight removed successfully', { highlightId });
    } catch (error) {
      analysisLogger.error('Failed to remove highlight', { error, highlightId });
    }
  }, [deleteHighlight, onHighlightRemove]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
  }, []);

  // CRITICAL FIX: Check error first, then loading, then empty, then data
  if (error) {
    // Add debug logging to track when error is displayed
    analysisLogger.debug('HighlightsSidebar: Rendering error state', {
      error: error,
      errorMessage: (error as any)?.message,
      highlightsLength: highlights?.length || 0,
      loading: loading,
      hasData: !!highlights && highlights.length > 0
    });
    
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium mb-2">Lỗi tải highlights</h3>
          <p className="text-muted-foreground">
            {(error as any)?.message || 'Đã xảy ra lỗi khi tải danh sách highlights.'}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Đang tải highlights...</p>
        </div>
      </div>
    );
  }

  // CRITICAL FIX: Only show empty state if not loading and no error and no highlights
  if (!highlights || highlights.length === 0) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Highlights</h2>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Chưa có highlights nào</h3>
            <p className="text-muted-foreground">
              Chưa có highlights nào trong session này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
            aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Tìm kiếm highlights"
          />
        </div>

        {/* Filters */}
        <div className={cn("space-y-3", !isExpanded && "hidden md:block")}>
          {/* Type filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Loại</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
                className="justify-start"
              >
                Tất cả ({highlights.length})
              </Button>
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="justify-start"
                >
                  {label} ({typeCounts[type as keyof typeof typeCounts]})
                </Button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Trạng thái</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className="justify-start"
              >
                Tất cả ({highlights.length})
              </Button>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className="justify-start"
                >
                  {label} ({statusCounts[status as keyof typeof statusCounts]})
                </Button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Highlights list */}
      <ScrollArea className="flex-1 p-4">
        {filteredHighlights.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Không tìm thấy highlights'
                : 'Chưa có highlights nào'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Không có highlights nào khớp với bộ lọc của bạn.'
                : 'Chưa có highlights nào trong session này.'}
            </p>
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' ? (
              <Button onClick={handleClearFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHighlights.map((highlight) => {
              const StatusIcon = STATUS_ICONS[highlight.status];
              
              return (
                <Card 
                  key={highlight.id} 
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    if (highlight.status === 'analyzed') {
                      handleViewDetails(highlight);
                    } else if (highlight.status === 'pending_analysis') {
                      handleAnalyze(highlight);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Color indicator */}
                    <div 
                      className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1" 
                      style={{ backgroundColor: highlight.color }}
                      aria-label={`Highlight color: ${highlight.color}`}
                    />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-2">
                        {highlight.selected_text}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", TYPE_COLORS[highlight.highlight_type])}
                        >
                          {TYPE_LABELS[highlight.highlight_type]}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs flex items-center gap-1", STATUS_COLORS[highlight.status])}
                        >
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {STATUS_LABELS[highlight.status]}
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {highlight.status === 'pending_analysis' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyze(highlight);
                            }}
                            className="h-7 w-7 p-0"
                            title="Phân tích highlight này"
                            aria-label="Phân tích highlight này"
                          >
                            <Search className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {highlight.status === 'analyzed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(highlight);
                            }}
                            className="h-7 w-7 p-0"
                            title="Xem chi tiết phân tích"
                            aria-label="Xem chi tiết phân tích"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-7 p-0"
                              title="Thêm tùy chọn"
                              aria-label="Thêm tùy chọn"
                            >
                              <Filter className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {highlight.status === 'pending_analysis' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyze(highlight);
                              }}>
                                <Search className="mr-2 h-4 w-4" />
                                Phân tích ngay
                              </DropdownMenuItem>
                            )}
                            {highlight.status === 'analyzed' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(highlight);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(highlight.id);
                            }} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa highlight
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer with stats */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center">
          Hiển thị {filteredHighlights.length} / {highlights.length} highlights
        </div>
      </div>
    </div>
  );
}

export default HighlightsSidebar;