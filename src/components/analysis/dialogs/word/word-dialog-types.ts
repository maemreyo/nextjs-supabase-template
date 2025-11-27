import { WordAnalysis } from '../../types/analysis-types';
import { ExportFormat, DialogAction } from '../types/dialog-types';

// Word Dialog Props
export interface WordAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: WordAnalysis | null;
  onPronounce?: (word: string) => void;
  onAddToVocabulary?: (word: WordAnalysis) => void;
  onExport?: (analysis: WordAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: WordAnalysis) => void;
  onPrint?: (analysis: WordAnalysis) => void;
  onEdit?: (analysis: WordAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (word: string) => void;
  className?: string;
  size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'ultra' | 'mega' | 'ultra-wide' | 'fullscreen';
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
}

// Word Dialog Content Props
export interface WordDialogContentProps {
  analysis: WordAnalysis;
  onPronounce?: (word: string) => void;
  onAnalyzeRelatedWord?: (word: string) => void;
  showPhonetic?: boolean;
  showContext?: boolean;
  compact?: boolean;
  className?: string;
}

// Word Dialog Actions Props
export interface WordDialogActionsProps {
  analysis: WordAnalysis;
  onAddToVocabulary?: (word: WordAnalysis) => void;
  onExport?: (analysis: WordAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: WordAnalysis) => void;
  onPrint?: (analysis: WordAnalysis) => void;
  onEdit?: (analysis: WordAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (word: string) => void;
  onCopy?: (text: string) => void;
  loading?: Record<string, boolean>;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// Word Information Section Props
export interface WordInfoSectionProps {
  analysis: WordAnalysis;
  onPronounce?: (word: string) => void;
  showPhonetic?: boolean;
  className?: string;
}

// Pronunciation Section Props
export interface PronunciationSectionProps {
  word: string;
  ipa?: string;
  onPronounce?: (word: string) => void;
  className?: string;
}

// Definition Section Props
export interface DefinitionSectionProps {
  definition?: string;
  translation?: string;
  contextMeaning?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Examples Section Props
export interface ExamplesSectionProps {
  exampleSentence?: string;
  exampleTranslation?: string;
  onAnalyzeExample?: (sentence: string) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Related Words Section Props
export interface RelatedWordsSectionProps {
  synonyms?: string[];
  antonyms?: string[];
  onWordClick?: (word: string) => void;
  hoveredWord?: string | null;
  onWordHover?: (word: string | null) => void;
  className?: string;
}

// Context Section Props
export interface ContextSectionProps {
  sentenceContext?: string;
  paragraphContext?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Additional Info Section Props
export interface AdditionalInfoSectionProps {
  pos?: string;
  cefr?: string;
  tone?: string;
  rootMeaning?: string;
  inferenceClues?: string;
  inferenceReasoning?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Word Dialog Event Types
export type WordDialogEventType = 
  | 'word:pronounce'
  | 'word:add-to-vocabulary'
  | 'word:export'
  | 'word:share'
  | 'word:print'
  | 'word:edit'
  | 'word:delete'
  | 'word:practice'
  | 'word:copy'
  | 'word:analyze-related';

// Word Dialog Event Interface
export interface WordDialogEvent<T = any> {
  type: WordDialogEventType;
  payload: T;
  timestamp: number;
}

// Word Dialog Action Configuration
export interface WordDialogActionConfig {
  primary: DialogAction[];
  secondary: DialogAction[];
  dropdown: DialogAction[];
}

// Word Dialog State
export interface WordDialogState {
  isPlaying: boolean;
  isAddingToVocabulary: boolean;
  isExporting: boolean;
  isSharing: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  activeTab: 'info' | 'examples' | 'context' | 'related';
  showFullContext: boolean;
  pronunciationError: string | null;
}

// Word Dialog Settings
export interface WordDialogSettings {
  autoPlayPronunciation: boolean;
  showPhoneticByDefault: boolean;
  showContextByDefault: boolean;
  enableAnimations: boolean;
  enableKeyboardShortcuts: boolean;
  defaultExportFormat: ExportFormat;
}

// Word Dialog Analytics
export interface WordDialogAnalytics {
  openCount: number;
  pronunciationCount: number;
  addToVocabularyCount: number;
  exportCount: number;
  shareCount: number;
  averageViewTime: number;
  lastOpened: Date | null;
}

// Word Dialog Error Types
export type WordDialogErrorType = 
  | 'pronunciation-failed'
  | 'vocabulary-add-failed'
  | 'export-failed'
  | 'share-failed'
  | 'delete-failed'
  | 'network-error'
  | 'validation-error';

// Word Dialog Error Interface
export interface WordDialogError {
  type: WordDialogErrorType;
  message: string;
  details?: any;
  timestamp: number;
}

// Export options specific to word analysis
export interface WordExportOptions {
  format: ExportFormat;
  includePhonetic: boolean;
  includeContext: boolean;
  includeExamples: boolean;
  includeRelatedWords: boolean;
  includeMetadata: boolean;
  customTemplate?: string;
  filename?: string;
}

// Vocabulary addition options
export interface VocabularyAdditionOptions {
  categoryId?: string;
  tags?: string[];
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  practiceFrequency?: 'daily' | 'weekly' | 'monthly';
}

// Practice session options
export interface PracticeSessionOptions {
  mode: 'flashcard' | 'spelling' | 'pronunciation' | 'usage';
  difficulty?: 'easy' | 'medium' | 'hard';
  includeExamples?: boolean;
  timerEnabled?: boolean;
  timeLimit?: number;
}

// Word pronunciation options
export interface PronunciationOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
}