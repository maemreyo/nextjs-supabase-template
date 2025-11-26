import { ParagraphAnalysis } from '../../types/analysis-types';
import { ExportFormat, DialogAction } from '../types/dialog-types';

// Paragraph Dialog Props
export interface ParagraphAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: ParagraphAnalysis | null;
  onPronounce?: (paragraph: string) => void;
  onAddToVocabulary?: (analysis: ParagraphAnalysis) => void;
  onExport?: (analysis: ParagraphAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: ParagraphAnalysis) => void;
  onPrint?: (analysis: ParagraphAnalysis) => void;
  onEdit?: (analysis: ParagraphAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (paragraph: string) => void;
  onSummarize?: (paragraph: string) => void;
  onAnalyzeStructure?: (paragraph: string) => void;
  onAnalyzeKeywords?: (keywords: string[]) => void;
  className?: string;
  size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
  showCloseButton?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
}

// Paragraph Dialog Content Props
export interface ParagraphDialogContentProps {
  analysis: ParagraphAnalysis;
  onPronounce?: (paragraph: string) => void;
  onAnalyzeRelatedParagraph?: (paragraph: string) => void;
  onBreakdownSentence?: (sentence: string) => void;
  onAnalyzeKeywords?: (keywords: string[]) => void;
  showPronunciation?: boolean;
  showContext?: boolean;
  compact?: boolean;
  className?: string;
}

// Paragraph Dialog Actions Props
export interface ParagraphDialogActionsProps {
  analysis: ParagraphAnalysis;
  onAddToVocabulary?: (analysis: ParagraphAnalysis) => void;
  onExport?: (analysis: ParagraphAnalysis, format: ExportFormat) => void;
  onShare?: (analysis: ParagraphAnalysis) => void;
  onPrint?: (analysis: ParagraphAnalysis) => void;
  onEdit?: (analysis: ParagraphAnalysis) => void;
  onDelete?: (analysisId: string) => void;
  onPractice?: (paragraph: string) => void;
  onSummarize?: (paragraph: string) => void;
  onAnalyzeStructure?: (paragraph: string) => void;
  onAnalyzeKeywords?: (keywords: string[]) => void;
  onCopy?: (text: string) => void;
  loading?: Record<string, boolean>;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

// Paragraph Information Section Props
export interface ParagraphInfoSectionProps {
  analysis: ParagraphAnalysis;
  onPronounce?: (paragraph: string) => void;
  showPronunciation?: boolean;
  className?: string;
}

// Main Topic Section Props
export interface MainTopicSectionProps {
  mainTopic?: string;
  keywords?: string[];
  onAnalyzeKeywords?: (keywords: string[]) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Structure Analysis Section Props
export interface StructureAnalysisSectionProps {
  tone?: string;
  targetAudience?: string;
  type?: string;
  vocabularyLevel?: string;
  flowScore?: number;
  logicScore?: number;
  sentenceVariety?: string;
  onAnalyzeStructure?: (paragraph: string) => void;
  className?: string;
}

// Key Points Section Props
export interface KeyPointsSectionProps {
  keywords?: string[];
  transitionWords?: string[];
  onAnalyzeKeywords?: (keywords: string[]) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Summary Section Props
export interface SummarySectionProps {
  betterVersion?: string;
  gapAnalysis?: string;
  onSummarize?: (paragraph: string) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Context Section Props
export interface ParagraphContextSectionProps {
  paragraphContext?: string;
  relatedParagraphs?: string[];
  onAnalyzeRelatedParagraph?: (paragraph: string) => void;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

// Sentiment Analysis Section Props
export interface SentimentAnalysisSectionProps {
  sentimentLabel?: string;
  sentimentIntensity?: number;
  sentimentJustification?: string;
  onAnalyzeSentiment?: (paragraph: string) => void;
  className?: string;
}

// Paragraph Dialog Event Types
export type ParagraphDialogEventType = 
  | 'paragraph:pronounce'
  | 'paragraph:add-to-vocabulary'
  | 'paragraph:export'
  | 'paragraph:share'
  | 'paragraph:print'
  | 'paragraph:edit'
  | 'paragraph:delete'
  | 'paragraph:practice'
  | 'paragraph:summarize'
  | 'paragraph:analyze-structure'
  | 'paragraph:analyze-keywords'
  | 'paragraph:analyze-sentiment'
  | 'paragraph:copy'
  | 'paragraph:analyze-related';

// Paragraph Dialog Event Interface
export interface ParagraphDialogEvent<T = any> {
  type: ParagraphDialogEventType;
  payload: T;
  timestamp: number;
}

// Paragraph Dialog Action Configuration
export interface ParagraphDialogActionConfig {
  primary: DialogAction[];
  secondary: DialogAction[];
  dropdown: DialogAction[];
}

// Paragraph Dialog State
export interface ParagraphDialogState {
  isPlaying: boolean;
  isAddingToVocabulary: boolean;
  isExporting: boolean;
  isSharing: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isSummarizing: boolean;
  isAnalyzingStructure: boolean;
  isAnalyzingKeywords: boolean;
  isAnalyzingSentiment: boolean;
  activeTab: 'info' | 'topic' | 'structure' | 'keypoints' | 'summary' | 'context' | 'sentiment';
  showFullParagraph: boolean;
  pronunciationError: string | null;
  expandedSections: string[];
  selectedKeywords: string[];
}

// Paragraph Dialog Settings
export interface ParagraphDialogSettings {
  autoPlayPronunciation: boolean;
  showPronunciationByDefault: boolean;
  showContextByDefault: boolean;
  showSentimentByDefault: boolean;
  enableAnimations: boolean;
  enableKeyboardShortcuts: boolean;
  defaultExportFormat: ExportFormat;
}

// Paragraph Dialog Analytics
export interface ParagraphDialogAnalytics {
  openCount: number;
  pronunciationCount: number;
  addToVocabularyCount: number;
  exportCount: number;
  shareCount: number;
  summarizeCount: number;
  structureAnalysisCount: number;
  keywordsAnalysisCount: number;
  sentimentAnalysisCount: number;
  averageViewTime: number;
  lastOpened: Date | null;
}

// Paragraph Dialog Error Types
export type ParagraphDialogErrorType = 
  | 'pronunciation-failed'
  | 'vocabulary-add-failed'
  | 'export-failed'
  | 'share-failed'
  | 'delete-failed'
  | 'summarize-failed'
  | 'structure-analysis-failed'
  | 'keywords-analysis-failed'
  | 'sentiment-analysis-failed'
  | 'network-error'
  | 'validation-error';

// Paragraph Dialog Error Interface
export interface ParagraphDialogError {
  type: ParagraphDialogErrorType;
  message: string;
  details?: any;
  timestamp: number;
}

// Export options specific to paragraph analysis
export interface ParagraphExportOptions {
  format: ExportFormat;
  includePronunciation: boolean;
  includeContext: boolean;
  includeSentiment: boolean;
  includeStructure: boolean;
  includeKeywords: boolean;
  includeMetadata: boolean;
  customTemplate?: string;
  filename?: string;
}

// Vocabulary addition options
export interface ParagraphVocabularyAdditionOptions {
  categoryId?: string;
  tags?: string[];
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  practiceFrequency?: 'daily' | 'weekly' | 'monthly';
  includeKeywords?: boolean;
  includeContext?: boolean;
}

// Practice session options
export interface ParagraphPracticeOptions {
  mode: 'comprehension' | 'summarization' | 'keywords' | 'structure' | 'reconstruction';
  difficulty?: 'easy' | 'medium' | 'hard';
  includeKeywords?: boolean;
  timerEnabled?: boolean;
  timeLimit?: number;
  focusArea?: 'vocabulary' | 'structure' | 'comprehension' | 'sentiment';
}

// Paragraph pronunciation options
export interface ParagraphPronunciationOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  accent?: 'us' | 'uk' | 'au' | 'ca';
  pauseDuration?: number;
  sentencePause?: number;
}

// Structure analysis options
export interface StructureAnalysisOptions {
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  includeFlow?: boolean;
  includeLogic?: boolean;
  includeSentenceVariety?: boolean;
  focusArea?: 'tone' | 'structure' | 'vocabulary' | 'flow';
}

// Keywords analysis options
export interface KeywordsAnalysisOptions {
  maxKeywords?: number;
  includePhrases?: boolean;
  sortBy?: 'frequency' | 'importance' | 'alphabetical';
  minKeywordLength?: number;
  excludeCommonWords?: boolean;
}