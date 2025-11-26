// Paragraph Analysis Dialog Components
// Export all paragraph dialog related components for easy importing

export { ParagraphAnalysisDialog } from './paragraph-analysis-dialog';
export { ParagraphDialogContent } from './paragraph-dialog-content';
export { ParagraphDialogActions } from './paragraph-dialog-actions';

// Export new modular components
export { ParagraphPrimaryInformationDisplayCard } from './paragraph-primary-information-display-card';
export { ParagraphStructureAnalysisSection } from './paragraph-structure-analysis-section';
export { ParagraphSentimentAnalysisSection } from './paragraph-sentiment-analysis-section';
export { ParagraphSummarySection } from './paragraph-summary-section';
export { ParagraphKeyPointsExtractionSection } from './paragraph-key-points-extraction-section';
export { ParagraphContextSection } from './paragraph-context-section';

export type {
  ParagraphAnalysisDialogProps,
  ParagraphDialogContentProps,
  ParagraphDialogActionsProps,
  ParagraphInfoSectionProps,
  MainTopicSectionProps,
  StructureAnalysisSectionProps,
  KeyPointsSectionProps,
  SummarySectionProps,
  ParagraphContextSectionProps,
  SentimentAnalysisSectionProps,
  ParagraphDialogEventType,
  ParagraphDialogEvent,
  ParagraphDialogActionConfig,
  ParagraphDialogState,
  ParagraphDialogSettings,
  ParagraphDialogAnalytics,
  ParagraphDialogErrorType,
  ParagraphDialogError,
  ParagraphExportOptions,
  ParagraphVocabularyAdditionOptions,
  ParagraphPracticeOptions,
  ParagraphPronunciationOptions,
  StructureAnalysisOptions,
  KeywordsAnalysisOptions,
} from './paragraph-dialog-types';

// Default export for convenience
export { default as ParagraphAnalysisDialogDefault } from './paragraph-analysis-dialog';