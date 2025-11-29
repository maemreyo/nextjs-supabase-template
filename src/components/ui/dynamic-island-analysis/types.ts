import type React from 'react';
import type { WordAnalysis, PhraseAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

export type StatusState = 'idle' | 'loading' | 'success' | 'error';

export interface AnalysisItem {
  id: string;
  state: StatusState;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'loading' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  // Analysis specific
  analysisData?: {
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
  };
  progress?: number;
  errorMsg?: string;
}

export interface DynamicIslandAnalysisProps {
  // Current props (required tương thích)
  isVisible?: boolean;
  isAnalyzing?: boolean;
  analysisResult?: {
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
  } | null;
  error?: string | null;
  onClose?: () => void;
  onViewDetails: () => void;
  progress?: number;
  className?: string;
  // Spec props
  position?: 'top' | 'bottom';
  autoExpand?: boolean;
  defaultDuration?: number;
  expandOnHover?: boolean;
}