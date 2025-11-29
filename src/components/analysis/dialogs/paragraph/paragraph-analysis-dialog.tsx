import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { FileText, Volume2, Brain, GitBranch, Target, Hash, Sparkles } from 'lucide-react';
import { ParagraphAnalysis } from '../../types/analysis-types';
import { ExportFormat } from '../types/dialog-types';
import { ParagraphAnalysisDialogProps } from './paragraph-dialog-types';
import { BaseAnalysisDialog, DialogHeader } from '../common/base-analysis-dialog';
import { ParagraphDialogContent } from './paragraph-dialog-content';
import { ParagraphDialogActions } from './paragraph-dialog-actions';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogKeyboard } from '../hooks/use-dialog-keyboard';
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

/**
 * Paragraph Analysis Dialog Component
 * Main dialog component for paragraph analysis with modern UI/UX and micro-interactions
 */
export const ParagraphAnalysisDialog: React.FC<ParagraphAnalysisDialogProps> = ({
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
  onSummarize,
  onAnalyzeStructure,
  onAnalyzeKeywords,
  className,
  size = 'large',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
}) => {
  // Dialog state management
  const { state, actions } = useDialogState('paragraph');
  const { setActionLoading, loadingStates } = useDialogLoading('paragraph');
  const [activeTab, setActiveTab] = useState('topic');
  const [isAnimating, setIsAnimating] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle pronunciation with error handling
  const handlePronounce = useCallback(async (paragraph: string) => {
    try {
      setPronunciationError(null);
      onPronounce?.(paragraph);
    } catch (error) {
      setPronunciationError('Không thể phát âm đoạn văn này. Vui lòng thử lại.');
    }
  }, [onPronounce]);

  // Handle export with loading state
  const handleExport = useCallback(async (analysisData: ParagraphAnalysis, format: ExportFormat) => {
    try {
      setActionLoading('export', true);
      
      // If onExport prop is provided, use it
      if (onExport) {
        await onExport(analysisData, format);
      } else {
        // Default export implementation
        await exportParagraphAnalysis(analysisData, format);
      }
    } catch (error) {
      actions.setError('Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setActionLoading('export', false);
    }
  }, [onExport, actions, setActionLoading]);

  // Default export implementation
  const exportParagraphAnalysis = useCallback(async (analysis: ParagraphAnalysis, format: ExportFormat): Promise<void> => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `paragraph-analysis-${analysis.paragraph.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
    
    switch (format) {
      case 'txt':
        const textContent = formatParagraphAsText(analysis);
        downloadFile(textContent, `${filename}.txt`, 'text/plain');
        return;
      case 'json':
        const jsonContent = JSON.stringify(analysis, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
        return;
      case 'pdf':
        // For PDF, we'll use a simple text fallback for now
        // In a real implementation, you would use a library like jsPDF
        const pdfContent = formatParagraphAsText(analysis);
        downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
        return;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, []);

  // Format paragraph analysis as text
  const formatParagraphAsText = useCallback((analysis: ParagraphAnalysis): string => {
    let content = `PARAGRAPH ANALYSIS REPORT\n`;
    content += `============================\n\n`;
    content += `Paragraph: ${analysis.paragraph}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    if (analysis.mainTopic) {
      content += `MAIN TOPIC:\n${analysis.mainTopic}\n\n`;
    }
    
    if (analysis.tone) {
      content += `TONE:\n${analysis.tone}\n\n`;
    }
    
    if (analysis.targetAudience) {
      content += `TARGET AUDIENCE:\n${analysis.targetAudience}\n\n`;
    }
    
    if (analysis.type) {
      content += `TYPE:\n${analysis.type}\n\n`;
    }
    
    if (analysis.vocabularyLevel) {
      content += `VOCABULARY LEVEL:\n${analysis.vocabularyLevel}\n\n`;
    }
    
    if (analysis.sentimentLabel) {
      content += `SENTIMENT:\n${analysis.sentimentLabel}\n`;
      if (analysis.sentimentIntensity) {
        content += `Intensity: ${analysis.sentimentIntensity}\n`;
      }
      if (analysis.sentimentJustification) {
        content += `Justification: ${analysis.sentimentJustification}\n`;
      }
      content += '\n';
    }
    
    if (analysis.keywords && analysis.keywords.length > 0) {
      content += `KEYWORDS:\n`;
      analysis.keywords.forEach((keyword, index) => {
        content += `${index + 1}. ${keyword}\n`;
      });
      content += '\n';
    }
    
    if (analysis.betterVersion) {
      content += `BETTER VERSION:\n${analysis.betterVersion}\n\n`;
    }
    
    if (analysis.gapAnalysis) {
      content += `GAP ANALYSIS:\n${analysis.gapAnalysis}\n\n`;
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
  const handleShare = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      setActionLoading('share', true);
      
      // If onShare prop is provided, use it
      if (onShare) {
        await onShare(analysisData);
      } else {
        // Default share implementation
        await shareParagraphAnalysis(analysisData);
      }
    } catch (error) {
      actions.setError('Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setActionLoading('share', false);
    }
  }, [onShare, actions, setActionLoading]);

  // Default share implementation
  const shareParagraphAnalysis = useCallback(async (analysis: ParagraphAnalysis) => {
    const shareText = `Paragraph: "${analysis.paragraph.substring(0, 100)}..."\nMain Topic: ${analysis.mainTopic || 'N/A'}\nSentiment: ${analysis.sentimentLabel || 'N/A'}`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      // Use Web Share API if available
      try {
        await navigator.share({
          title: `Paragraph Analysis: ${analysis.mainTopic || 'Analysis'}`,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        // If user cancels or Web Share API fails, fallback to clipboard
        await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
    }
  }, []);

  // Handle print with loading state
  const handlePrint = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      setActionLoading('print', true);
      
      // If onPrint prop is provided, use it
      if (onPrint) {
        await onPrint(analysisData);
      } else {
        // Default print implementation
        printParagraphAnalysis(analysisData);
      }
    } catch (error) {
      actions.setError('Không thể in. Vui lòng thử lại.');
    } finally {
      setActionLoading('print', false);
    }
  }, [onPrint, actions, setActionLoading]);

  // Default print implementation
  const printParagraphAnalysis = useCallback((analysis: ParagraphAnalysis) => {
    const printContent = formatParagraphAsText(analysis);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Paragraph Analysis: ${analysis.mainTopic || 'Analysis'}</title>
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
  }, [formatParagraphAsText]);

  // Handle add to vocabulary with loading state
  const handleAddToVocabulary = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      actions.setLoading(true);
      await onAddToVocabulary?.(analysisData);
      // Show success animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    } catch (error) {
      actions.setError('Không thể thêm vào từ vựng. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onAddToVocabulary, actions]);

  // Handle edit
  const handleEdit = useCallback((analysisData: ParagraphAnalysis) => {
    onEdit?.(analysisData);
  }, [onEdit]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (analysisId: string) => {
    try {
      actions.setLoading(true);
      await onDelete?.(analysisId);
      onOpenChange(false);
    } catch (error) {
      actions.setError('Không thể xóa. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onDelete, onOpenChange, actions]);

  // Handle practice
  const handlePractice = useCallback((paragraph: string) => {
    onPractice?.(paragraph);
  }, [onPractice]);

  // Handle summarize
  const handleSummarize = useCallback((paragraph: string) => {
    onSummarize?.(paragraph);
  }, [onSummarize]);

  // Handle structure analysis
  const handleAnalyzeStructure = useCallback((paragraph: string) => {
    onAnalyzeStructure?.(paragraph);
  }, [onAnalyzeStructure]);

  // Handle keywords analysis
  const handleAnalyzeKeywords = useCallback((keywords: string[]) => {
    onAnalyzeKeywords?.(keywords);
  }, [onAnalyzeKeywords]);

  // Handle copy
  const handleCopy = useCallback(async (text: string) => {
    try {
      setActionLoading('copy', true);
      await navigator.clipboard.writeText(text);
    } catch (error) {
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
    if (!analysis) return 'Phân tích đoạn văn';
    
    return (
      <div className="flex items-center gap-2">
        <span>Phân tích đoạn văn: {analysis.paragraph.substring(0, 30)}{analysis.paragraph.length > 30 ? '...' : ''}</span>
        {onPronounce && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePronounce(analysis.paragraph)}
            aria-label={`Phát âm ${analysis.paragraph}`}
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
    if (analysis.type) parts.push(analysis.type);
    if (analysis.vocabularyLevel) parts.push(analysis.vocabularyLevel);
    if (analysis.tone) parts.push(analysis.tone);
    
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
    summarize: state.dialogState.loading && activeTab === 'summarize',
    analyzeStructure: state.dialogState.loading && activeTab === 'analyzeStructure',
    analyzeKeywords: state.dialogState.loading && activeTab === 'analyzeKeywords',
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
      // Focus on the paragraph when dialog opens
      const timer = setTimeout(() => {
        const paragraphElement = document.querySelector('[data-paragraph-highlight]');
        if (paragraphElement) {
          paragraphElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            paragraphElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 1000);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // Explicitly return undefined for the case when the condition is not met
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
      type="paragraph"
      title="Paragraph"
      subtitle={analysis ? `${analysis.paragraph.substring(0, 50)}${analysis.paragraph.length > 50 ? '...' : ''}` : "Loading..."}
      icon={
        <div className="flex items-center justify-center w-full h-full">
          <FileText className="h-5 w-5 text-primary" />
        </div>
      }
      className={cn(
        'paragraph-analysis-dialog',
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
        title={typeof dialogTitle === 'string' ? dialogTitle : 'Phân tích đoạn văn'}
        subtitle={dialogSubtitle}
        icon={
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md">
            <FileText className="h-5 w-5 text-primary" />
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

      {/* Dialog Content - Using modular components */}
      <div
        ref={dialogRef}
        className={cn(
          'transition-all duration-300 ease-in-out',
          isAnimating && 'opacity-80'
        )}
        role="region"
        aria-label="Nội dung phân tích đoạn văn"
      >
        <ParagraphDialogContent
          analysis={analysis}
          onPronounce={handlePronounce}
          onAnalyzeRelatedParagraph={handleAnalyzeStructure}
          onAnalyzeKeywords={handleAnalyzeKeywords}
          showPronunciation={true}
          showContext={true}
          className="px-6"
        />
      </div>

      {/* Dialog Actions */}
      <div className="px-6 pb-6">
        <ParagraphDialogActions
          analysis={analysis}
          onAddToVocabulary={handleAddToVocabulary}
          onExport={handleExport}
          onShare={handleShare}
          onPrint={handlePrint}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPractice={handlePractice}
          onSummarize={handleSummarize}
          onAnalyzeStructure={handleAnalyzeStructure}
          onAnalyzeKeywords={handleAnalyzeKeywords}
          onCopy={handleCopy}
          loading={actionLoadingStates}
          disabled={state.dialogState.loading}
          compact={false}
          className="mt-4"
        />
      </div>

      {/* Keyboard Shortcuts Help */}
      {/* <div className="px-6 pb-4 border-t">
        <div className="mt-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <span>Phím tắt:</span>
            <span>Esc: Đóng</span>
            <span>1-6: Chuyển tab</span>
            <span>Ctrl+P: In</span>
            <span>Ctrl+E: Xuất</span>
            <span>Ctrl+S: Chia sẻ</span>
            <span>Ctrl+F: Toàn màn hình</span>
            <span>Enter: Thực hiện hành động</span>
            <span>Tab: Điều hướng</span>
            <span>Ctrl+T: Tóm tắt</span>
            <span>Ctrl+K: Phân tích từ khóa</span>
            <span>Ctrl+R: Phân tích cấu trúc</span>
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

export default ParagraphAnalysisDialog;