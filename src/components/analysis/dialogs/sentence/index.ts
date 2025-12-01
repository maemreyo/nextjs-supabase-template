/*
 * DEPRECATED: Các component này đã được thay thế bởi hệ thống highlights mới
 * Giữ lại để tham khảo, có thể khôi phục sau này nếu cần
 *
 * These components have been replaced by the new highlights system
 * Kept for reference, can be restored later if needed
 */
// Sentence Analysis Dialog Components
// Export all sentence dialog related components for easy importing

export { SentenceAnalysisDialog } from './sentence-analysis-dialog';
export { SentenceDialogContent } from './sentence-dialog-content';
export { SentenceDialogActions } from './sentence-dialog-actions';
export { SentencePrimaryInformationDisplayCard } from './sentence-primary-information-display-card';
export { SentencePronunciationAudioPlayer } from './sentence-pronunciation-audio-player';
export { SentenceGrammarAnalysisSection } from './sentence-grammar-analysis-section';
export { SentenceMainIdeaBreakdownSection } from './sentence-main-idea-breakdown-section';
export { SentenceUsageExamplesSection } from './sentence-usage-examples-section';
export { SentenceRelatedSentencesSection } from './sentence-related-sentences-section';
export type {
  SentenceAnalysisDialogProps,
  SentenceDialogContentProps,
  SentenceDialogActionsProps,
  SentenceInfoSectionProps,
  SentenceStructureSectionProps,
  TranslationSectionProps,
  GrammarAnalysisSectionProps,
  SentenceContextSectionProps,
  SentenceExamplesSectionProps,
  SentenceDialogEventType,
  SentenceDialogEvent,
  SentenceDialogActionConfig,
  SentenceDialogState,
  SentenceDialogSettings,
  SentenceDialogAnalytics,
  SentenceDialogErrorType,
  SentenceDialogError,
  SentenceExportOptions,
  SentenceVocabularyAdditionOptions,
  SentencePracticeOptions,
  SentencePronunciationOptions,
  GrammarAnalysisOptions,
} from './sentence-dialog-types';

// Default export for convenience
export { default as SentenceAnalysisDialogDefault } from './sentence-analysis-dialog';