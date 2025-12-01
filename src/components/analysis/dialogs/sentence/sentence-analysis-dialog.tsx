import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { FileText, Brain, GitBranch } from 'lucide-react';
import { SentenceAnalysis } from '../../types/analysis-types';
import { ExportFormat } from '../types/dialog-types';
import { SentenceAnalysisDialogProps } from './sentence-dialog-types';
import { BaseAnalysisDialog, DialogHeader } from '../common/base-analysis-dialog';
import { SentenceDialogContent } from './sentence-dialog-content';
import { SentenceDialogActions } from './sentence-dialog-actions';
import { SentencePronunciationAudioPlayer } from './sentence-pronunciation-audio-player';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogKeyboard } from '../hooks/use-dialog-keyboard';
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { analysisLogger, clientLogger } from '@/services/logger';
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';
import {
  exportAnalysis,
  shareAnalysis,
  printAnalysis,
  createShareText,
  createShareTitle,
  createPrintTitle,
  getFormatAsTextFunction
} from '../common/export-utils';

/**
 * Sentence Analysis Dialog Component
 * Main dialog component for sentence analysis with modern UI/UX and micro-interactions
 */
export const SentenceAnalysisDialog: React.FC<SentenceAnalysisDialogProps> = ({
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
  onAnalyzeGrammar,
  onBreakdown,
  className,
  size = 'large',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
}) => {
  // Dialog state management
  const { state, actions } = useDialogState('sentence');
  const { setActionLoading, loadingStates } = useDialogLoading('sentence');
  const [activeTab, setActiveTab] = useState('translation');
  const [isAnimating, setIsAnimating] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle pronunciation with error handling
  const handlePronounce = useCallback(async (sentence: string) => {
    try {
      setPronunciationError(null);
      onPronounce?.(sentence);
    } catch (error) {
      setPronunciationError('Không thể phát âm câu này. Vui lòng thử lại.');
    }
  }, [onPronounce]);

  // Handle export with loading state
  const handleExport = useCallback(async (analysis: SentenceAnalysis, format: ExportFormat) => {
    try {
      setActionLoading('export', true);
      
      // If onExport prop is provided, use it
      if (onExport) {
        await onExport(analysis, format);
      } else {
        // Default export implementation using shared utils
        await exportAnalysis(analysis as any, format, getFormatAsTextFunction(analysis));
      }
    } catch (error) {
      actions.setError('Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setActionLoading('export', false);
    }
  }, [onExport, actions, setActionLoading]);




  // Handle share with loading state
  const handleShare = useCallback(async (analysis: SentenceAnalysis) => {
    try {
      setActionLoading('share', true);
      
      // If onShare prop is provided, use it
      if (onShare) {
        await onShare(analysis);
      } else {
        // Default share implementation using shared utils
        const shareText = createShareText(analysis);
        const shareTitle = createShareTitle(analysis);
        await shareAnalysis(analysis as any, shareText, shareTitle);
      }
    } catch (error) {
      actions.setError('Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setActionLoading('share', false);
    }
  }, [onShare, actions, setActionLoading]);


  // Handle print with loading state
  const handlePrint = useCallback(async (analysis: SentenceAnalysis) => {
    try {
      setActionLoading('print', true);
      
      // If onPrint prop is provided, use it
      if (onPrint) {
        await onPrint(analysis);
      } else {
        // Default print implementation using shared utils
        const printContent = getFormatAsTextFunction(analysis)(analysis);
        const printTitle = createPrintTitle(analysis);
        await printAnalysis(analysis as any, printContent, printTitle);
      }
    } catch (error) {
      actions.setError('Không thể in. Vui lòng thử lại.');
    } finally {
      setActionLoading('print', false);
    }
  }, [onPrint, actions, setActionLoading]);


  // Handle add to vocabulary with loading state
  const handleAddToVocabulary = useCallback(async (analysis: SentenceAnalysis) => {
    try {
      actions.setLoading(true);
      await onAddToVocabulary?.(analysis);
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
  const handleEdit = useCallback((analysis: SentenceAnalysis) => {
    onEdit?.(analysis);
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
  const handlePractice = useCallback((sentence: string) => {
    onPractice?.(sentence);
  }, [onPractice]);

  // Handle grammar analysis
  const handleAnalyzeGrammar = useCallback((sentence: string) => {
    onAnalyzeGrammar?.(sentence);
  }, [onAnalyzeGrammar]);

  // Handle breakdown
  const handleBreakdown = useCallback((clause: string) => {
    onBreakdown?.(clause);
  }, [onBreakdown]);

  // Handle copy
  const handleCopy = useCallback(async (text: string) => {
    try {
      setActionLoading('copy', true);
      await navigator.clipboard.writeText(text);
      // Show success message
      actions.setError(null); // Clear any existing errors
      // You could add a toast notification here if you have one
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
    if (!analysis) return 'Phân tích câu';
    
    const sanitized = sanitizeAnalysisForHandlers(analysis);
    const sentence = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis.sentence;
    
    analysisLogger.debug('SentenceAnalysisDialog: dialogTitle creation', {
      analysisKeys: Object.keys(analysis),
      sanitized,
      sentence,
      sentenceType: typeof sentence
    });
    
    return (
      <div className="flex items-center gap-2">
        {/* <span>Phân tích câu: {sentence.substring(0, 30)}{sentence.length > 30 ? '...' : ''}</span> */}
        {onPronounce && (
          <SentencePronunciationAudioPlayer
            sentence={sentence}
            onPronounce={handlePronounce}
            className="scale-75"
          />
        )}
      </div>
    );
  }, [analysis, onPronounce, handlePronounce]);

  // Dialog subtitle with metadata
  const dialogSubtitle = useMemo(() => {
    if (!analysis) return undefined;
    
    const parts = [];
    if (analysis.sentenceType) parts.push(analysis.sentenceType);
    if (analysis.complexityLevel) parts.push(analysis.complexityLevel);
    if (analysis.function) parts.push(analysis.function);
    
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
    analyzeGrammar: state.dialogState.loading && activeTab === 'analyzeGrammar',
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
      // Focus on the sentence when dialog opens
      const timer = setTimeout(() => {
        const sentenceElement = document.querySelector('[data-sentence-highlight]');
        if (sentenceElement) {
          sentenceElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            sentenceElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
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
      type="sentence"
      title="Sentence"
      // subtitle={analysis ? `${(() => {
      //   const sanitized = sanitizeAnalysisForHandlers(analysis);
      //   const sentence = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis.sentence;
      //   return `${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}`;
      // })()}` : "Loading..."}
      icon={
        <div className="flex items-center justify-center w-full h-full">
          <FileText className="h-5 w-5 text-primary" />
        </div>
      }
      className={cn(
        'sentence-analysis-dialog',
        isAnimating && 'animate-pulse',
        className
      )}
      onExport={(analysisData, format) => {
        if (analysisData && format) {
          // Use sanitizeAnalysisForHandlers to ensure we have valid data
          const sanitized = sanitizeAnalysisForHandlers(analysisData);
          // Create a valid SentenceAnalysis object by merging sanitized data with original
          const validAnalysisData: SentenceAnalysis = {
            ...analysisData as SentenceAnalysis,
            id: sanitized.id,
            ...(sanitized.analysis_type === 'sentence' && {
              analysisType: sanitized.analysis_type,
              sentence: sanitized.sentence
            }),
          };
          handleExport(validAnalysisData, format);
        }
      }}
      onShare={(analysisData) => {
        if (analysisData) {
          // Use sanitizeAnalysisForHandlers to ensure we have valid data
          const sanitized = sanitizeAnalysisForHandlers(analysisData);
          // Create a valid SentenceAnalysis object by merging sanitized data with original
          const validAnalysisData: SentenceAnalysis = {
            ...analysisData as SentenceAnalysis,
            id: sanitized.id,
            ...(sanitized.analysis_type === 'sentence' && {
              analysisType: sanitized.analysis_type,
              sentence: sanitized.sentence
            }),
          };
          handleShare(validAnalysisData);
        }
      }}
      onPrint={(analysisData) => {
        if (analysisData) {
          // Use sanitizeAnalysisForHandlers to ensure we have valid data
          const sanitized = sanitizeAnalysisForHandlers(analysisData);
          // Create a valid SentenceAnalysis object by merging sanitized data with original
          const validAnalysisData: SentenceAnalysis = {
            ...analysisData as SentenceAnalysis,
            id: sanitized.id,
            ...(sanitized.analysis_type === 'sentence' && {
              analysisType: sanitized.analysis_type,
              sentence: sanitized.sentence
            }),
          };
          handlePrint(validAnalysisData);
        }
      }}
      onCopy={handleCopy}
      analysis={analysis}
    >
      {/* Custom Dialog Header */}
      {/* <DialogHeader
        title={typeof dialogTitle === 'string' ? dialogTitle : 'Phân tích câu'}
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
        aria-label="Nội dung phân tích câu"
      >
        <SentenceDialogContent
          analysis={analysis}
          onPronounce={handlePronounce}
          onAnalyzeRelatedSentence={handleAnalyzeGrammar}
          onBreakdownClause={handleBreakdown}
          showPronunciation={true}
          showContext={true}
          className="px-6"
        />
      </div>

      {/* Dialog Actions */}
      <div className="px-6 pb-6">
        <SentenceDialogActions
          analysis={analysis}
          onAddToVocabulary={handleAddToVocabulary}
          onExport={handleExport}
          onShare={handleShare}
          onPrint={handlePrint}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPractice={handlePractice}
          onAnalyzeGrammar={handleAnalyzeGrammar}
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
            <span>1-5: Chuyển tab</span>
            <span>Ctrl+P: In</span>
            <span>Ctrl+E: Xuất</span>
            <span>Ctrl+S: Chia sẻ</span>
            <span>Ctrl+F: Toàn màn hình</span>
            <span>Enter: Thực hiện hành động</span>
            <span>Tab: Điều hướng</span>
            <span>Ctrl+G: Phân tích ngữ pháp</span>
            <span>Ctrl+B: Phân tích cấu trúc</span>
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

export default SentenceAnalysisDialog;