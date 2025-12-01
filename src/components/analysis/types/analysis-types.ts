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

// Highlight Types
export type HighlightType = 'word' | 'phrase' | 'sentence' | 'paragraph';
export type HighlightStatus = 'pending_analysis' | 'analyzed' | 'error' | 'skipped';
export type HighlightCategory = HighlightType | 'collocations' | 'idioms' | 'grammar';

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
  synonyms?: string[];
  antonyms?: string[];
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

// Highlight Types
export interface Highlight {
  id: string;
  session_id: string;
  user_id: string;
  highlight_type: HighlightType;
  content: string;
  start_position: number;
  end_position: number;
  selected_text: string;
  color: string;
  status: HighlightStatus;
  analysis_id?: string | null;
  analysis_type?: string | null;
  created_at: string;
  updated_at: string;
  analyzed_at?: string | null;
  error_message?: string | null;
}

export interface HighlightMetadata {
  id: string;
  highlight_id: string;
  document_context?: string | null;
  paragraph_index?: number | null;
  sentence_index?: number | null;
  selection_duration_ms?: number | null;
  click_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HighlightWithAnalysis extends Highlight {
  // Include analysis data if available
  analysis_data?: any;
  // Include metadata
  document_context?: string | null;
  paragraph_index?: number | null;
  sentence_index?: number | null;
  selection_duration_ms?: number | null;
  click_count?: number;
  highlight_metadata?: Record<string, any>;
}

// Highlight Analysis Request Types
export interface HighlightAnalysisRequest {
  text: string;
  context?: string;
  maxItems?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface HighlightAnalysisResult {
  category: HighlightCategory;
  confidence: number;
  analysis: any;
}

// Highlight Analysis Data Types (based on prompt-utils.ts)
export interface HighlightWordAnalysis {
  category: 'word';
  confidence: number;
  word: string;
  meta: {
    ipa: string;
    pos: string;
    cefr: string;
    frequency: string;
    etymology?: string;
    register: string;
  };
  definitions: {
    root_meaning: string;
    context_meaning: string;
    vietnamese_translation: string;
    nuances: string;
  };
  relations: {
    synonyms: Array<{
      word: string;
      meaning: string;
      usage: string;
    }>;
    antonyms: Array<{
      word: string;
      meaning: string;
      usage: string;
    }>;
  };
  usage: {
    collocations: Array<{
      phrase: string;
      meaning: string;
      frequency: string;
    }>;
    examples: Array<{
      sentence: string;
      translation: string;
      context: string;
    }>;
    common_mistakes: Array<{
      mistake: string;
      correction: string;
      explanation: string;
    }>;
  };
  learning_tips: {
    memory_techniques: string[];
    practice_exercises: string[];
    related_concepts: string[];
  };
}

export interface HighlightPhraseAnalysis {
  category: 'phrase';
  confidence: number;
  phrase: string;
  meta: {
    type: string;
    structure: string;
    register: string;
    cefr: string;
    frequency: string;
  };
  definitions: {
    literal_meaning?: string;
    figurative_meaning?: string;
    vietnamese_translation: string;
    usage_notes: string;
    cultural_context?: string;
  };
  components: Array<{
    word: string;
    role: string;
    meaning: string;
    ipa: string;
  }>;
  variations: Array<{
    phrase: string;
    meaning: string;
    usage: string;
    example: string;
  }>;
  usage: {
    examples: Array<{
      sentence: string;
      translation: string;
      context: string;
    }>;
    collocations: Array<{
      phrase: string;
      meaning: string;
      frequency: string;
    }>;
    common_mistakes: Array<{
      mistake: string;
      correction: string;
      explanation: string;
    }>;
  };
  learning_tips: {
    memory_techniques: string[];
    practice_exercises: string[];
    related_concepts: string[];
  };
}

export interface HighlightSentenceAnalysis {
  category: 'sentence';
  confidence: number;
  sentence: string;
  meta: {
    type: string;
    complexity: string;
    tone: string;
    register: string;
    purpose: string;
  };
  structure: {
    subject: string;
    predicate: string;
    clauses: Array<{
      type: string;
      content: string;
      function: string;
    }>;
    modifiers: Array<{
      type: string;
      content: string;
      target: string;
    }>;
    connectors: string[];
  };
  meaning: {
    main_idea: string;
    supporting_ideas: string[];
    sentiment: string;
    implications: string;
    presuppositions: string[];
  };
  style_analysis: {
    clarity: string;
    conciseness: string;
    coherence: string;
    emphasis: string;
  };
  variations: Array<{
    style: string;
    sentence: string;
    changes: string;
    effect: string;
  }>;
  common_patterns: Array<{
    pattern: string;
    example: string;
    explanation: string;
  }>;
  learning_tips: {
    common_errors: string[];
    practice_suggestions: string[];
    related_concepts: string[];
  };
}

export interface HighlightParagraphAnalysis {
  category: 'paragraph';
  confidence: number;
  paragraph: string;
  meta: {
    type: string;
    tone: string;
    audience: string;
    purpose: string;
    register: string;
  };
  content: {
    main_topic: string;
    thesis_statement?: string;
    key_points: Array<{
      point: string;
      support: string;
      importance: string;
    }>;
    sentiment: {
      label: string;
      intensity: number;
      justification: string;
    };
    keywords: string[];
  };
  structure: {
    organization: Array<{
      type: string;
      description: string;
    }>;
    sentences: Array<{
      index: number;
      text: string;
      role: string;
      function: string;
      analysis: string;
    }>;
    transitions: Array<{
      type: string;
      words: string[];
    }>;
  };
  rhetorical_devices: Array<{
    device: string;
    example: string;
    effect: string;
  }>;
  style_analysis: {
    vocabulary: {
      level: string;
      variety: string;
      jargon: string;
    };
    sentence_structure: {
      variety: string;
      complexity: string;
      average_length: string;
    };
    cohesion: {
      logic_score: number;
      flow_score: number;
      connectives: string[];
    };
  };
  evaluation: {
    strengths: Array<{
      aspect: string;
      description: string;
    }>;
    weaknesses: Array<{
      aspect: string;
      description: string;
      suggestion: string;
    }>;
    improvement_suggestions: Array<{
      area: string;
      suggestion: string;
      priority: string;
    }>;
  };
  learning_tips: {
    writing_techniques: string[];
    common_patterns: string[];
    related_concepts: string[];
  };
}

export interface HighlightCollocationsAnalysis {
  category: 'collocations';
  confidence: number;
  text: string;
  meta: {
    focus_words: string[];
    collocation_types: string[];
    frequency_level: string;
  };
  collocations: Array<{
    phrase: string;
    type: string;
    structure: string;
    meaning: string;
    usage: string;
    frequency: string;
    register: string;
    examples: Array<{
      sentence: string;
      translation: string;
      context: string;
    }>;
    variations: Array<{
      phrase: string;
      meaning: string;
    }>;
  }>;
  patterns: Array<{
    pattern: string;
    explanation: string;
    examples: Array<{
      example: string;
      translation: string;
    }>;
  }>;
  usage_guidelines: {
    common_mistakes: Array<{
      mistake: string;
      correction: string;
      explanation: string;
    }>;
    learning_tips: Array<{
      tip: string;
      technique: string;
    }>;
    practice_suggestions: Array<{
      exercise: string;
      instruction: string;
    }>;
  };
  related_concepts: Array<{
    concept: string;
    description: string;
  }>;
}

export interface HighlightIdiomsAnalysis {
  category: 'idioms';
  confidence: number;
  text: string;
  meta: {
    idiom_types: string[];
    cultural_context: string;
    historical_period?: string;
  };
  idioms: Array<{
    idiom: string;
    literal_meaning: string;
    figurative_meaning: string;
    origin: {
      source: string;
      historical_context: string;
      etymology?: string;
    };
    usage: {
      context: string;
      register: string;
      frequency: string;
    };
    examples: Array<{
      sentence: string;
      translation: string;
      context: string;
      source: string;
    }>;
    variations: Array<{
      form: string;
      meaning: string;
      usage: string;
    }>;
    related_expressions: Array<{
      expression: string;
      meaning: string;
      relationship: string;
    }>;
  }>;
  cultural_analysis: {
    metaphor_basis: {
      concept: string;
      explanation: string;
    };
    regional_variations: Array<{
      region: string;
      variation: string;
      meaning: string;
    }>;
  };
  learning_tips: {
    memory_techniques: Array<{
      technique: string;
      explanation: string;
    }>;
    common_mistakes: Array<{
      mistake: string;
      correction: string;
      explanation: string;
    }>;
    practice_suggestions: Array<{
      exercise: string;
      instruction: string;
    }>;
  };
  related_concepts: Array<{
    concept: string;
    description: string;
  }>;
}

export interface HighlightGrammarAnalysis {
  category: 'grammar';
  confidence: number;
  text: string;
  meta: {
    grammar_focus: string[];
    complexity_level: string;
  };
  structures: Array<{
    type: string;
    pattern: string;
    explanation: string;
    examples: Array<{
      sentence: string;
      translation: string;
      analysis: string;
    }>;
    common_errors: Array<{
      error: string;
      correction: string;
      explanation: string;
    }>;
    variations: Array<{
      variation: string;
      usage: string;
    }>;
  }>;
  analysis: {
    complexity: {
      level: string;
      factors: string[];
      explanation: string;
    };
    usage_patterns: {
      formal_contexts: string[];
      informal_contexts: string[];
      frequency: string;
    };
    common_errors: Array<{
      error: string;
      correction: string;
      explanation: string;
    }>;
    tips: Array<{
      tip: string;
      application: string;
    }>;
  };
  learning_resources: {
    grammar_rules: Array<{
      rule: string;
      explanation: string;
    }>;
    practice_exercises: Array<{
      exercise: string;
      instruction: string;
    }>;
    reference_materials: Array<{
      material: string;
      type: string;
    }>;
  };
  related_concepts: Array<{
    concept: string;
    description: string;
  }>;
}

// Union type for all highlight analysis types
export type HighlightAnalysisData =
  | HighlightWordAnalysis
  | HighlightPhraseAnalysis
  | HighlightSentenceAnalysis
  | HighlightParagraphAnalysis
  | HighlightCollocationsAnalysis
  | HighlightIdiomsAnalysis
  | HighlightGrammarAnalysis;

// Helper type guards for highlight analysis
export function isHighlightWordAnalysis(analysis: HighlightAnalysisData): analysis is HighlightWordAnalysis {
  return analysis.category === 'word';
}

export function isHighlightPhraseAnalysis(analysis: HighlightAnalysisData): analysis is HighlightPhraseAnalysis {
  return analysis.category === 'phrase';
}

export function isHighlightSentenceAnalysis(analysis: HighlightAnalysisData): analysis is HighlightSentenceAnalysis {
  return analysis.category === 'sentence';
}

export function isHighlightParagraphAnalysis(analysis: HighlightAnalysisData): analysis is HighlightParagraphAnalysis {
  return analysis.category === 'paragraph';
}

export function isHighlightCollocationsAnalysis(analysis: HighlightAnalysisData): analysis is HighlightCollocationsAnalysis {
  return analysis.category === 'collocations';
}

export function isHighlightIdiomsAnalysis(analysis: HighlightAnalysisData): analysis is HighlightIdiomsAnalysis {
  return analysis.category === 'idioms';
}

export function isHighlightGrammarAnalysis(analysis: HighlightAnalysisData): analysis is HighlightGrammarAnalysis {
  return analysis.category === 'grammar';
}


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
    // Removed maxHeight to allow natural height based on content
  },
  phrase: {
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
    cardPadding: 'p-4',
    titleSize: 'text-lg font-semibold',
    textSize: 'text-sm',
    truncateLength: 200,
    // Removed maxHeight to allow natural height based on content
  },
  sentence: {
    gridCols: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2',
    cardPadding: 'p-4',
    titleSize: 'text-lg font-semibold',
    textSize: 'text-base',
    truncateLength: 300,
    // Removed maxHeight to allow natural height based on content
  },
  paragraph: {
    gridCols: 'grid-cols-1',
    cardPadding: 'p-5',
    titleSize: 'text-xl font-semibold',
    textSize: 'text-base',
    // Removed maxHeight to allow natural height based on content
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
    // Removed maxHeight to allow natural height based on content
  },
  phrase: {
    gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardPadding: 'p-2',
    titleSize: 'text-sm font-medium',
    textSize: 'text-xs',
    truncateLength: 120,
    // Removed maxHeight to allow natural height based on content
  },
  sentence: {
    gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cardPadding: 'p-3',
    titleSize: 'text-sm font-medium',
    textSize: 'text-sm',
    truncateLength: 200,
    // Removed maxHeight to allow natural height based on content
  },
  paragraph: {
    gridCols: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2',
    cardPadding: 'p-3',
    titleSize: 'text-base font-medium',
    textSize: 'text-sm',
    // Removed maxHeight to allow natural height based on content
    truncateLength: 300,
  },
};