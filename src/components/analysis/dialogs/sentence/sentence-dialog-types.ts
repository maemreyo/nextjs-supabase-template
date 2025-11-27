import { SentenceAnalysis } from '../../types/analysis-types';
import { ExportFormat, DialogAction } from '../types/dialog-types';

// Sentence Dialog Props
export interface SentenceAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: SentenceAnalysis | null;
  onPronounce?: (sentence: string) => void;
  onAddToVocabulary?: (analysis: SentenceAnalysis) => void;
  onExport?: (analysis: SentenceAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: SentenceAnalysis) => void;
  onPrint?: (analysis: SentenceAnalysis) => void;
  onEdit?: (analysis: SentenceAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (sentence: string) => void;
  onAnalyzeGrammar?: (sentence: string) => void;
  onBreakdown?: (sentence: string) => void;
  className?: string;
  size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'ultra' | 'mega' | 'ultra-wide' | 'fullscreen';
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
}

// Sentence Dialog Content Props
export interface SentenceDialogContentProps {
  analysis: SentenceAnalysis;
  onPronounce?: (sentence: string) => void;
  onAnalyzeRelatedSentence?: (sentence: string) => void;
  onBreakdownClause?: (clause: string) => void;
  showPronunciation?: boolean;
  showContext?: boolean;
  compact?: boolean;
  className?: string;
}

// Sentence Dialog Actions Props
export interface SentenceDialogActionsProps {
  analysis: SentenceAnalysis;
  onAddToVocabulary?: (analysis: SentenceAnalysis) => void;
  onExport?: (analysis: SentenceAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: SentenceAnalysis) => void;
  onPrint?: (analysis: SentenceAnalysis) => void;
  onEdit?: (analysis: SentenceAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (sentence: string) => void;
  onAnalyzeGrammar?: (sentence: string) => void;
  onCopy?: (text: string) => void;
  loading?: Record<string, boolean>;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// Sentence Information Section Props
export interface SentenceInfoSectionProps {
  analysis: SentenceAnalysis;
  onPronounce?: (sentence: string) => void;
  showPronunciation?: boolean;
  className?: string;
}

// Sentence Structure Section Props
export interface SentenceStructureSectionProps {
  subject?: string;
  mainVerb?: string;
  object?: string;
  clauses?: any;
  sentenceType?: string;
  onClauseClick?: (clause: string) => void;
  className?: string;
}

// Translation Section Props
export interface TranslationSectionProps {
  naturalTranslation?: string;
  literalTranslation?: string;
  mainIdea?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Grammar Analysis Section Props
export interface GrammarAnalysisSectionProps {
  function?: string;
  complexityLevel?: string;
  sentiment?: string;
  subtext?: string;
  sentence?: string;
  onAnalyzeGrammar?: (sentence: string) => void;
  className?: string;
}

// Context Section Props
export interface SentenceContextSectionProps {
  paragraphContext?: string;
  relationToPrevious?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Examples Section Props
export interface SentenceExamplesSectionProps {
  examples?: string[];
  onAnalyzeExample?: (example: string) => void;
  className?: string;
}

// Sentence Dialog Event Types
export type SentenceDialogEventType = 
  | 'sentence:pronounce'
  | 'sentence:add-to-vocabulary'
  | 'sentence:export'
  | 'sentence:share'
  | 'sentence:print'
  | 'sentence:edit'
  | 'sentence:delete'
  | 'sentence:practice'
  | 'sentence:analyze-grammar'
  | 'sentence:breakdown'
  | 'sentence:copy'
  | 'sentence:analyze-related';

// Sentence Dialog Event Interface
export interface SentenceDialogEvent<T = any> {
  type: SentenceDialogEventType;
  payload: T;
  timestamp: number;
}

// Sentence Dialog Action Configuration
export interface SentenceDialogActionConfig {
  primary: DialogAction[];
  secondary: DialogAction[];
  dropdown: DialogAction[];
}

// Sentence Dialog State
export interface SentenceDialogState {
  isPlaying: boolean;
  isAddingToVocabulary: boolean;
  isExporting: boolean;
  isSharing: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isAnalyzingGrammar: boolean;
  activeTab: 'info' | 'structure' | 'translation' | 'grammar' | 'context' | 'examples';
  showFullContext: boolean;
  pronunciationError: string | null;
  expandedClauses: string[];
}

// Sentence Dialog Settings
export interface SentenceDialogSettings {
  autoPlayPronunciation: boolean;
  showPronunciationByDefault: boolean;
  showContextByDefault: boolean;
  showGrammarByDefault: boolean;
  enableAnimations: boolean;
  enableKeyboardShortcuts: boolean;
  defaultExportFormat: ExportFormat;
}

// Sentence Dialog Analytics
export interface SentenceDialogAnalytics {
  openCount: number;
  pronunciationCount: number;
  addToVocabularyCount: number;
  exportCount: number;
  shareCount: number;
  grammarAnalysisCount: number;
  breakdownCount: number;
  averageViewTime: number;
  lastOpened: Date | null;
}

// Sentence Dialog Error Types
export type SentenceDialogErrorType = 
  | 'pronunciation-failed'
  | 'vocabulary-add-failed'
  | 'export-failed'
  | 'share-failed'
  | 'delete-failed'
  | 'grammar-analysis-failed'
  | 'breakdown-failed'
  | 'network-error'
  | 'validation-error';

// Sentence Dialog Error Interface
export interface SentenceDialogError {
  type: SentenceDialogErrorType;
  message: string;
  details?: any;
  timestamp: number;
}

// Export options specific to sentence analysis
export interface SentenceExportOptions {
  format: ExportFormat;
  includePronunciation: boolean;
  includeContext: boolean;
  includeGrammar: boolean;
  includeStructure: boolean;
  includeExamples: boolean;
  includeMetadata: boolean;
  customTemplate?: string;
  filename?: string;
}

// Vocabulary addition options
export interface SentenceVocabularyAdditionOptions {
  categoryId?: string;
  tags?: string[];
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  practiceFrequency?: 'daily' | 'weekly' | 'monthly';
  includeTranslation?: boolean;
  includeGrammar?: boolean;
}

// Practice session options
export interface SentencePracticeOptions {
  mode: 'translation' | 'pronunciation' | 'grammar' | 'structure' | 'reconstruction';
  difficulty?: 'easy' | 'medium' | 'hard';
  includeExamples?: boolean;
  timerEnabled?: boolean;
  timeLimit?: number;
  focusArea?: 'vocabulary' | 'grammar' | 'structure' | 'comprehension';
}

// Sentence pronunciation options
export interface SentencePronunciationOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
  pauseDuration?: number;
}

// Grammar analysis options
export interface GrammarAnalysisOptions {
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  includeExamples?: boolean;
  includeAlternatives?: boolean;
  focusArea?: 'tense' | 'structure' | 'voice' | 'mood' | 'clauses';
}