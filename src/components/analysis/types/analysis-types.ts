// Type definitions for different analysis types
// Based on database.types.ts schema
//
// IMPORTANT: Data Structure Clarification
// =====================================
// We have two data structures in the codebase:
// 1. Direct Structure (Current): Data fields are directly on the analysis item
//    - analysisItem.word, analysisItem.phrase, analysisItem.sentence, analysisItem.paragraph
//    - This is the current expected structure
// 2. Legacy Structure (Old): Data fields are nested under analysis property
//    - analysisItem.analysis.word, analysisItem.analysis.phrase, etc.
//    - This is kept for backward compatibility
//
// The logging and type checking should prioritize the direct structure
// and treat the nested structure as legacy fallback.

export type AnalysisType = 'word' | 'phrase' | 'sentence' | 'paragraph';

// Base analysis interface - Direct Structure (Current)
export interface BaseAnalysis {
  id: string;
  analysisId: string;
  sessionId: string;
  analysisType: AnalysisType;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}


// Word analysis interface
export interface WordAnalysis extends BaseAnalysis {
  analysisType: 'word';
  word: string;
  translation?: string;
  definition?: string;
  ipa?: string;
  pos?: string;
  cefr?: string;
  contextMeaning?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  tone?: string;
  rootMeaning?: string;
  inferenceClues?: string;
  inferenceReasoning?: string;
  paragraphContext?: string;
  sentenceContext?: string;
}

// Phrase analysis interface
export interface PhraseAnalysis extends BaseAnalysis {
  analysisType: 'phrase';
  phrase: string;
  naturalTranslation?: string;
  literalMeaning?: string;
  contextualMeaning?: string;
  vietnameseTranslation?: string;
  partOfSpeech?: string;
  phraseType?: string;
  grammaticalPattern?: string;
  registerLevel?: string;
  complexityLevel?: string;
  frequencyLevel?: string;
  culturalNotes?: string;
  stylisticNotes?: string;
  memoryAid?: string;
  usageExamples?: string[];
  usageTips?: string[];
  synonyms?: string[];
  antonyms?: string[];
  variations?: string[];
  sentenceContext?: string;
  paragraphContext?: string;
}

// Sentence analysis interface
export interface SentenceAnalysis extends BaseAnalysis {
  analysisType: 'sentence';
  sentence: string;
  naturalTranslation?: string;
  literalTranslation?: string;
  mainIdea?: string;
  subject?: string;
  mainVerb?: string;
  object?: string;
  function?: string;
  sentenceType?: string;
  complexityLevel?: string;
  sentiment?: string;
  subtext?: string;
  clauses?: any; // JSON type
  paragraphContext?: string;
  relationToPrevious?: string;
}

// Paragraph analysis interface
export interface ParagraphAnalysis extends BaseAnalysis {
  analysisType: 'paragraph';
  paragraph: string;
  mainTopic?: string;
  tone?: string;
  targetAudience?: string;
  type?: string;
  vocabularyLevel?: string;
  sentimentLabel?: string;
  sentimentIntensity?: number;
  sentimentJustification?: string;
  flowScore?: number;
  logicScore?: number;
  sentenceVariety?: string;
  betterVersion?: string;
  gapAnalysis?: string;
  keywords?: string[];
  transitionWords?: string[];
}

// Union type for all analysis types - Direct Structure (Current)
export type AnalysisItem = WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;


// Helper type guards for Direct Structure (Current)
export function isWordAnalysis(item: AnalysisItem): item is WordAnalysis {
  return item.analysisType === 'word';
}

export function isPhraseAnalysis(item: AnalysisItem): item is PhraseAnalysis {
  return item.analysisType === 'phrase';
}

export function isSentenceAnalysis(item: AnalysisItem): item is SentenceAnalysis {
  return item.analysisType === 'sentence';
}

export function isParagraphAnalysis(item: AnalysisItem): item is ParagraphAnalysis {
  return item.analysisType === 'paragraph';
}

// Helper type guards for structure detection
export function isDirectStructure(item: any): item is AnalysisItem {
  return item && typeof item === 'object' && 'analysisType' in item &&
    !!(item.word || item.phrase || item.sentence || item.paragraph);
}


// Helper function to get analysis type from any structure

// Props for the SessionAnalysesList component
export interface SessionAnalysesListProps {
  sessionId?: string;
  analyses?: AnalysisItem[];
  onAnalysisClick?: (analysis: AnalysisItem) => void;
  onAnalysisAnalyze?: (analysis: AnalysisItem) => void;
  onAnalysisRemove?: (analysisId: string, analysisType: AnalysisType) => void;
  className?: string;
  emptyMessage?: string;
  compact?: boolean; // For compact view mode
  pageSize?: number;
  enableDialogSystem?: boolean; // Enable dialog system for sidebar click functionality
}

// Props for individual analysis item components
export interface AnalysisItemProps {
  analysis: AnalysisItem;
  onClick?: (analysis: AnalysisItem) => void;
  onAnalyze?: (analysis: AnalysisItem) => void;
  onRemove?: (analysisId: string, analysisType: AnalysisType) => void;
  compact?: boolean;
  showPhonetic?: boolean;
  truncateLength?: number;
}

// Extended props for AnalysisItemCard with dialog system integration
export interface AnalysisItemCardProps extends AnalysisItemProps {
  layoutConfig?: 'default' | 'compact';
  className?: string;
  
  // Dialog system integration props
  enableDialogSystem?: boolean; // Feature flag to enable/disable new dialog system
  onViewDetails?: (analysis: AnalysisItem) => void; // Open view details dialog
  onEdit?: (analysis: AnalysisItem) => void; // Open edit dialog
  onExport?: (analysis: AnalysisItem, format?: 'pdf' | 'json' | 'csv' | 'txt' | 'html') => void; // Open export dialog
  onAddToVocabulary?: (analysis: AnalysisItem) => void; // Add to vocabulary
  onPractice?: (analysis: AnalysisItem) => void; // Open practice dialog
  
  // Dialog options
  dialogOptions?: {
    size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
    enableFullscreen?: boolean;
    enableResize?: boolean;
  };
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  
  // Accessibility
  ariaLabels?: {
    viewDetails?: string;
    edit?: string;
    export?: string;
    addToVocabulary?: string;
    practice?: string;
    remove?: string;
  };
}

// Layout configuration based on analysis type
export interface LayoutConfig {
  gridCols: string;
  cardPadding: string;
  titleSize: string;
  textSize: string;
  maxHeight?: string;
  truncateLength: number;
}

// Default layout configs for different analysis types
export const DEFAULT_LAYOUTS: Record<AnalysisType, LayoutConfig> = {
  word: {
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardPadding: 'p-3',
    titleSize: 'text-base font-semibold',
    textSize: 'text-sm',
    truncateLength: 150,
  },
  phrase: {
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
    cardPadding: 'p-4',
    titleSize: 'text-lg font-semibold',
    textSize: 'text-sm',
    truncateLength: 200,
  },
  sentence: {
    gridCols: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2',
    cardPadding: 'p-4',
    titleSize: 'text-lg font-semibold',
    textSize: 'text-base',
    truncateLength: 300,
  },
  paragraph: {
    gridCols: 'grid-cols-1',
    cardPadding: 'p-5',
    titleSize: 'text-xl font-semibold',
    textSize: 'text-base',
    maxHeight: 'max-h-64',
    truncateLength: 500,
  },
};

// Compact layout configs for different analysis types
export const COMPACT_LAYOUTS: Record<AnalysisType, LayoutConfig> = {
  word: {
    gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    cardPadding: 'p-2',
    titleSize: 'text-sm font-medium',
    textSize: 'text-xs',
    truncateLength: 80,
  },
  phrase: {
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardPadding: 'p-2',
    titleSize: 'text-sm font-medium',
    textSize: 'text-xs',
    truncateLength: 120,
  },
  sentence: {
    gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cardPadding: 'p-3',
    titleSize: 'text-sm font-medium',
    textSize: 'text-sm',
    truncateLength: 200,
  },
  paragraph: {
    gridCols: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2',
    cardPadding: 'p-3',
    titleSize: 'text-base font-medium',
    textSize: 'text-sm',
    maxHeight: 'max-h-32',
    truncateLength: 300,
  },
};