import { PhraseAnalysis } from '../../types/analysis-types';
import { ExportFormat, DialogAction } from '../types/dialog-types';

export interface PhraseAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: PhraseAnalysis;
  onPronounce?: (phrase: string) => void;
  onAddToVocabulary?: (analysis: PhraseAnalysis) => void;
  onExport?: (analysis: PhraseAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: PhraseAnalysis) => void;
  onPrint?: (analysis: PhraseAnalysis) => void;
  onEdit?: (analysis: PhraseAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (phrase: string) => void;
  className?: string;
  size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge' | 'ultra' | 'mega' | 'ultra-wide' | 'fullscreen';
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
}

export interface PhraseDialogContentProps {
  analysis: PhraseAnalysis;
  onPronounce?: (phrase: string) => void;
  onAnalyzeRelatedPhrase?: (phrase: string) => void;
  showPronunciation?: boolean;
  showContext?: boolean;
  className?: string;
}

export interface PhraseDialogActionsProps {
  analysis: PhraseAnalysis;
  onAddToVocabulary?: (analysis: PhraseAnalysis) => void;
  onExport?: (analysis: PhraseAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: PhraseAnalysis) => void;
  onPrint?: (analysis: PhraseAnalysis) => void;
  onEdit?: (analysis: PhraseAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (phrase: string) => void;
  onCopy?: (text: string) => void;
  loading?: Record<string, boolean>;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// Phrase Dialog Action Configuration
export interface PhraseDialogActionConfig {
  primary: DialogAction[];
  secondary: DialogAction[];
  dropdown: DialogAction[];
}

// Phrase Information Section Props
export interface PhraseInfoSectionProps {
  analysis: PhraseAnalysis;
  onPronounce?: (phrase: string) => void;
  showPronunciation?: boolean;
  className?: string;
}

// Pronunciation Section Props
export interface PhrasePronunciationSectionProps {
  phrase: string;
  onPronounce?: (phrase: string) => void;
  className?: string;
}

// Meaning Section Props
export interface PhraseMeaningSectionProps {
  naturalTranslation?: string;
  literalMeaning?: string;
  contextualMeaning?: string;
  vietnameseTranslation?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Examples Section Props
export interface PhraseExamplesSectionProps {
  usageExamples?: string[];
  usageTips?: string[];
  onAnalyzeExample?: (example: string) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Related Words Section Props
export interface PhraseRelatedWordsSectionProps {
  synonyms?: string[];
  antonyms?: string[];
  variations?: string[];
  onPhraseClick?: (phrase: string) => void;
  hoveredPhrase?: string | null;
  onPhraseHover?: (phrase: string | null) => void;
  className?: string;
}

// Context Section Props
export interface PhraseContextSectionProps {
  sentenceContext?: string;
  paragraphContext?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Additional Info Section Props
export interface PhraseAdditionalInfoSectionProps {
  partOfSpeech?: string;
  phraseType?: string;
  grammaticalPattern?: string;
  registerLevel?: string;
  complexityLevel?: string;
  frequencyLevel?: string;
  culturalNotes?: string;
  stylisticNotes?: string;
  memoryAid?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

export type PhraseDialogEventType =
  | 'phrase:pronounce'
  | 'phrase:add-to-vocabulary'
  | 'phrase:export'
  | 'phrase:share'
  | 'phrase:print'
  | 'phrase:edit'
  | 'phrase:delete'
  | 'phrase:practice'
  | 'phrase:copy'
  | 'phrase:analyze-related';

// Phrase Dialog Event Interface
export interface PhraseDialogEvent<T = any> {
  type: PhraseDialogEventType;
  payload: T;
  timestamp: number;
}

// Phrase Dialog State
export interface PhraseDialogState {
  isPlaying: boolean;
  isAddingToVocabulary: boolean;
  isExporting: boolean;
  isSharing: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  activeTab: 'meaning' | 'examples' | 'context' | 'related';
  showFullContext: boolean;
  pronunciationError: string | null;
}

// Phrase Dialog Settings
export interface PhraseDialogSettings {
  autoPlayPronunciation: boolean;
  showPronunciationByDefault: boolean;
  showContextByDefault: boolean;
  enableAnimations: boolean;
  enableKeyboardShortcuts: boolean;
  defaultExportFormat: ExportFormat;
}

// Phrase Dialog Analytics
export interface PhraseDialogAnalytics {
  openCount: number;
  pronunciationCount: number;
  addToVocabularyCount: number;
  exportCount: number;
  shareCount: number;
  averageViewTime: number;
  lastOpened: Date | null;
}

// Phrase Dialog Error Types
export type PhraseDialogErrorType =
  | 'pronunciation-failed'
  | 'vocabulary-add-failed'
  | 'export-failed'
  | 'share-failed'
  | 'delete-failed'
  | 'network-error'
  | 'validation-error';

// Phrase Dialog Error Interface
export interface PhraseDialogError {
  type: PhraseDialogErrorType;
  message: string;
  details?: any;
  timestamp: number;
}

// Export options specific to phrase analysis
export interface PhraseExportOptions {
  format: ExportFormat;
  includePronunciation: boolean;
  includeContext: boolean;
  includeExamples: boolean;
  includeRelatedPhrases: boolean;
  includeMetadata: boolean;
  customTemplate?: string;
  filename?: string;
}

// Vocabulary addition options
export interface PhraseVocabularyAdditionOptions {
  categoryId?: string;
  tags?: string[];
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  practiceFrequency?: 'daily' | 'weekly' | 'monthly';
}

// Practice session options
export interface PhrasePracticeSessionOptions {
  mode: 'flashcard' | 'spelling' | 'pronunciation' | 'usage';
  difficulty?: 'easy' | 'medium' | 'hard';
  includeExamples?: boolean;
  timerEnabled?: boolean;
  timeLimit?: number;
}

// Phrase pronunciation options
export interface PhrasePronunciationOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
}