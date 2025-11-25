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

// Export new refactored view components
export { default as WordPhraseAnalysisView } from './WordPhraseAnalysisView';
export { default as SentenceAnalysisViewComponent } from './SentenceAnalysisView';
export { default as ParagraphAnalysisViewComponent } from './ParagraphAnalysisView';

// Export helper components from AnalysisViews
export {
  SectionTitle,
  InfoItem,
  SentimentBadge,
  ProgressIndicator,
  AnalysisCard
} from './AnalysisViews';

// Export new helper components
export {
  Section,
  MetaBadge,
  DefinitionCard,
  InfoCard,
  RelationCard,
  CollocationCard,
  ScoreCard
} from './AnalysisResultHelpers';

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
export { SessionActions } from './SessionActions';

// New components for refactored page
export { default as AnalysisHeader } from './AnalysisHeader';
export { default as AnalysisSidebar } from './AnalysisSidebar';
export { default as RecentHistoryCard } from './RecentHistoryCard';
export { default as SessionAnalysesList } from './SessionAnalysesList';
export { default as AnalysisErrorAlert } from './AnalysisErrorAlert';
export { AnalysisSidebarSkeleton } from './AnalysisSidebarSkeleton';

// New components and helpers for multi-type analysis
export { default as AnalysisItemCard } from './components/AnalysisItemCard';
export {
  AnalysisSkeleton,
  WordAnalysisSkeleton,
  PhraseAnalysisSkeleton,
  SentenceAnalysisSkeleton,
  ParagraphAnalysisSkeleton,
  MixedAnalysisSkeleton
} from './components/AnalysisSkeleton';
export * from './helpers/pos-normalizer';
export * from './helpers/data-transformers';

// Explicit re-exports to avoid naming conflicts
export type {
  AnalysisType,
  AnalysisItem,
  WordAnalysis as NewWordAnalysis,
  PhraseAnalysis as NewPhraseAnalysis,
  SentenceAnalysis as NewSentenceAnalysis,
  ParagraphAnalysis as NewParagraphAnalysis,
  BaseAnalysis,
  SessionAnalysesListProps,
  AnalysisItemProps,
  LayoutConfig,
  DEFAULT_LAYOUTS,
  COMPACT_LAYOUTS
} from './types/analysis-types';

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