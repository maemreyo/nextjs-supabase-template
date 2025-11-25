'use client';

import React from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';

// Components
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor';
import AnalysisErrorBoundary from '@/components/analysis/AnalysisErrorBoundary';
import AuthGuard from '@/components/auth/auth-guard';
import AnalysisResultDialog from '@/components/analysis/AnalysisResultDialog';
import SavedAnalysesManager from '@/components/analysis/SavedAnalysesManager';
import { 
  AnalysisHeader, 
  AnalysisSidebar, 
  AnalysisErrorAlert 
} from '@/components/analysis';

// Hooks
import { useAnalysisPageLogic } from '@/hooks/useAnalysisPageLogic';
import { useSessionPageHandling } from '@/hooks/useSessionPageHandling';
import { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis, WordAnalysisDB } from '@/lib/ai/types';
import { createBreadcrumbItems } from '@/lib/navigation';
import { Breadcrumb, ResponsiveBreadcrumb, MobileBreadcrumb } from '@/components/ui/breadcrumb';

/**
 * Trang cải tiến cho AI Semantic Analysis Editor
 * Refactored để sử dụng custom hooks và components nhỏ hơn
 */
function ImprovedAnalysisPageContent() {
  // Session handling
  const {
    sessionId,
    session,
    analyses,
    isLoading: isSessionLoading,
    error: sessionError,
    getWordList,
    handleCreateNewSession,
    navigateToSessions,
  } = useSessionPageHandling();

  // Editor reference to pass to useAnalysisPageLogic
  const [editor, setEditor] = useState<Editor | null>(null);

  // Analysis page logic
  const {
    activeTab,
    selectedText,
    analysisType,
    analysisResult,
    isAnalyzing,
    error,
    isDetailDialogOpen,
    analysisPanelOpen,
    isHistoryOpen,
    storeSelectedText,
    storeSelectedType,
    storeActiveTab,
    storeIsAnalyzing,
    lastError,
    analysisHistory,
    recentHistory,
    currentLoading,
    wordAnalysisMutation,
    sentenceAnalysisMutation,
    paragraphAnalysisMutation,
    phraseAnalysisMutation,
    setActiveTab,
    setAnalysisType,
    setSelectedText,
    setIsDetailDialogOpen,
    setAnalysisPanelOpen,
    setIsHistoryOpen,
    setIsAnalysisTypeOpen,
    setIsQuickActionsOpen,
    setAnalysisResult,
    handleTextSelect,
    handleAnalyze,
    handleTabChange,
    handleRewriteApply,
    handleFeedbackApply,
    handleClearAll,
    handleWordFromSessionAnalyze,
  } = useAnalysisPageLogic({ sessionId: sessionId || undefined, editor });

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word'
    ? wordAnalysisMutation
    : analysisType === 'sentence'
      ? sentenceAnalysisMutation
      : paragraphAnalysisMutation;

  // Handle history item click
  const handleHistoryItemClick = (item: any) => {
    setSelectedText(item.input);
    setAnalysisType(item.type);
    setActiveTab(item.type);
    // Note: analysisResult will be set by the hook when needed
  };

const transformWordAnalysisDB = (dbData: WordAnalysisDB): WordAnalysis => {
  console.log('🔍 [DEBUG] transformWordAnalysisDB - Input:', dbData);
  
  const result: WordAnalysis = {
    meta: {
      word: dbData.word,
      ipa: dbData.ipa ?? '',
      pos: dbData.pos ?? '',
      cefr: dbData.cefr ?? '',
      tone: dbData.tone ?? '',
    },
    definitions: {
      root_meaning: dbData.root_meaning ?? '',
      context_meaning: dbData.context_meaning ?? '',
      vietnamese_translation: dbData.vietnamese_translation ?? '',
    },
    inference_strategy: {
      clues: dbData.inference_clues ?? '',
      reasoning: dbData.inference_reasoning ?? '',
    },
    relations: {
      // ✅ FIXED: Map synonyms from word_synonyms array
      synonyms: (dbData as any).word_synonyms?.map((syn: any) => ({
        word: syn.synonym_word,
        ipa: syn.ipa || '',
        meaning_en: syn.meaning_en || '',
        meaning_vi: syn.meaning_vi || ''
      })) || [],
      // ✅ FIXED: Map antonyms from word_antonyms array
      antonyms: (dbData as any).word_antonyms?.map((ant: any) => ({
        word: ant.antonym_word,
        ipa: ant.ipa || '',
        meaning_en: ant.meaning_en || '',
        meaning_vi: ant.meaning_vi || ''
      })) || [],
    },
    usage: {
      // ✅ FIXED: Map collocations from word_collocations array
      collocations: (dbData as any).word_collocations?.map((col: any) => ({
        phrase: col.phrase,
        meaning: col.meaning || '',
        usage_example: col.usage_example || '',
        frequency_level: col.frequency_level || 'common'
      })) || [],
      example_sentence: dbData.example_sentence ?? '',
      example_translation: dbData.example_translation ?? '',
    },
  };
  
  console.log('🔍 [DEBUG] transformWordAnalysisDB - Output:', result);
  console.log('🔍 [DEBUG] transformWordAnalysisDB - Mapped fields:', {
    synonymsCount: result.relations.synonyms.length,
    antonymsCount: result.relations.antonyms.length,
    collocationsCount: result.usage.collocations.length,
    hasSynonyms: !!(dbData as any).word_synonyms,
    hasAntonyms: !!(dbData as any).word_antonyms,
    hasCollocations: !!(dbData as any).word_collocations,
  });
  
  return result;
};
  // Handle word click in session
  const handleWordClick = (wordItem: any) => {
    console.log('🔍 [DEBUG] handleWordClick - Called with:', {
      wordItem,
      hasAnalysis: !!wordItem?.analysis,
      analysisType: typeof wordItem?.analysis
    });
    
    // ✅ FIXED: Added comprehensive null/undefined checks
    if (!wordItem) {
      console.error('🔍 [DEBUG] handleWordClick - wordItem is null or undefined');
      return;
    }
    
    if (!wordItem.analysis) {
      console.warn('🔍 [DEBUG] handleWordClick - No analysis data found in wordItem:', wordItem);
      // Optional: Show toast notification to user
      return;
    }
    
    // ✅ FIXED: Validate required fields before processing
    if (!wordItem.analysis.word) {
      console.error('🔍 [DEBUG] handleWordClick - Analysis missing required word field:', wordItem.analysis);
      return;
    }
    
    try {
      console.log('🔍 [DEBUG] handleWordClick - Raw analysis data:', wordItem.analysis);
      
      const analysis = transformWordAnalysisDB(wordItem.analysis);
      console.log('🔍 [DEBUG] handleWordClick - Transformed analysis:', analysis);
      
      // ✅ FIXED: Validate transformed data before setting state
      if (!analysis || !analysis.meta?.word) {
        console.error('🔍 [DEBUG] handleWordClick - Transform failed or invalid result:', analysis);
        return;
      }
      
      setAnalysisResult(analysis);
      setAnalysisType('word');
      setIsDetailDialogOpen(true);
      
      console.log('🔍 [DEBUG] handleWordClick - Dialog state set to open');
    } catch (error) {
      console.error('🔍 [DEBUG] handleWordClick - Error during processing:', error);
      // Optional: Show error toast to user
    }
  };

  // Handle word analyze from session
  const handleWordAnalyze = (wordItem: any) => {
    handleWordFromSessionAnalyze(wordItem.word, wordItem);
  };

  // Handle word removal from session
  const handleWordRemove = (wordId: string) => {
    // Handle word removal from session
    console.log('Word removed:', wordId);
  };

  return (
    <div
      className="w-full h-[calc(100vh-2rem)] flex flex-col px-4 py-4 sm:px-6 lg:px-8"
    >
      {/* Page Header */}
      <AnalysisHeader
        sessionId={sessionId}
        session={session}
        analysesCount={analyses.length}
        onCreateNewSession={handleCreateNewSession}
        onNavigateBack={navigateToSessions}
      />

      {/* Error Alert */}
      <AnalysisErrorAlert
        error={error}
        lastError={lastError}
        mutationError={currentMutation.error}
      />

      <div
        className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 lg:gap-6 min-h-0"
      >
        {/* Main Content - Editor or Saved Analyses */}
        <div
          className="min-h-0"
        >
          <AnalysisEditor
            onTextSelect={handleTextSelect}
            onAnalyze={handleAnalyze}
            onAnalysisComplete={(result) => {
              // Note: This will be handled by the hook
              console.log('Analysis complete:', result);
            }}
            isAnalyzing={isAnalyzing}
            className="h-full"
            sessionId={sessionId || undefined}
            onEditorReady={setEditor}
          />
        </div>

        {/* Sidebar */}
        <AnalysisSidebar
          selectedText={selectedText}
          analysisResult={analysisResult}
          activeTab={activeTab}
          isLoading={currentLoading}
          error={error}
          isDetailDialogOpen={isDetailDialogOpen}
          
          // History props
          recentHistory={recentHistory}
          isHistoryOpen={isHistoryOpen}
          onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
          onHistoryItemClick={handleHistoryItemClick}
          
          // Session props
          sessionId={sessionId}
          getWordList={getWordList}
          onWordClick={handleWordClick}
          onWordAnalyze={handleWordAnalyze}
          onWordRemove={handleWordRemove}
          
          // Dialog actions
          onViewDetails={() => setIsDetailDialogOpen(true)}
        />
      </div>

      {/* Analysis Result Dialog */}
      <AnalysisResultDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        analysis={analysisResult}
        analysisType={analysisType}
      />
    </div>
  );
}

/**
 * Trang cải tiến cho AI Semantic Analysis Editor với authentication guard
 */
export default function ImprovedAnalysisPage() {
  return (
    <AuthGuard redirectTo="/auth/signin">
      <AnalysisErrorBoundary>
        <ImprovedAnalysisPageContent />
      </AnalysisErrorBoundary>
    </AuthGuard>
  );
}