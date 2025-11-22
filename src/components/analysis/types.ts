// Re-export types from AI module
export type {
  Collocation,
  WordAnalysis,
  SentenceAnalysis,
  ParagraphAnalysis
} from '@/lib/ai/types';

// Import types for use in interfaces
import type { Collocation, WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

// Props cho CollocationList component
export interface CollocationListProps {
  collocations: Collocation[];
  onCollocationClick?: (collocation: Collocation) => void;
  maxItems?: number;
  showFrequencyLevel?: boolean;
  className?: string;
}

// Props cho WordUsageSection component
export interface WordUsageSectionProps {
  usage: WordAnalysis['usage'];
  onCollocationClick?: (collocation: Collocation) => void;
  maxCollocations?: number;
  className?: string;
}

// Props cho WordAnalysisDisplay component
export interface WordAnalysisDisplayProps {
  analysis: WordAnalysis;
  isLoading?: boolean;
  error?: string;
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
  onCollocationClick?: (collocation: Collocation) => void;
  className?: string;
}

// Props cho SynonymAntonymList component
export interface SynonymAntonymListProps {
  synonyms: WordAnalysis['relations']['synonyms'];
  antonyms: WordAnalysis['relations']['antonyms'];
  onSynonymClick?: (word: string) => void;
  onAntonymClick?: (word: string) => void;
  maxItems?: number;
  className?: string;
}

// Props cho SentenceAnalysisDisplay component
export interface SentenceAnalysisDisplayProps {
  analysis: SentenceAnalysis;
  isLoading?: boolean;
  error?: string;
  onRewriteApply?: (text: string) => void;
  className?: string;
}

// Props cho ParagraphAnalysisDisplay component
export interface ParagraphAnalysisDisplayProps {
  analysis: ParagraphAnalysis;
  isLoading?: boolean;
  error?: string;
  onFeedbackApply?: (text: string) => void;
  className?: string;
}

// Props cho RewriteSuggestions component
export interface RewriteSuggestionsProps {
  suggestions: SentenceAnalysis['rewrite_suggestions'];
  onApply?: (text: string) => void;
  className?: string;
}

// Props cho StructureBreakdown component
export interface StructureBreakdownProps {
  structure: ParagraphAnalysis['structure_breakdown'];
  className?: string;
}

// Props cho ConstructiveFeedback component
export interface ConstructiveFeedbackProps {
  feedback: ParagraphAnalysis['constructive_feedback'];
  onApply?: (text: string) => void;
  className?: string;
}

// Props cho AnalysisEditor component
export interface AnalysisEditorProps {
  onTextSelect?: (text: string, type: 'word' | 'sentence' | 'paragraph') => void;
  onAnalyze?: (text: string, type: 'word' | 'sentence' | 'paragraph') => void;
  initialText?: string;
  className?: string;
}

// Props cho AnalysisTabs component
export interface AnalysisTabsProps {
  activeType: 'word' | 'sentence' | 'paragraph';
  onTypeChange: (type: 'word' | 'sentence' | 'paragraph') => void;
  className?: string;
}

// Props cho AnalysisPanel component
export interface AnalysisPanelProps {
  documentId?: string;
  selectedText?: string;
  analysisType: 'word' | 'sentence' | 'paragraph';
  onAnalysisTypeChange: (type: 'word' | 'sentence' | 'paragraph') => void;
  className?: string;
}

// Props cho CollapsibleAnalysisPanel component
export interface CollapsibleAnalysisPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
  onAddToVocabulary: () => void;
  className?: string;
}