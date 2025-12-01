'use client';

import React from 'react';
import { CompactResultCard } from './CompactResultCard';
import { RecentHistoryCard } from './RecentHistoryCard';
// import { SessionAnalysesList } from './SessionAnalysesList';
// COMMENTED: SessionAnalysesList đã được thay thế bằng HighlightsList để chuyển sang hệ thống highlights mới
// Có thể restore lại sau này nếu cần thiết
import { HighlightsList } from './HighlightsList';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import { useHighlights, type Highlight } from '@/hooks/useHighlights';

interface AnalysisSidebarProps {
  selectedText: string;
  analysisResult: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  activeTab: 'word' | 'phrase' | 'sentence' | 'paragraph';
  isLoading: boolean;
  error: string | null;
  hideResultCard?: boolean; // New prop to hide CompactResultCard when overlay is active

  // History props
  recentHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
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
  onAnalysisClick?: (analysis: any) => void;
  onAnalysisAnalyze?: (analysis: any) => void;
  onAnalysisRemove?: (analysisId: string, analysisType: string) => void;

  // Dialog actions
  onViewDetails: () => void;
}

/**
 * Component cho phần sidebar của trang Analysis
 * Bao gồm CompactResultCard, RecentHistoryCard và SessionAnalysesList
 */
export function AnalysisSidebar({
  selectedText,
  analysisResult,
  activeTab,
  isLoading,
  error,
  hideResultCard = false, // Default to false for backward compatibility

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
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,

  // Dialog actions
  onViewDetails
}: AnalysisSidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-3 lg:space-y-4 overflow-y-auto">
      {/* Compact Analysis Results - Hide when overlay is active */}
      {/* {!hideResultCard && (
        <CompactResultCard
          analysis={analysisResult}
          analysisType={activeTab}
          isLoading={isLoading}
          error={error}
          onViewDetails={onViewDetails}
        />
      )} */}

      {/* Session Word List */}
      {sessionId && (
        <HighlightsList
          sessionId={sessionId}
          onHighlightAnalyze={(highlight) => {
            // Chuyển đổi từ highlight sang analysis để tương thích với existing handlers
            if (onAnalysisAnalyze) {
              onAnalysisAnalyze(highlight);
            } else if (onWordAnalyze) {
              onWordAnalyze(highlight);
            }
          }}
          onHighlightViewDetails={(highlight) => {
            // Chuyển đổi từ highlight sang analysis để tương thích với existing handlers
            if (onAnalysisClick) {
              onAnalysisClick(highlight);
            }
          }}
          onHighlightRemove={(highlightId) => {
            // Chuyển đổi từ highlight sang analysis để tương thích với existing handlers
            if (onAnalysisRemove) {
              onAnalysisRemove(highlightId, 'highlight');
            } else if (onWordRemove) {
              onWordRemove(highlightId);
            }
          }}
          className="mb-4"
          compact={true}
        />
      )}
    </div>
  );
}

export default AnalysisSidebar;