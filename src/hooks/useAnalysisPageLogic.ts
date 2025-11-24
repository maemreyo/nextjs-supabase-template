'use client';

import React from 'react';
import { useState, useCallback, useRef, useMemo } from 'react';
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';
import { usePhraseAnalysis } from '@/hooks/usePhraseAnalysis';
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

export interface UseAnalysisPageLogicProps {
  sessionId?: string;
}

export interface UseAnalysisPageLogicReturn {
  // State
  activeTab: 'word' | 'phrase' | 'sentence' | 'paragraph';
  selectedText: string;
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  analysisResult: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  isDetailDialogOpen: boolean;
  analysisPanelOpen: boolean;
  
  // Sidebar state
  isAnalysisTypeOpen: boolean;
  isQuickActionsOpen: boolean;
  isHistoryOpen: boolean;
  
  // Store state
  storeSelectedText: string;
  storeSelectedType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  storeActiveTab: 'word' | 'phrase' | 'sentence' | 'paragraph';
  storeIsAnalyzing: boolean;
  lastError: string | null;
  analysisHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  
  // Computed values
  recentHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  currentLoading: boolean;
  
  // Mutations
  wordAnalysisMutation: any;
  sentenceAnalysisMutation: any;
  paragraphAnalysisMutation: any;
  phraseAnalysis: any;
  
  // Actions
  setActiveTab: (tab: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  setAnalysisType: (type: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  setSelectedText: (text: string) => void;
  setIsDetailDialogOpen: (open: boolean) => void;
  setAnalysisPanelOpen: (open: boolean) => void;
  setIsHistoryOpen: (open: boolean) => void;
  setIsAnalysisTypeOpen: (open: boolean) => void;
  setIsQuickActionsOpen: (open: boolean) => void;
  
  // Handlers
  handleTextSelect: (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  handleAnalyze: (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => Promise<any>;
  handleTabChange: (tab: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  handleRewriteApply: (text: string) => void;
  handleFeedbackApply: (text: string) => void;
  handleClearAll: () => void;
}

/**
 * Custom hook để quản lý logic chính của trang Analysis
 * Bao gồm state management, event handlers, và sync với stores
 */
export function useAnalysisPageLogic({ sessionId }: UseAnalysisPageLogicProps): UseAnalysisPageLogicReturn {
  // Local state
  const [activeTab, setActiveTabState] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedTextState] = useState('');
  const [analysisType, setAnalysisTypeState] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);

  // Ref to track the last analysis request at parent level
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  // Sidebar collapsible sections state
  const [isAnalysisTypeOpen, setIsAnalysisTypeOpen] = useState(true);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // Store state và actions
  const {
    selectedText: storeSelectedText,
    selectedType: storeSelectedType,
    activeTab: storeActiveTab,
    isAnalyzing: storeIsAnalyzing,
    lastError,
    analysisHistory
  } = useAnalysisStore();

  const {
    getRecentHistory
  } = useAnalysisSelectors();

  const {
    clearAll
  } = useAnalysisActions();

  // Mutations cho analysis
  const wordAnalysisMutation = useWordAnalysisMutation();
  const sentenceAnalysisMutation = useSentenceAnalysisMutation();
  const paragraphAnalysisMutation = useParagraphAnalysisMutation();
  const phraseAnalysis = usePhraseAnalysis();

  // Sync local state với store state
  const syncWithStore = useCallback(() => {
    if (storeSelectedText) {
      setSelectedTextState(storeSelectedText);
      setAnalysisTypeState(storeSelectedType);
      setActiveTabState(storeSelectedType);
    }
  }, [storeSelectedText, storeSelectedType, storeActiveTab]);

  // Sync effect
  React.useEffect(() => {
    syncWithStore();
  }, [syncWithStore]);

  // Event handlers
  const handleTextSelect = useCallback((text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    setSelectedTextState(text);
    setAnalysisTypeState(type);
    setActiveTabState(type);
    setErrorState(null);
  }, []);

  const handleAnalyze = useCallback(async (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    if (!text.trim()) return;

    // Check if this is a duplicate request (same text and type within last 2 seconds)
    const now = Date.now();
    const lastAnalysis = lastAnalysisRef.current;
    if (lastAnalysis &&
      lastAnalysis.text === text &&
      lastAnalysis.type === type &&
      (now - lastAnalysis.timestamp) < 2000) {

      return;
    }

    // Update the last analysis ref
    lastAnalysisRef.current = {
      text,
      type,
      timestamp: now
    };

    setIsAnalyzingState(true);
    setErrorState(null);

    try {
      let result;

      switch (type) {
        case 'word':
          // Extract context for word analysis
          const words = text.split(/\s+/);
          const wordToAnalyze = words[0];
          const sentenceContext = words.slice(0, 5).join(' '); // First 5 words as context

          if (!wordToAnalyze) {
            throw new Error('Không tìm thấy từ để phân tích');
          }

          result = await wordAnalysisMutation.mutateAsync({
            word: wordToAnalyze,
            sentenceContext,
            paragraphContext: '',
            sessionId: sessionId || undefined
          });
          break;

        case 'phrase':
          // Use phrase analysis API
          const phraseWords = text.split(/\s+/);
          const phraseContext = phraseWords.slice(0, 5).join(' '); // First 5 words as context

          if (!text.trim()) {
            throw new Error('Không tìm thấy cụm từ để phân tích');
          }

          const phraseResult = await phraseAnalysis.analyzePhrase(text, phraseContext, '');
              break;
    
            case 'sentence':
              result = await sentenceAnalysisMutation.mutateAsync({
                sentence: text,
                sessionId: sessionId || undefined
              });
              break;
    
            case 'paragraph':
              result = await paragraphAnalysisMutation.mutateAsync({
                paragraph: text,
                sessionId: sessionId || undefined
              });
              break;
    
            default:
              throw new Error('Invalid analysis type');
          }
    
          // Handle result for phrase analysis (returns different format)
          let analysisData;
          if (type === 'phrase') {
            // phraseAnalysis.analyzePhrase returns PhraseAnalysis directly
            analysisData = phraseAnalysis.data;
          } else {
            // Other mutations return { data: AnalysisResult }
            analysisData = (result as any).data;
          }
          
          setAnalysisResult(analysisData as any);
          setAnalysisPanelOpen(true);
    
          // Add to history using store directly
          const { addToHistory } = useAnalysisStore.getState();
          addToHistory({
            id: `${type}-${Date.now()}`,
            type,
            input: text,
            result: analysisData,
            timestamp: Date.now()
          });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Phân tích thất bại';
      setErrorState(errorMessage);
      throw err;
    } finally {
      setIsAnalyzingState(false);
    }
  }, [wordAnalysisMutation, sentenceAnalysisMutation, paragraphAnalysisMutation, phraseAnalysis, sessionId]);

  const handleTabChange = useCallback((tab: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    setActiveTabState(tab);
  }, []);

  const handleRewriteApply = useCallback((text: string) => {
    console.log('Applied rewrite:', text);
    // TODO: Cập nhật editor với text mới
  }, []);

  const handleFeedbackApply = useCallback((text: string) => {
    console.log('Applied feedback:', text);
    // TODO: Cập nhật editor với text mới
  }, []);

  const handleClearAll = useCallback(() => {
    clearAll();
    setSelectedTextState('');
    setActiveTabState('word');
    setAnalysisTypeState('word');
    setAnalysisResult(null);
    setErrorState(null);
    setAnalysisPanelOpen(false);
  }, [clearAll]);

  // Computed values
  const recentHistory = useMemo(() => getRecentHistory(5), [getRecentHistory]);

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word'
    ? wordAnalysisMutation
    : analysisType === 'sentence'
      ? sentenceAnalysisMutation
      : paragraphAnalysisMutation;

  const currentLoading = isAnalyzing || currentMutation.isPending;

  return {
    // State
    activeTab,
    selectedText,
    analysisType,
    analysisResult,
    isAnalyzing,
    error,
    isDetailDialogOpen,
    analysisPanelOpen,
    
    // Sidebar state
    isAnalysisTypeOpen,
    isQuickActionsOpen,
    isHistoryOpen,
    
    // Store state
    storeSelectedText,
    storeSelectedType,
    storeActiveTab,
    storeIsAnalyzing,
    lastError,
    analysisHistory,
    
    // Computed values
    recentHistory,
    currentLoading,
    
    // Mutations
    wordAnalysisMutation,
    sentenceAnalysisMutation,
    paragraphAnalysisMutation,
    phraseAnalysis,
    
    // Actions
    setActiveTab: setActiveTabState,
    setAnalysisType: setAnalysisTypeState,
    setSelectedText: setSelectedTextState,
    setIsDetailDialogOpen,
    setAnalysisPanelOpen,
    setIsHistoryOpen,
    setIsAnalysisTypeOpen,
    setIsQuickActionsOpen,
    
    // Handlers
    handleTextSelect,
    handleAnalyze,
    handleTabChange,
    handleRewriteApply,
    handleFeedbackApply,
    handleClearAll,
  };
}

export default useAnalysisPageLogic;