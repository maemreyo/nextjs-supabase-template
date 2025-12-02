import React, { useState, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Highlighter,
  Loader2,
  Trash2,
  Play,
  CheckCircle,
  Eye,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw
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

interface HighlightsListProps {
  sessionId: string;
  onHighlightAnalyze?: (highlight: Highlight) => void;
  onHighlightViewDetails?: (highlight: Highlight) => void;
  onHighlightRemove?: (highlightId: string) => void;
  className?: string;
  compact?: boolean;
}

// Status badge colors
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

// Type colors for highlights
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

// Memoized highlight item component
const HighlightItem = memo(function HighlightItem({
  highlight,
  onAnalyze,
  onViewDetails,
  onRemove,
  compact = false
}: {
  highlight: Highlight;
  onAnalyze?: (highlight: Highlight) => void;
  onViewDetails?: (highlight: Highlight) => void;
  onRemove?: (highlightId: string) => void;
  compact?: boolean;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    
    clientLogger.info('HighlightsList', { type: 'analyze_clicked', highlightId: highlight.id, text: highlight.selected_text });
    setIsAnalyzing(true);
    try {
      await onAnalyze?.(highlight);
    } finally {
      setIsAnalyzing(false);
    }
  }, [highlight.id, highlight.selected_text, onAnalyze, isAnalyzing]);

  const handleViewDetails = useCallback(() => {
    // Only allow viewing details if status is 'analyzed'
    if (highlight.status !== 'analyzed') {
      analysisLogger.warn('Attempted to view details for unanalyzed highlight', {
        highlightId: highlight.id,
        status: highlight.status,
        text: highlight.selected_text
      });
      return;
    }
    
    clientLogger.info('HighlightsList', { type: 'view_details_clicked', highlightId: highlight.id, text: highlight.selected_text });
    onViewDetails?.(highlight);
  }, [highlight.id, highlight.selected_text, highlight.status, onViewDetails]);

  const handleRemove = useCallback(() => {
    clientLogger.info('HighlightsList', { type: 'remove_clicked', highlightId: highlight.id, text: highlight.selected_text });
    onRemove?.(highlight.id);
  }, [highlight.id, onRemove]);

  if (compact) {
    const StatusIcon = STATUS_ICONS[highlight.status];
    
    return (
      <div className="flex items-center justify-between p-2 border-b hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full border-2 flex-shrink-0"
            style={{ backgroundColor: highlight.color }}
            aria-label={`Highlight color: ${highlight.color}`}
          />
          
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{highlight.selected_text}</p>
            <div className="flex items-center gap-2 mt-1">
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
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {highlight.status === 'pending_analysis' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-7 w-7 p-0"
              title="Phân tích highlight này"
              aria-label="Phân tích highlight này"
            >
              {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            </Button>
          )}
          
          {highlight.status === 'analyzed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              className="h-7 w-7 p-0"
              title="Xem chi tiết phân tích"
              aria-label="Xem chi tiết phân tích"
            >
              <Eye size={12} />
            </Button>
          )}
          
          {highlight.status === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20"
              title="Thử lại phân tích"
              aria-label="Thử lại phân tích"
            >
              {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title="Thêm tùy chọn"
                aria-label="Thêm tùy chọn"
              >
                <MoreHorizontal size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {highlight.status === 'pending_analysis' && (
                <DropdownMenuItem onClick={handleAnalyze} disabled={isAnalyzing}>
                  <Play className="mr-2 h-4 w-4" />
                  Phân tích ngay
                </DropdownMenuItem>
              )}
              {highlight.status === 'analyzed' && (
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
              )}
              {highlight.status === 'error' && (
                <DropdownMenuItem onClick={handleAnalyze} disabled={isAnalyzing} className="text-orange-600 focus:text-orange-700 dark:text-orange-400 dark:focus:text-orange-300">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Thử lại phân tích
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRemove} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa highlight
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[highlight.status];
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{ backgroundColor: highlight.color }}
              aria-label={`Highlight color: ${highlight.color}`}
            />
            <h3 className="text-lg font-semibold truncate max-w-[200px]" title={highlight.selected_text}>
              {highlight.selected_text.length > 30 ? `${highlight.selected_text.substring(0, 30)}...` : highlight.selected_text}
            </h3>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {highlight.selected_text.length} ký tự
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs flex items-center gap-1", STATUS_COLORS[highlight.status])}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {STATUS_LABELS[highlight.status]}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Highlight text */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Nội dung:</p>
            <div
              className="p-3 bg-muted/50 rounded-md border"
              style={{ backgroundColor: `${highlight.color}20` }}
            >
              <p className="text-sm font-medium">{highlight.selected_text}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Loại:</span>
              <Badge
                variant="secondary"
                className={cn("ml-2", TYPE_COLORS[highlight.highlight_type])}
              >
                {TYPE_LABELS[highlight.highlight_type]}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge
                variant="outline"
                className={cn("ml-2 flex items-center gap-1", STATUS_COLORS[highlight.status])}
              >
                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                {STATUS_LABELS[highlight.status]}
              </Badge>
            </div>
          </div>

          {/* Context if available */}
          {highlight.content && (
            <div>
              <span className="text-muted-foreground">Content:</span>
              <div className="mt-1 p-2 bg-muted/30 rounded text-sm">
                {highlight.content}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 flex-wrap">
            {highlight.status === 'pending_analysis' && (
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
                aria-label="Phân tích highlight này"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Phân tích ngay
                  </>
                )}
              </Button>
            )}
            
            {highlight.status === 'analyzed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewDetails}
                className="flex items-center gap-2"
                aria-label="Xem chi tiết phân tích"
              >
                <Eye size={14} />
                Xem chi tiết
              </Button>
            )}
            
            {highlight.status === 'error' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                aria-label="Thử lại phân tích"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang thử lại...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Thử lại phân tích
                  </>
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-2"
              aria-label="Xóa highlight"
            >
              <Trash2 size={14} />
              Xóa
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

// Main highlights list component
export const HighlightsList = memo(function HighlightsList({
  sessionId,
  onHighlightAnalyze,
  onHighlightViewDetails,
  onHighlightRemove,
  className = "",
  compact = false
}: HighlightsListProps) {
  const {
    highlights,
    loading,
    error,
    createHighlight,
    deleteHighlight,
    updateHighlight,
    analyzeHighlight
  } = useHighlights({
    sessionId,
    autoRefresh: true
  });

  const handleAnalyzeHighlight = useCallback(async (highlight: Highlight) => {
    clientLogger.info('HighlightsList', { type: 'analyze_highlight', highlightId: highlight.id });
    
    try {
      // Call the analyzeHighlight function from the hook
      await analyzeHighlight(highlight.id);
      
      // Update highlight status to analyzed
      await updateHighlight(highlight.id, {
        status: 'analyzed'
      });
      
      // Call parent callback
      onHighlightAnalyze?.(highlight);
      
      analysisLogger.success('Highlight analyzed successfully', { highlightId: highlight.id });
    } catch (error) {
      analysisLogger.error('Failed to analyze highlight', { error, highlightId: highlight.id });
      
      // Update status to error
      await updateHighlight(highlight.id, {
        status: 'error'
      });
    }
  }, [analyzeHighlight, updateHighlight, onHighlightAnalyze]);

  const handleViewDetails = useCallback((highlight: Highlight) => {
    // Add detailed logging to diagnose the issue
    analysisLogger.info('HighlightsList: handleViewDetails called', {
      highlightId: highlight.id,
      status: highlight.status,
      selectedText: highlight.selected_text,
      highlightType: highlight.highlight_type,
      analysisId: highlight.analysis_id,
      analysisType: highlight.analysis_type
    });
    
    // Only allow viewing details if status is 'analyzed'
    if (highlight.status !== 'analyzed') {
      analysisLogger.warn('Attempted to view details for unanalyzed highlight', {
        highlightId: highlight.id,
        status: highlight.status,
        text: highlight.selected_text
      });
      return;
    }

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
    
    clientLogger.info('HighlightsList', { type: 'view_details', highlightId: highlight.id });
    
    // Create a new object with the correct analysisType and analysisId
    const analysisItem = {
      ...highlight,
      analysisType: analysisType,
      analysisId: analysisId
    };
    
    onHighlightViewDetails?.(analysisItem);
  }, [onHighlightViewDetails]);

  const handleRemoveHighlight = useCallback(async (highlightId: string) => {
    try {
      clientLogger.info('HighlightsList', { type: 'remove_highlight', highlightId });
      await deleteHighlight(highlightId);
      
      analysisLogger.success('Highlight removed successfully', { highlightId });
    } catch (error) {
      analysisLogger.error('Failed to remove highlight', { error, highlightId });
    }
  }, [deleteHighlight]);

  // // CRITICAL FIX: Check error first, then loading, then empty, then data
  // if (error) {
  //   // Add debug logging to track when error is displayed
  //   analysisLogger.debug('HighlightsList: Rendering error state', {
  //     error: error,
  //     errorMessage: (error as any)?.message,
  //     highlightsLength: highlights?.length || 0,
  //     loading: loading,
  //     hasData: !!highlights && highlights.length > 0
  //   });
    
  //   return (
  //     <div className={className}>
  //       <Card className="p-8 text-center">
  //         <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
  //         <h3 className="text-lg font-medium mb-2">Lỗi tải highlights</h3>
  //         <p className="text-muted-foreground">
  //           {(error as any)?.message || 'Đã xảy ra lỗi khi tải danh sách highlights.'}
  //         </p>
  //       </Card>
  //     </div>
  //   );
  // }

  if (loading) {
    // Add debug logging for loading state
    analysisLogger.debug('HighlightsList: Rendering loading state', {
      loading: loading,
      error: error,
      highlightsLength: highlights?.length || 0
    });
    
    return (
      <div className={className}>
        <Card className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  // CRITICAL FIX: Only show empty state if not loading and no error and no highlights
  if (!highlights || highlights.length === 0) {
    return (
      <div className={className}>
        <Card className="p-8 text-center">
          <Highlighter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No highlights yet</h3>
          <p className="text-muted-foreground">
            Chưa có highlight nào trong session này. Chọn văn bản và thêm vào highlights để bắt đầu phân tích.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {highlights.map((highlight) => (
          <HighlightItem
            key={highlight.id}
            highlight={highlight}
            onAnalyze={handleAnalyzeHighlight}
            onViewDetails={handleViewDetails}
            onRemove={handleRemoveHighlight}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
});

export default HighlightsList;