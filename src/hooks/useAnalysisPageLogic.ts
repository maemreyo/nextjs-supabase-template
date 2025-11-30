'use client';

import React from 'react';
import { useState, useCallback, useRef, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';
import { usePhraseAnalysisMutation } from '@/hooks/usePhraseAnalysis';
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis_store';
import { useSavedAnalysisByWord } from '@/hooks/useSavedAnalysis';
import { api } from '@/lib/api-client-client';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import type { SelectionInfo } from '@/hooks/useTipTapSelection';
import { analysisLogger } from '@/services/logger';

export interface UseAnalysisPageLogicProps {
  sessionId?: string;
  editor?: Editor | null;
}

export interface UseAnalysisPageLogicReturn {
  // State
  activeTab: 'word' | 'phrase' | 'sentence' | 'paragraph';
  selectedText: string;
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  analysisResult: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
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
    content: string;
    timestamp: Date;
  }>;
  
  // Computed values
  recentHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  currentLoading: boolean;
  
  // Mutations
  wordAnalysisMutation: any;
  sentenceAnalysisMutation: any;
  paragraphAnalysisMutation: any;
  phraseAnalysisMutation: any;
  
  // Actions
  setActiveTab: (tab: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  setAnalysisType: (type: 'word' | 'phrase' | 'sentence' | 'paragraph') => void;
  setSelectedText: (text: string) => void;
  setAnalysisPanelOpen: (open: boolean) => void;
  setIsHistoryOpen: (open: boolean) => void;
  setIsAnalysisTypeOpen: (open: boolean) => void;
  setIsQuickActionsOpen: (open: boolean) => void;
  
  // Handlers
  handleTextSelect: (selection: SelectionInfo) => void;
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
export function useAnalysisPageLogic({ sessionId, editor }: UseAnalysisPageLogicProps): UseAnalysisPageLogicReturn {
  // Local state
  const [activeTab, setActiveTabState] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedTextState] = useState('');
  const [sentenceContext, setSentenceContextState] = useState('');
  const [paragraphContext, setParagraphContextState] = useState('');
  const [analysisType, setAnalysisTypeState] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzingState] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
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
    isAnalyzing: storeIsAnalyzing,
    analysisError: lastError,
    analysisHistory,
    activeAnalysisType
  } = useAnalysisStore();

  const {
    // No getRecentHistory in new store, will use analysisHistory directly
  } = useAnalysisSelectors();

  const {
    clearAllAnalyses
  } = useAnalysisActions();

  // Mutations cho analysis
  const wordAnalysisMutation = useWordAnalysisMutation();
  const sentenceAnalysisMutation = useSentenceAnalysisMutation();
  const paragraphAnalysisMutation = useParagraphAnalysisMutation();
  const phraseAnalysisMutation = usePhraseAnalysisMutation({
    onSwitchToTab: (analysisType) => {
      setActiveTabState(analysisType);
      analysisLogger.info('Tab switched via phrase analysis callback', {
        analysisType,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Sync local state với store state
  const syncWithStore = useCallback(() => {
    if (activeAnalysisType) {
      setAnalysisTypeState(activeAnalysisType);
      setActiveTabState(activeAnalysisType);
    }
  }, [activeAnalysisType]);

  // Sync effect
  React.useEffect(() => {
    syncWithStore();
  }, [syncWithStore]);

  // Event handlers
  const handleTextSelect = useCallback((selection: SelectionInfo) => {
    setSelectedTextState(selection.text);
    setSentenceContextState(selection.sentenceContext);
    setParagraphContextState(selection.paragraphContext);
    setAnalysisTypeState(selection.type);
    setActiveTabState(selection.type);
    setErrorState(null);
  }, []);

  // Helper function to extract sentence context
  const extractSentenceContext = useCallback((text: string): string => {
    if (!editor) return '';
    
    try {
      const { state } = editor;
      const fullText = state.doc.textContent;
      const textIndex = fullText.indexOf(text);
      
      if (textIndex === -1) return '';
      
      const getChar = (pos: number): string => fullText[pos] ?? '';
      let start = textIndex;
      
      // Find sentence start backwards
      while (start > 0) {
        const prevChar = getChar(start - 1);
        if (/[.!?]/.test(prevChar)) {
          const nextChar = getChar(start);
          if (nextChar === ' ' || /[A-Z]/.test(nextChar)) {
            break;
          }
        }
        start--;
      }
      
      // Skip leading whitespace
      while (start < textIndex && /\s/.test(getChar(start))) {
        start++;
      }
      
      let end = textIndex + text.length;
      
      // Find sentence end forwards
      while (end < fullText.length) {
        const currChar = getChar(end);
        if (/[.!?]/.test(currChar)) {
          end++;
          // Skip trailing punctuation/spaces/quotes
          while (end < fullText.length && /[\s"')\]]/.test(getChar(end))) {
            end++;
          }
          break;
        }
        end++;
      }
      
      return state.doc.textBetween(start, end, ' ');
    } catch (error) {
      return '';
    }
  }, [editor]);

  // Helper function to extract paragraph context
  const extractParagraphContext = useCallback((text: string): string => {
    if (!editor) return '';
    
    try {
      const { state } = editor;
      const fullText = state.doc.textContent;
      const textIndex = fullText.indexOf(text);
      
      if (textIndex === -1) return '';
      
      const $from = state.doc.resolve(textIndex);
      const depth = $from.depth;
      const start = $from.start(depth);
      const end = $from.end(depth);
      
      return state.doc.textBetween(start, end, ' ');
    } catch (error) {
      return '';
    }
  }, [editor]);

  const handleAnalyze = useCallback(async (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    if (!text.trim()) return;

    // Extract context using helper functions
    const sentenceContext = extractSentenceContext(text);
    const paragraphContext = extractParagraphContext(text);


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
          const wordToAnalyze = text.trim();
          const sentenceCtx = sentenceContext || '';
          const paragraphCtx = paragraphContext || '';

          if (!wordToAnalyze) {
            throw new Error('Không tìm thấy từ để phân tích');
          }

          result = await wordAnalysisMutation.mutateAsync({
            word: wordToAnalyze,
            sentenceContext: sentenceCtx,
            paragraphContext: paragraphCtx,
            sessionId: sessionId || undefined
          });
          break;

        case 'phrase':
          if (!text.trim()) {
            throw new Error('Không tìm thấy cụm từ để phân tích');
          }

          result = await phraseAnalysisMutation.mutateAsync({
            phrase: text,
            sentenceContext: sentenceContext || '',
            paragraphContext: paragraphContext || '',
            sessionId: sessionId || undefined
          });
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

      // Handle result (all mutations now return consistent format)
      const analysisData = result;
      
      setAnalysisResult(analysisData as any);
      setAnalysisPanelOpen(true);

      // Add to history using store directly
      const { addToHistory } = useAnalysisStore.getState();
      addToHistory({
        id: `${type}-${Date.now()}`,
        type,
        content: text,
        timestamp: new Date()
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Phân tích thất bại';
      setErrorState(errorMessage);
      throw err;
    } finally {
      setIsAnalyzingState(false);
    }
  }, [wordAnalysisMutation, sentenceAnalysisMutation, paragraphAnalysisMutation, phraseAnalysisMutation, sessionId, extractSentenceContext, extractParagraphContext]);

  const handleTabChange = useCallback((tab: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    setActiveTabState(tab);
  }, []);

  const handleRewriteApply = useCallback((text: string) => {
    // TODO: Cập nhật editor với text mới
  }, []);

  const handleFeedbackApply = useCallback((text: string) => {
    // TODO: Cập nhật editor với text mới
  }, []);

  const handleClearAll = useCallback(() => {
    clearAllAnalyses();
    setSelectedTextState('');
    setActiveTabState('word');
    setAnalysisTypeState('word');
    setAnalysisResult(null);
    setErrorState(null);
    setAnalysisPanelOpen(false);
  }, [clearAllAnalyses]);

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
          setAnalysisPanelOpen(false);

          // Add to history
          const { addToHistory } = useAnalysisStore.getState();
          addToHistory({
            id: `word-${Date.now()}`,
            type: 'word',
            content: word,
            timestamp: new Date()
          });

          return;
        }
      } catch (error) {
        // Continue with API call if saved analysis check fails
      }
    }

    // Check if word analysis exists in history/store
    const { analysisHistory } = useAnalysisStore.getState();
    const existingAnalysis = analysisHistory.find(item =>
      item.type === 'word' && item.content.toLowerCase() === word.toLowerCase()
    );

    if (existingAnalysis) {
      // Note: New store structure doesn't include result in history
      // This functionality would need to be reimplemented
      // For now, we'll skip this check
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
      setAnalysisPanelOpen(false);

      // Add to history
      const { addToHistory } = useAnalysisStore.getState();
      addToHistory({
        id: `word-${Date.now()}`,
        type: 'word',
        content: word,
        timestamp: new Date()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Phân tích từ thất bại';
      setErrorState(errorMessage);
    } finally {
      setIsAnalyzingState(false);
    }
  }, [sessionId, wordAnalysisMutation]);

  // Computed values - new store doesn't have getRecentHistory
  const recentHistory = useMemo(() =>
    analysisHistory.slice(-5).map(item => ({
      id: item.id,
      type: item.type,
      input: item.content,
      result: {} as WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis, // Placeholder - should be populated from store
      timestamp: item.timestamp.getTime()
    }))
  , [analysisHistory]);

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
    analysisPanelOpen,
    
    // Sidebar state
    isAnalysisTypeOpen,
    isQuickActionsOpen,
    isHistoryOpen,
    
    // Store state
    storeSelectedText: '', // Not available in new store
    storeSelectedType: activeAnalysisType || 'word', // Use activeAnalysisType
    storeActiveTab: activeAnalysisType || 'word', // Use activeAnalysisType
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
    phraseAnalysisMutation,
    
    // Actions
    setActiveTab: setActiveTabState,
    setAnalysisType: setAnalysisTypeState,
    setSelectedText: setSelectedTextState,
    setAnalysisPanelOpen,
    setIsHistoryOpen,
    setIsAnalysisTypeOpen,
    setIsQuickActionsOpen,
    setAnalysisResult,
    
    // Handlers
    handleTextSelect: handleTextSelect as any,
    handleAnalyze: handleAnalyze as any,
    handleTabChange,
    handleRewriteApply,
    handleFeedbackApply,
    handleClearAll,
    handleWordFromSessionAnalyze,
  };
}

export default useAnalysisPageLogic;