import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Highlight } from '@/hooks/useHighlights';
import { clientLogger, analysisLogger } from '@/services/logger';

// Import appropriate analysis components based on type
import WordAnalysisDisplay from './WordAnalysisDisplay';
import PhraseAnalysisView from './PhraseAnalysisView';
import SentenceAnalysisView from './SentenceAnalysisView';
import ParagraphAnalysisView from './ParagraphAnalysisView';

interface HighlightAnalysisDialogProps {
  highlight: Highlight | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeComplete?: (result: any) => void;
}

// Status badge colors and icons
const STATUS_COLORS: Record<string, string> = {
  pending_analysis: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  analyzing: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  analyzed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  error: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending_analysis: 'Chờ phân tích',
  analyzing: 'Đang phân tích',
  analyzed: 'Đã phân tích',
  error: 'Lỗi',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending_analysis: Clock,
  analyzing: Loader2,
  analyzed: CheckCircle,
  error: AlertCircle,
};

const TYPE_LABELS: Record<string, string> = {
  word: 'Từ',
  phrase: 'Cụm từ',
  sentence: 'Câu',
  paragraph: 'Đoạn',
};

export function HighlightAnalysisDialog({
  highlight,
  isOpen,
  onClose,
  onAnalyzeComplete
}: HighlightAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when highlight changes
  useEffect(() => {
    if (highlight) {
      setAnalysisResult(highlight.status === 'analyzed' ? { /* existing analysis data */ } : null);
      setError(highlight.status === 'error' ? 'Đã có lỗi xảy ra trước đó' : null);
      setIsAnalyzing(false);
    }
  }, [highlight]);

  const handleAnalyze = useCallback(async () => {
    if (!highlight || isAnalyzing) return;

    clientLogger.info('HighlightAnalysisDialog', {
      type: 'analyze_clicked',
      highlightId: highlight.id,
      text: highlight.selected_text,
      highlightType: highlight.highlight_type
    });

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the analyze API endpoint
      const response = await fetch(`/api/highlights/${highlight.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze highlight');
      }

      const result = await response.json();
      setAnalysisResult(result.data);
      
      analysisLogger.success('Highlight analyzed successfully', {
        highlightId: highlight.id,
        analysisType: highlight.highlight_type
      });
      
      onAnalyzeComplete?.(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      analysisLogger.error('Failed to analyze highlight', { 
        highlightId: highlight.id,
        error: errorMessage 
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [highlight, isAnalyzing, onAnalyzeComplete]);

  const handleClose = useCallback(() => {
    clientLogger.info('HighlightAnalysisDialog', { type: 'dialog_closed', highlightId: highlight?.id });
    onClose();
  }, [onClose, highlight?.id]);

  if (!highlight) return null;

  const StatusIcon = STATUS_ICONS[isAnalyzing ? 'analyzing' : highlight.status];
  const currentStatus = isAnalyzing ? 'analyzing' : highlight.status;

  // Render appropriate analysis component based on type and result
  const renderAnalysisContent = () => {
    if (!analysisResult && highlight.status !== 'analyzed') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Chưa có phân tích</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Nhấn nút "Phân tích ngay" để bắt đầu phân tích {TYPE_LABELS[highlight.highlight_type]} này.
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="min-w-32"
            aria-label={`Phân tích ${TYPE_LABELS[highlight.highlight_type]}`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Phân tích ngay
              </>
            )}
          </Button>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-2">Phân tích thất bại</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {error}
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            variant="outline"
            className="min-w-32"
            aria-label="Thử phân tích lại"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Thử lại
              </>
            )}
          </Button>
        </div>
      );
    }

    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h3 className="text-lg font-medium mb-2">Đang phân tích...</h3>
          <p className="text-muted-foreground max-w-md">
            Hệ thống đang phân tích {TYPE_LABELS[highlight.highlight_type]} này. Quá trình có thể mất vài giây.
          </p>
        </div>
      );
    }

    // Render analysis result based on type
    switch (highlight.highlight_type) {
      case 'word':
        return <WordAnalysisDisplay {...analysisResult} />;
      case 'phrase':
        return <PhraseAnalysisView {...analysisResult} />;
      case 'sentence':
        return <SentenceAnalysisView {...analysisResult} />;
      case 'paragraph':
        return <ParagraphAnalysisView {...analysisResult} />;
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Không thể hiển thị phân tích cho loại này.
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2" 
                style={{ backgroundColor: highlight.color }}
                aria-label={`Highlight color: ${highlight.color}`}
              />
              <div>
                <DialogTitle className="text-lg">
                  Phân tích: {highlight.selected_text.length > 30 ? `${highlight.selected_text.substring(0, 30)}...` : highlight.selected_text}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {TYPE_LABELS[highlight.highlight_type]} • {highlight.selected_text.length} ký tự
                </DialogDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn("flex items-center gap-1", STATUS_COLORS[currentStatus])}
            >
              {StatusIcon && <StatusIcon className={cn("w-3 h-3", isAnalyzing && "animate-spin")} />}
              {STATUS_LABELS[currentStatus]}
            </Badge>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto">
          {/* Highlight content preview */}
          <div className="mb-6 p-4 bg-muted/30 rounded-md border">
            <p className="text-sm font-medium">{highlight.selected_text}</p>
          </div>

          {/* Analysis content */}
          {renderAnalysisContent()}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <div className="flex justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {highlight.created_at && (
                <>Tạo: {new Date(highlight.created_at).toLocaleDateString('vi-VN')}</>
              )}
            </div>
            <div className="flex gap-2">
              {highlight.status === 'analyzed' && analysisResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement export functionality
                    clientLogger.info('HighlightAnalysisDialog', { type: 'export_clicked', highlightId: highlight.id });
                  }}
                  aria-label="Xuất kết quả phân tích"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xuất
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClose}
                aria-label="Đóng dialog"
              >
                Đóng
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HighlightAnalysisDialog;
