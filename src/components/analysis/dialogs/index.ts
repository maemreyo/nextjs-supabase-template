// Dialog Components Index
// Export all dialog related components for easy importing

// Base dialog components
export {
  BaseAnalysisDialog,
  DialogHeader,
  DialogFooter,
  DialogActions,
  DialogErrorBoundary,
  DialogLoadingSkeleton,
  DialogContainer,
  AnalysisDialogActionLoadingIndicatorsComponent,
  // Re-export Dialog components from UI library
  Dialog,
  DialogContent,
  DialogHeader as UIDialogHeader,
  DialogFooter as UIDialogFooter,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from './common/base-analysis-dialog';

// Dialog renderer components
export {
  DialogRootRenderer
} from './common/dialog-root-renderer';

export {
  DynamicAnalysisDialog
} from './common/dynamic-analysis-dialog-renderer';

// Dialog hooks
export { useDialogState } from './hooks/use-dialog-state';
export { useDialogKeyboard } from './hooks/use-dialog-keyboard';
export { useDialogLoading } from './hooks/use-dialog-loading';
export { useDialogActions } from './hooks/use-dialog-actions';

// Dialog types
export type { 
  DialogSize, 
  ExportFormat, 
  DialogState, 
  DialogSettings, 
  DialogGlobalState,
  DialogOptions,
  BaseDialogProps,
  WordAnalysisDialogProps,
  PhraseAnalysisDialogProps,
  SentenceAnalysisDialogProps,
  ParagraphAnalysisDialogProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogAction,
  DialogActionsProps,
  ExportOptions,
  DialogEventType,
  DialogEvent,
  DialogErrorType,
  DialogError,
  DialogManagerService,
  DialogStore,
  UseDialogStateReturn,
  UseDialogActionsReturn,
  KeyboardShortcuts,
  UseDialogKeyboardProps,
  WordAnalysisContentProps,
  PhraseAnalysisContentProps,
  SentenceAnalysisContentProps,
  ParagraphAnalysisContentProps,
  WordAnalysisActionsProps,
  PhraseAnalysisActionsProps,
  SentenceAnalysisActionsProps,
  ParagraphAnalysisActionsProps,
  AnalysisItem
} from './types/dialog-types';

// Dialog services
export { dialogManager } from './utils/dialog-service';
export { DialogDispatcher, useDialogDispatcher } from './utils/dialog-dispatcher';

// Word dialog components
export {
  WordAnalysisDialog,
  WordDialogContent,
  WordDialogActions
} from './word';

// Phrase dialog components
export {
  PhraseAnalysisDialog,
  PhraseDialogContent,
  PhraseDialogActions
} from './phrase';

// Sentence dialog components
export {
  SentenceAnalysisDialog,
  SentenceDialogContent,
  SentenceDialogActions
} from './sentence';

// Paragraph dialog components
export {
  ParagraphAnalysisDialog,
  ParagraphDialogContent,
  ParagraphDialogActions
} from './paragraph';