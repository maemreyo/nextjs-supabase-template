'use client';

import React from 'react';
import { CompactResultCard } from './CompactResultCard';
import { RecentHistoryCard } from './RecentHistoryCard';
import { SessionWordList } from './SessionWordList';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

interface AnalysisSidebarProps {
  selectedText: string;
  analysisResult: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  activeTab: 'word' | 'phrase' | 'sentence' | 'paragraph';
  isLoading: boolean;
  error: string | null;
  isDetailDialogOpen: boolean;
  
  // History props
  recentHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  isHistoryOpen: boolean;
  onHistoryToggle: () => void;
  onHistoryItemClick: (item: any) => void;
  
  // Session props
  sessionId: string | null;
  getWordList: () => any[];
  onWordClick?: (wordItem: any) => void;
  onWordAnalyze?: (wordItem: any) => void;
  onWordRemove?: (wordId: string) => void;
  
  // Dialog actions
  onViewDetails: () => void;
}

/**
 * Component cho phần sidebar của trang Analysis
 * Bao gồm CompactResultCard, RecentHistoryCard và SessionWordList
 */
export function AnalysisSidebar({
  selectedText,
  analysisResult,
  activeTab,
  isLoading,
  error,
  isDetailDialogOpen,
  
  // History props
  recentHistory,
  isHistoryOpen,
  onHistoryToggle,
  onHistoryItemClick,
  
  // Session props
  sessionId,
  getWordList,
  onWordClick,
  onWordAnalyze,
  onWordRemove,
  
  // Dialog actions
  onViewDetails
}: AnalysisSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-3 lg:space-y-4 overflow-y-auto">
      {/* Compact Analysis Results */}
      {selectedText && (
        <CompactResultCard
          analysis={analysisResult}
          analysisType={activeTab}
          isLoading={isLoading}
          error={error}
          onViewDetails={onViewDetails}
        />
      )}

      {/* Session Word List */}
      {sessionId && (
        <SessionWordList
          words={getWordList()}
          onWordClick={onWordClick}
          onWordAnalyze={onWordAnalyze}
          onWordRemove={onWordRemove}
          className="mb-4"
        />
      )}
    </div>
  );
}

export default AnalysisSidebar;