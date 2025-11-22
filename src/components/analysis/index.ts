// Export all types
export * from './types';

// Export hooks
export { useAnalysisActions } from '@/hooks/useAnalysisActions';
export type {
  UseAnalysisActionsProps,
  ExportOptions,
  PrintOptions,
  ShareResult,
  AnalysisMetadata
} from '@/hooks/useAnalysisActions';

// Export view components
export {
  WordAnalysisView,
  SentenceAnalysisView,
  ParagraphAnalysisView
} from './AnalysisViews';

// Export helper components from AnalysisViews
export {
  SectionTitle,
  InfoItem,
  SentimentBadge,
  ProgressIndicator,
  AnalysisCard
} from './AnalysisViews';

// Export all components
export { default as WordAnalysisDisplay } from './WordAnalysisDisplay';
export { default as WordUsageSection } from './WordUsageSection';
export { default as CollocationList } from './CollocationList';
export { default as SynonymAntonymList } from './SynonymAntonymList';
export { default as SentenceAnalysisDisplay } from './SentenceAnalysisDisplay';
export { default as ParagraphAnalysisDisplay } from './ParagraphAnalysisDisplay';
export { default as RewriteSuggestions } from './RewriteSuggestions';
export { default as StructureBreakdown } from './StructureBreakdown';
export { default as ConstructiveFeedback } from './ConstructiveFeedback';
export { default as AnalysisEditor } from './AnalysisEditor';
export { default as AnalysisPanel } from './AnalysisPanel';
export { default as AnalysisResultDialog } from './AnalysisResultDialog';
export { default as SmartVocabularyDialog } from './SmartVocabularyDialog';
export { default as CompactResultCard } from './CompactResultCard';
export { default as CollapsibleAnalysisPanel } from './CollapsibleAnalysisPanel';

// Export utility functions
export {
  mapWordAnalysisToVocabulary,
  mapSentenceAnalysisToVocabulary,
  validateVocabularyData,
  extractWordsFromText,
  createVocabularyFromWord
} from './analysisUtils';
export type {
  ValidationResult,
  MappedVocabularyData
} from './analysisUtils';

// Export styles
import './styles.css';