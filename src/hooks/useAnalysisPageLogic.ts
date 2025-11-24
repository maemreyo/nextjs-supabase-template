'use client';

import React from 'react';
import { useState, useCallback, useRef, useMemo } from 'react';
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';
import { usePhraseAnalysis } from '@/hooks/usePhraseAnalysis';
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';
import { useSavedAnalysisByWord } from '@/hooks/useSavedAnalysis';
import { api } from '@/lib/api-client-client';
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
  handleWordFromSessionAnalyze: (word: string, wordItem: any) => Promise<void>;
  setAnalysisResult: (result: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null) => void;
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

  // Handler for analyzing word from session
  const handleWordFromSessionAnalyze = useCallback(async (word: string, wordItem: any) => {
    if (!word.trim()) return;
    
    // Set analysis type to word
    setAnalysisTypeState('word');
    setActiveTabState('word');
    setSelectedTextState(word);

    // Extract context from wordItem
    const sentenceContext = wordItem.context || wordItem.sentence || '';
    const paragraphContext = wordItem.paragraphContext || '';

    // First, try to get saved analysis from database
    if (sessionId) {
      console.log('🔍 [DEBUG] handleWordFromSessionAnalyze - Checking for saved analysis', { word, sessionId });
      
      try {
        // Direct API call to check for saved analysis
        const queryParams = {
          type: 'word',
          session_id: sessionId,
          search: word,
          per_page: '1' // We only need the most recent one
        };

        const result = await api.analyses.list(queryParams);
        
        if (result.success && result.data?.analyses?.length > 0) {
          console.log('🔍 [DEBUG] handleWordFromSessionAnalyze - Found saved analysis', { word });
          
          // Transform database format to WordAnalysis format
          const dbAnalysis = result.data.analyses[0];
          const wordAnalysis: WordAnalysis = {
            meta: {
              word: dbAnalysis.word,
              ipa: dbAnalysis.ipa || '',
              pos: dbAnalysis.pos || '',
              cefr: dbAnalysis.cefr || '',
              tone: dbAnalysis.tone || '',
            },
            definitions: {
              root_meaning: dbAnalysis.root_meaning || '',
              context_meaning: dbAnalysis.context_meaning || '',
              vietnamese_translation: dbAnalysis.vietnamese_translation || '',
            },
            usage: {
              example_sentence: dbAnalysis.example_sentence || '',
              example_translation: dbAnalysis.example_translation || '',
              collocations: dbAnalysis.word_collocations?.map((col: any) => ({
                phrase: col.phrase,
                meaning: col.meaning || '',
                usage_example: col.usage_example || '',
                frequency_level: col.frequency_level || 'common'
              })) || [],
            },
            inference_strategy: dbAnalysis.inference_clues ? {
              clues: dbAnalysis.inference_clues,
              reasoning: dbAnalysis.inference_reasoning || '',
            } : {
              clues: '',
              reasoning: ''
            },
            relations: {
              synonyms: dbAnalysis.word_synonyms?.map((syn: any) => ({
                word: syn.synonym_word,
                ipa: syn.ipa || '',
                meaning_en: syn.meaning_en || '',
                meaning_vi: syn.meaning_vi || ''
              })) || [],
              antonyms: dbAnalysis.word_antonyms?.map((ant: any) => ({
                word: ant.antonym_word,
                ipa: ant.ipa || '',
                meaning_en: ant.meaning_en || '',
                meaning_vi: ant.meaning_vi || ''
              })) || [],
            }
          };
          
          // Use saved analysis
          setAnalysisResult(wordAnalysis);
          setIsDetailDialogOpen(true);
          setAnalysisPanelOpen(false);

          // Add to history
          const { addToHistory } = useAnalysisStore.getState();
          addToHistory({
            id: `word-${Date.now()}`,
            type: 'word',
            input: word,
            result: wordAnalysis,
            timestamp: Date.now()
          });

          return;
        }
      } catch (error) {
        console.error('🔍 [DEBUG] handleWordFromSessionAnalyze - Error checking saved analysis', error);
        // Continue with API call if saved analysis check fails
      }
    }

    // Check if word analysis exists in history/store
    const { analysisHistory } = useAnalysisStore.getState();
    const existingAnalysis = analysisHistory.find(item =>
      item.type === 'word' && item.input.toLowerCase() === word.toLowerCase()
    );

    if (existingAnalysis) {
      // Use cached analysis
      setAnalysisResult(existingAnalysis.result as WordAnalysis);
      setIsDetailDialogOpen(true);
      setAnalysisPanelOpen(false);
      return;
    }

    // Set loading state
    setIsAnalyzingState(true);
    setErrorState(null);

    try {
      // Call word analysis API with checkSavedFirst option
      const result = await wordAnalysisMutation.mutateAsync({
        word,
        sentenceContext,
        paragraphContext,
        sessionId: sessionId || undefined,
        checkSavedFirst: true,
        wordId: wordItem.id // Pass wordId if available
      });

      // Set analysis result and open dialog
      setAnalysisResult(result);
      setIsDetailDialogOpen(true);
      setAnalysisPanelOpen(false);

      // Add to history
      const { addToHistory } = useAnalysisStore.getState();
      addToHistory({
        id: `word-${Date.now()}`,
        type: 'word',
        input: word,
        result,
        timestamp: Date.now()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Phân tích từ thất bại';
      setErrorState(errorMessage);
      console.error('Word analysis error:', err);
    } finally {
      setIsAnalyzingState(false);
    }
  }, [sessionId, wordAnalysisMutation]);

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
    setAnalysisResult,
    
    // Handlers
    handleTextSelect,
    handleAnalyze,
    handleTabChange,
    handleRewriteApply,
    handleFeedbackApply,
    handleClearAll,
    handleWordFromSessionAnalyze,
  };
}

export default useAnalysisPageLogic;