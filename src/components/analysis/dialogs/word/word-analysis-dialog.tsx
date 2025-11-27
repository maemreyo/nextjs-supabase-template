import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Volume2 } from 'lucide-react';
import { WordAnalysis } from '../../types/analysis-types';
import { ExportFormat } from '../types/dialog-types';
import { WordAnalysisDialogProps } from './word-dialog-types';
import { BaseAnalysisDialog, DialogHeader } from '../common/base-analysis-dialog';
import { WordDialogContent } from './word-dialog-content';
import { WordDialogActions } from './word-dialog-actions';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogKeyboard } from '../hooks/use-dialog-keyboard';
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

/**
 * Word Analysis Dialog Component
 * Main dialog component for word analysis with modern UI/UX and micro-interactions
 */
export const WordAnalysisDialog: React.FC<WordAnalysisDialogProps> = ({
  open,
  onOpenChange,
  analysis,
  onPronounce,
  onAddToVocabulary,
  onExport,
  onShare,
  onPrint,
  onEdit,
  onDelete,
  onPractice,
  className,
  size = 'large',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
}) => {
  // Dialog state management
  const { state, actions } = useDialogState('word');
  const { setActionLoading, loadingStates } = useDialogLoading('word');
  const [activeTab, setActiveTab] = useState('definition');
  const [isAnimating, setIsAnimating] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle pronunciation with error handling
  const handlePronounce = useCallback(async (word: string) => {
    try {
      setPronunciationError(null);
      onPronounce?.(word);
    } catch (error) {
      console.error('Pronunciation error:', error);
      setPronunciationError('Không thể phát âm từ này. Vui lòng thử lại.');
    }
  }, [onPronounce]);

  // Handle export with loading state
  const handleExport = useCallback(async (analysis: WordAnalysis, format: ExportFormat) => {
    try {
      setActionLoading('export', true);
      
      // If onExport prop is provided, use it
      if (onExport) {
        await onExport(analysis, format);
      } else {
        // Default export implementation
        await exportWordAnalysis(analysis, format);
      }
    } catch (error) {
      console.error('Export error:', error);
      actions.setError('Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setActionLoading('export', false);
    }
  }, [onExport, actions, setActionLoading]);

  // Default export implementation
  const exportWordAnalysis = useCallback(async (analysis: WordAnalysis, format: ExportFormat) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `word-analysis-${analysis.word.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
    
    switch (format) {
      case 'txt':
        const textContent = formatWordAsText(analysis);
        downloadFile(textContent, `${filename}.txt`, 'text/plain');
        break;
      case 'json':
        const jsonContent = JSON.stringify(analysis, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
        break;
      case 'pdf':
        // For PDF, we'll use a simple text fallback for now
        // In a real implementation, you would use a library like jsPDF
        const pdfContent = formatWordAsText(analysis);
        downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, []);

  // Format word analysis as text
  const formatWordAsText = useCallback((analysis: WordAnalysis): string => {
    let content = `WORD ANALYSIS REPORT\n`;
    content += `========================\n\n`;
    content += `Word: ${analysis.word}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (analysis.definition) {
      content += `DEFINITION:\n${analysis.definition}\n\n`;
    }
    
    if (analysis.translation) {
      content += `TRANSLATION:\n${analysis.translation}\n\n`;
    }
    
    if (analysis.ipa) {
      content += `PRONUNCIATION (IPA):\n${analysis.ipa}\n\n`;
    }
    
    if (analysis.pos) {
      content += `PART OF SPEECH:\n${analysis.pos}\n\n`;
    }
    
    if (analysis.cefr) {
      content += `CEFR LEVEL:\n${analysis.cefr}\n\n`;
    }
    
    if (analysis.contextMeaning) {
      content += `CONTEXT MEANING:\n${analysis.contextMeaning}\n\n`;
    }
    
    if (analysis.exampleSentence) {
      content += `EXAMPLE SENTENCE:\n${analysis.exampleSentence}\n\n`;
    }
    
    if (analysis.exampleTranslation) {
      content += `EXAMPLE TRANSLATION:\n${analysis.exampleTranslation}\n\n`;
    }
    
    if (analysis.tone) {
      content += `TONE:\n${analysis.tone}\n\n`;
    }
    
    content += `\n--- End of Report ---`;
    return content;
  }, []);

  // Download file helper
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Handle share with loading state
  const handleShare = useCallback(async (analysis: WordAnalysis) => {
    try {
      setActionLoading('share', true);
      
      // If onShare prop is provided, use it
      if (onShare) {
        await onShare(analysis);
      } else {
        // Default share implementation
        await shareWordAnalysis(analysis);
      }
    } catch (error) {
      console.error('Share error:', error);
      actions.setError('Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setActionLoading('share', false);
    }
  }, [onShare, actions, setActionLoading]);

  // Default share implementation
  const shareWordAnalysis = useCallback(async (analysis: WordAnalysis) => {
    const shareText = `Word: "${analysis.word}"\nDefinition: ${analysis.definition || 'N/A'}\nTranslation: ${analysis.translation || 'N/A'}`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      // Use Web Share API if available
      try {
        await navigator.share({
          title: `Word Analysis: ${analysis.word}`,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        // If user cancels or Web Share API fails, fallback to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
        console.log('Đã sao chép link chia sẻ vào clipboard');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
      console.log('Đã sao chép link chia sẻ vào clipboard');
    }
  }, []);

  // Handle print with loading state
  const handlePrint = useCallback(async (analysis: WordAnalysis) => {
    try {
      setActionLoading('print', true);
      
      // If onPrint prop is provided, use it
      if (onPrint) {
        await onPrint(analysis);
      } else {
        // Default print implementation
        printWordAnalysis(analysis);
      }
    } catch (error) {
      console.error('Print error:', error);
      actions.setError('Không thể in. Vui lòng thử lại.');
    } finally {
      setActionLoading('print', false);
    }
  }, [onPrint, actions, setActionLoading]);

  // Default print implementation
  const printWordAnalysis = useCallback((analysis: WordAnalysis) => {
    const printContent = formatWordAsText(analysis);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Word Analysis: ${analysis.word}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              h2 { color: #555; margin-top: 20px; }
              pre { white-space: pre-wrap; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } else {
      throw new Error('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
    }
  }, [formatWordAsText]);

  // Handle add to vocabulary with loading state
  const handleAddToVocabulary = useCallback(async (analysis: WordAnalysis) => {
    try {
      actions.setLoading(true);
      await onAddToVocabulary?.(analysis);
      // Show success animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    } catch (error) {
      console.error('Add to vocabulary error:', error);
      actions.setError('Không thể thêm vào từ vựng. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onAddToVocabulary, actions]);

  // Handle edit
  const handleEdit = useCallback((analysis: WordAnalysis) => {
    onEdit?.(analysis);
  }, [onEdit]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (analysisId: string) => {
    try {
      actions.setLoading(true);
      await onDelete?.(analysisId);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete error:', error);
      actions.setError('Không thể xóa. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onDelete, onOpenChange, actions]);

  // Handle practice
  const handlePractice = useCallback((word: string) => {
    onPractice?.(word);
  }, [onPractice]);

  // Handle copy
  const handleCopy = useCallback(async (text: string) => {
    try {
      setActionLoading('copy', true);
      await navigator.clipboard.writeText(text);
      // Show success message
      actions.setError(null); // Clear any existing errors
      // You could add a toast notification here if you have one
      console.log('Đã sao chép thành công:', text);
    } catch (error) {
      console.error('Copy error:', error);
      actions.setError('Không thể sao chép. Vui lòng thử lại.');
    } finally {
      setActionLoading('copy', false);
    }
  }, [setActionLoading, actions]);

  // Handle tab change with animation
  const handleTabChange = useCallback((tab: string) => {
    setIsAnimating(true);
    setActiveTab(tab);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  // Keyboard shortcuts
  const keyboardShortcuts = useDialogKeyboard({
    isOpen: open,
    onClose: () => onOpenChange(false),
    onFullscreen: () => actions.toggleFullscreen(),
    onExport: (format: ExportFormat) => analysis && handleExport(analysis, format),
    onPrint: () => analysis && handlePrint(analysis),
    onShare: () => analysis && handleShare(analysis),
  });

  // Dialog title with pronunciation button
  const dialogTitle = useMemo(() => {
    if (!analysis) return 'Phân tích từ';
    
    return (
      <div className="flex items-center gap-2">
        <span>Phân tích từ: {analysis.word}</span>
        {onPronounce && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePronounce(analysis.word)}
            aria-label={`Phát âm ${analysis.word}`}
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }, [analysis, onPronounce, handlePronounce]);

  // Dialog subtitle with metadata
  const dialogSubtitle = useMemo(() => {
    if (!analysis) return undefined;
    
    const parts = [];
    if (analysis.pos) parts.push(analysis.pos);
    if (analysis.cefr) parts.push(analysis.cefr);
    if (analysis.ipa) parts.push(analysis.ipa);
    
    return parts.length > 0 ? parts.join(' • ') : undefined;
  }, [analysis]);

  // Loading states for different actions
  const actionLoadingStates = useMemo(() => ({
    addToVocabulary: loadingStates.actions.addToVocabulary,
    share: loadingStates.actions.share,
    print: loadingStates.actions.print,
    edit: loadingStates.actions.edit,
    delete: state.dialogState.loading && activeTab === 'delete',
    practice: state.dialogState.loading && activeTab === 'practice',
    'export-pdf': loadingStates.actions.export,
    'export-json': loadingStates.actions.export,
    'export-csv': loadingStates.actions.export,
    'export-txt': loadingStates.actions.export,
    'export-html': loadingStates.actions.export,
    copy: loadingStates.actions.copy,
  }), [loadingStates, state.dialogState.loading, activeTab]);

  // Clear error when dialog opens
  useEffect(() => {
    if (open && (state.dialogState.error || pronunciationError)) {
      actions.setError(null);
      setPronunciationError(null);
    }
  }, [open, state.dialogState.error, pronunciationError, actions]);

  // Auto-focus management
  useEffect(() => {
    if (open && analysis) {
      // Focus on the word when dialog opens
      const timer = setTimeout(() => {
        const wordElement = document.querySelector('[data-word-highlight]');
        if (wordElement) {
          wordElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            wordElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 1000);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [open, analysis]);

  if (!analysis) {
    return null;
  }

  return (
    <BaseAnalysisDialog
      open={open}
      onOpenChange={onOpenChange}
      size={size}
      showCloseButton={showCloseButton}
      resizable={resizable}
      fullscreen={fullscreen}
      type="word"
      title="Word"
      subtitle={analysis ? `Analyzing: ${analysis.word}` : "Loading..."}
      icon={
        <div className="flex items-center justify-center w-full h-full">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
      }
      className={cn(
        'word-analysis-dialog',
        isAnimating && 'animate-pulse',
        className
      )}
      onExport={(analysisData, format) => {
        if (analysisData && format) {
          handleExport(analysisData, format);
        }
      }}
      onShare={handleShare}
      onPrint={handlePrint}
      onCopy={handleCopy}
      analysis={analysis}
    >
      {/* Custom Dialog Header */}
      {/* <DialogHeader
        title={typeof dialogTitle === 'string' ? dialogTitle : 'Phân tích từ'}
        subtitle={dialogSubtitle}
        icon={
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isAnimating && (
              <div className="animate-bounce">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
          </div>
        }
      /> */}

      {/* Error Display */}
      {state.dialogState.error && (
        <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-sm text-destructive">{state.dialogState.error}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => actions.setError(null)}
              className="ml-auto text-destructive hover:text-destructive/80"
              aria-label="Đóng thông báo lỗi"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Pronunciation Error */}
      {pronunciationError && (
        <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">{pronunciationError}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPronunciationError(null)}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
              aria-label="Đóng thông báo lỗi phát âm"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Content */}
      <div
        ref={dialogRef}
        className={cn(
          'transition-all duration-300 ease-in-out',
          isAnimating && 'opacity-80'
        )}
        role="region"
        aria-label="Nội dung phân tích từ"
      >
        <WordDialogContent
          analysis={analysis}
          onPronounce={handlePronounce}
          onAnalyzeRelatedWord={(word) => {
            // This would open a new word analysis dialog
            console.log('Analyze related word:', word);
          }}
          showPhonetic={true}
          showContext={true}
          className="px-6"
        />
      </div>

      {/* Dialog Actions */}
      <div className="px-6 pb-6">
        <WordDialogActions
          analysis={analysis}
          onAddToVocabulary={handleAddToVocabulary}
          onExport={handleExport}
          onShare={handleShare}
          onPrint={handlePrint}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPractice={handlePractice}
          onCopy={handleCopy}
          loading={actionLoadingStates}
          disabled={state.dialogState.loading}
          compact={false}
        />
      </div>

      {/* Keyboard Shortcuts Help */}
      {/* <div className="px-6 pb-4 border-t">
        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <span>Phím tắt:</span>
            <span>Esc: Đóng</span>
            <span>1-4: Chuyển tab</span>
            <span>Ctrl+P: In</span>
            <span>Ctrl+E: Xuất</span>
            <span>Ctrl+S: Chia sẻ</span>
            <span>Ctrl+F: Toàn màn hình</span>
            <span>Enter: Thực hiện hành động</span>
            <span>Tab: Điều hướng</span>
          </div>
        </div>
      </div> */}

      {/* Loading Overlay */}
      {state.dialogState.loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Đang xử lý...</p>
          </div>
        </div>
      )}
    </BaseAnalysisDialog>
  );
};

export default WordAnalysisDialog;