/*
 * DEPRECATED: Các component này đã được thay thế bởi hệ thống highlights mới
 * Giữ lại để tham khảo, có thể khôi phục sau này nếu cần
 *
 * These components have been replaced by the new highlights system
 * Kept for reference, can be restored later if needed
 */
// Phrase Analysis Dialog Components
// Export all phrase dialog related components for easy importing

export { PhraseAnalysisDialog } from './phrase-analysis-dialog';
export { PhraseDialogContent } from './phrase-dialog-content';
export { PhraseDialogActions } from './phrase-dialog-actions';

// Export new modular components
export { PhrasePrimaryInformationDisplayCard } from './phrase-primary-information-display-card';
export { PhrasePronunciationAudioPlayer } from './phrase-pronunciation-audio-player';
export { PhraseContextualMeaningAnalysisSection } from './phrase-contextual-meaning-analysis-section';
export { PhraseUsageExamplesSection } from './phrase-usage-examples-section';
export { PhraseRelatedPhrasesSection } from './phrase-related-phrases-section';
export { PhraseGrammarPatternsSection } from './phrase-grammar-patterns-section';

export type {
  PhraseAnalysisDialogProps,
  PhraseDialogContentProps,
  PhraseDialogActionsProps,
  PhraseDialogEventType,
  PhraseInfoSectionProps,
  PhrasePronunciationSectionProps,
  PhraseMeaningSectionProps,
  PhraseExamplesSectionProps,
  PhraseRelatedWordsSectionProps,
  PhraseContextSectionProps,
  PhraseAdditionalInfoSectionProps,
  PhraseDialogActionConfig,
  PhraseDialogState,
  PhraseDialogSettings,
  PhraseDialogAnalytics,
  PhraseDialogErrorType,
  PhraseDialogError,
  PhraseExportOptions,
  PhraseVocabularyAdditionOptions,
  PhrasePracticeSessionOptions,
  PhrasePronunciationOptions,
} from './phrase-dialog-types';