import { AnalysisItem, AnalysisType } from '../../types/analysis-types';

// Dialog size options
export type DialogSize = 'default' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'ultra' | 'mega' | 'ultra-wide' | 'fullscreen';

// Export format options
export type ExportFormat = 'pdf' | 'json' | 'csv' | 'txt' | 'html';

// Dialog state interface
export interface DialogState {
  loading: boolean;
  error: string | null;
  fullscreen: boolean;
  resizedWidth?: number;
  lastUpdated: number;
  position?: { x: number; y: number };
  
  // New loading states for enhanced architecture
  fetching?: {
    fullData: boolean;
    relatedData: boolean;
  };
  
  actions?: Record<string, boolean>;
}

// Dialog settings interface
export interface DialogSettings {
  enableAnimations: boolean;
  enableKeyboardShortcuts: boolean;
  defaultDialogSize: DialogSize;
  enableResize: boolean;
  enableFullscreen: boolean;
}

// Global dialog state interface
export interface DialogGlobalState {
  // Dialog visibility states
  openDialogs: Record<AnalysisType, boolean>;
  
  // Dialog data storage
  dialogData: Record<AnalysisType, AnalysisItem | null>;
  
  // Individual dialog states
  dialogStates: Record<AnalysisType, DialogState>;
  
  // Global settings
  settings: DialogSettings;
}

// Dialog options interface
export interface DialogOptions {
  mode?: 'view' | 'edit' | 'export';
  format?: ExportFormat;
  size?: DialogSize;
  enableResize?: boolean;
  enableFullscreen?: boolean;
  position?: { x: number; y: number };
}

// Base dialog props interface
export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  size?: DialogSize;
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
  type?: AnalysisType;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

// Enhanced BaseDialogProps interface for loading configuration
export interface EnhancedBaseDialogProps extends BaseDialogProps {
  loadingConfig?: {
    showGlobalLoading: boolean;
    showActionLoading: boolean;
    customMessages?: Record<string, string>;
  };
}

// Word analysis dialog props
export interface WordAnalysisDialogProps extends BaseDialogProps {
  analysis: AnalysisItem | null;
  onPronounce?: (word: string) => void;
  onAddToVocabulary?: (word: AnalysisItem) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
}

// Phrase analysis dialog props
export interface PhraseAnalysisDialogProps extends BaseDialogProps {
  analysis: AnalysisItem | null;
  onAnalyzeWords?: (words: string[]) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
}

// Sentence analysis dialog props
export interface SentenceAnalysisDialogProps extends BaseDialogProps {
  analysis: AnalysisItem | null;
  onBreakdown?: (sentence: string) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
}

// Paragraph analysis dialog props
export interface ParagraphAnalysisDialogProps extends BaseDialogProps {
  analysis: AnalysisItem | null;
  onSummarize?: (paragraph: string) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
}

// Dialog header props
export interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

// Dialog footer props
export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'center' | 'right';
}

// Dialog action button interface
export interface DialogAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
}

// Dialog actions props
export interface DialogActionsProps {
  actions: DialogAction[];
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

// Export options interface
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeOriginalText: boolean;
  customTemplate?: string;
  filename?: string;
}

// Dialog event types
export type DialogEventType = 
  | 'dialog:open'
  | 'dialog:close'
  | 'dialog:data-update'
  | 'dialog:loading'
  | 'dialog:error'
  | 'dialog:settings-update';

// Dialog event interface
export interface DialogEvent<T = any> {
  type: DialogEventType;
  payload: T;
  timestamp: number;
}

// Dialog error types
export type DialogErrorType = 
  | 'network'
  | 'validation'
  | 'permission'
  | 'export'
  | 'share'
  | 'unknown';

// Dialog error interface
export interface DialogError {
  type: DialogErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}

// Dialog manager service interface
export interface DialogManagerService {
  // Dialog control methods
  openDialog: (type: AnalysisType, data: AnalysisItem, options?: DialogOptions) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  toggleDialog: (type: AnalysisType, data?: AnalysisItem) => void;
  
  // State access methods
  getDialogState: (type: AnalysisType) => DialogState;
  getAllDialogStates: () => Record<AnalysisType, DialogState>;
  getOpenDialogs: () => AnalysisType[];
  
  // Data management methods
  updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
  clearDialogData: (type: AnalysisType) => void;
  
  // Settings management
  updateSettings: (settings: Partial<DialogSettings>) => void;
  getSettings: () => DialogSettings;
  
  // Subscription methods
  subscribe: (callback: (state: DialogGlobalState) => void) => () => void;
  unsubscribe: (callback: (state: DialogGlobalState) => void) => void;
}

// Dialog store interface
export interface DialogStore extends DialogGlobalState {
  // Actions
  openDialog: (type: AnalysisType, data: AnalysisItem) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
  setDialogLoading: (type: AnalysisType, loading: boolean) => void;
  setDialogError: (type: AnalysisType, error: string | null) => void;
  toggleFullscreen: (type: AnalysisType) => void;
  setDialogWidth: (type: AnalysisType, width: number) => void;
  updateSettings: (settings: Partial<DialogSettings>) => void;
}

// Dialog state hook return type
export interface UseDialogStateReturn {
  state: {
    isOpen: boolean;
    data: AnalysisItem | null;
    dialogState: DialogState;
  };
  actions: {
    open: (data: AnalysisItem) => void;
    close: () => void;
    updateData: (data: AnalysisItem) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    toggleFullscreen: () => void;
    setWidth: (width: number) => void;
  };
}

// Dialog actions hook return type
export interface UseDialogActionsReturn {
  actions: {
    handleExport: (format: ExportFormat) => Promise<void>;
    handleShare: () => Promise<void>;
    handlePrint: () => void;
    handleCopy: () => void;
    handlePronounce: (text: string) => void;
  };
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

// Dialog keyboard shortcuts interface
export interface KeyboardShortcuts {
  escape: () => void;
  ctrlF: () => void;
  ctrlP: () => void;
  ctrlE: () => void;
  ctrlS: () => void;
  ctrlShiftC: () => void;
}

// Dialog keyboard hook props
export interface UseDialogKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onFullscreen?: () => void;
  onExport?: (format: ExportFormat) => void;
  onPrint?: () => void;
  onShare?: () => void;
}

// Dialog content props for different analysis types
export interface WordAnalysisContentProps {
  analysis: AnalysisItem;
  onPronounce?: (word: string) => void;
  showPhonetic?: boolean;
  compact?: boolean;
}

export interface PhraseAnalysisContentProps {
  analysis: AnalysisItem;
  onAnalyzeWords?: (words: string[]) => void;
  showComponents?: boolean;
  compact?: boolean;
}

export interface SentenceAnalysisContentProps {
  analysis: AnalysisItem;
  onBreakdown?: (sentence: string) => void;
  showClauses?: boolean;
  compact?: boolean;
}

export interface ParagraphAnalysisContentProps {
  analysis: AnalysisItem;
  onSummarize?: (paragraph: string) => void;
  showKeywords?: boolean;
  compact?: boolean;
}

// Dialog actions props for different analysis types
export interface WordAnalysisActionsProps {
  analysis: AnalysisItem;
  onAddToVocabulary?: (word: AnalysisItem) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
}

export interface PhraseAnalysisActionsProps {
  analysis: AnalysisItem;
  onAnalyzeWords?: (words: string[]) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
}

export interface SentenceAnalysisActionsProps {
  analysis: AnalysisItem;
  onBreakdown?: (sentence: string) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
}

export interface ParagraphAnalysisActionsProps {
  analysis: AnalysisItem;
  onSummarize?: (paragraph: string) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
}

// Re-export analysis types for convenience
export type { AnalysisType, AnalysisItem } from '../../types/analysis-types';