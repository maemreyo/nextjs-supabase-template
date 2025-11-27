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
      console.error('Pronunciation error:', error);
      setPronunciationError('Không thể phát âm đoạn văn này. Vui lòng thử lại.');
    }
  }, [onPronounce]);

  // Handle export with loading state
  const handleExport = useCallback(async (analysisData: ParagraphAnalysis, format: ExportFormat) => {
    try {
      actions.setLoading(true);
      await onExport?.(analysisData, format);
    } catch (error) {
      console.error('Export error:', error);
      actions.setError('Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onExport, actions]);

  // Handle share with loading state
  const handleShare = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      actions.setLoading(true);
      await onShare?.(analysisData);
    } catch (error) {
      console.error('Share error:', error);
      actions.setError('Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onShare, actions]);

  // Handle print with loading state
  const handlePrint = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      actions.setLoading(true);
      await onPrint?.(analysisData);
    } catch (error) {
      console.error('Print error:', error);
      actions.setError('Không thể in. Vui lòng thử lại.');
    } finally {
      actions.setLoading(false);
    }
  }, [onPrint, actions]);

  // Handle add to vocabulary with loading state
  const handleAddToVocabulary = useCallback(async (analysisData: ParagraphAnalysis) => {
    try {
      actions.setLoading(true);
      await onAddToVocabulary?.(analysisData);
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
      console.error('Delete error:', error);
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
  const handleCopy = useCallback((text: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Copy error:', error);
    }
  }, []);

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
  const loadingStates = useMemo(() => ({
    addToVocabulary: state.dialogState.loading && activeTab === 'vocabulary',
    share: state.dialogState.loading && activeTab === 'share',
    print: state.dialogState.loading && activeTab === 'print',
    edit: state.dialogState.loading && activeTab === 'edit',
    delete: state.dialogState.loading && activeTab === 'delete',
    practice: state.dialogState.loading && activeTab === 'practice',
    summarize: state.dialogState.loading && activeTab === 'summarize',
    analyzeStructure: state.dialogState.loading && activeTab === 'analyzeStructure',
    analyzeKeywords: state.dialogState.loading && activeTab === 'analyzeKeywords',
    'export-pdf': state.dialogState.loading && activeTab === 'export-pdf',
    'export-json': state.dialogState.loading && activeTab === 'export-json',
    'export-csv': state.dialogState.loading && activeTab === 'export-csv',
    'export-txt': state.dialogState.loading && activeTab === 'export-txt',
    'export-html': state.dialogState.loading && activeTab === 'export-html',
  }), [state.dialogState.loading, activeTab]);

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
      className={cn(
        'paragraph-analysis-dialog',
        isAnimating && 'animate-pulse',
        className
      )}
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
          loading={loadingStates}
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