'use client';

import React, { Suspense, lazy, startTransition, useCallback, useEffect } from 'react';
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
  AnalysisErrorAlert,
  AnalysisSidebarSkeleton
} from '@/components/analysis';
import AnalysisDynamicIslandStatusBar from '@/components/analysis/AnalysisDynamicIslandStatusBar';

// Lazy load AnalysisSidebar
const LazyAnalysisSidebar = lazy(() => import('@/components/analysis/AnalysisSidebar'));

// Hooks
import { useAnalysisPageLogic } from '@/hooks/useAnalysisPageLogic';
import { useSessionPageHandling } from '@/hooks/useSessionPageHandling';
import { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';

// Dialog system
import { DialogDispatcher } from '@/components/analysis/dialogs/utils/dialog-dispatcher';

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
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  // Dynamic Island state
  const [dynamicIslandVisible, setDynamicIslandVisible] = useState(false);
  const [dynamicIslandResult, setDynamicIslandResult] = useState<{
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
  } | null>(null);
  const [dynamicIslandError, setDynamicIslandError] = useState<string | null>(null);
  const [dynamicIslandProgress, setDynamicIslandProgress] = useState(0);

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
  } = useAnalysisPageLogic({
    sessionId: sessionId || undefined,
    editor
  });

  // Update Dynamic Island when analysis state changes
  useEffect(() => {
    if (isAnalyzing) {
      // Show Dynamic Island when analysis starts
      setDynamicIslandVisible(true);
      setDynamicIslandError(null);
      setDynamicIslandProgress(0);
    } else if (analysisResult) {
      // Update Dynamic Island with analysis result
      setDynamicIslandResult({
        text: selectedText,
        type: analysisType,
        data: analysisResult
      });
      setDynamicIslandProgress(100);
    } else if (error) {
      // Show error in Dynamic Island
      setDynamicIslandError(error);
    }
  }, [isAnalyzing, analysisResult, error, selectedText, analysisType]);

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
  // Handle analysis click in session - unified handler for all analysis types
  const handleAnalysisClick = (analysisItem: any) => {
    console.log('🔍 [DEBUG] handleAnalysisClick - Called with:', {
      analysisItem,
      hasAnalysis: !!analysisItem?.analysis,
      analysisType: analysisItem?.analysisType || typeof analysisItem?.analysis
    });
    
    // ✅ FIXED: Added comprehensive null/undefined checks
    if (!analysisItem) {
      console.error('🔍 [DEBUG] handleAnalysisClick - analysisItem is null or undefined');
      return;
    }
    
    // ✅ FIXED: Ignore hasAnalysis check and use analysisType from analysisItem
    if (analysisItem.analysisType) {
      console.log(`🔍 [DEBUG] handleAnalysisClick - Using dialogDispatcher for ${analysisItem.analysisType} type`);
      
      // Create proper analysis item for dialog dispatcher based on type
      let dialogItem;
      
      switch (analysisItem.analysisType) {
        case 'word':
          dialogItem = {
            analysisType: 'word',
            id: analysisItem.id || analysisItem.word,
            analysisId: analysisItem.analysisId || analysisItem.id,
            sessionId: analysisItem.sessionId || sessionId,
            word: analysisItem.word,
            translation: analysisItem.translation,
            definition: analysisItem.definition,
            contextMeaning: analysisItem.contextMeaning,
            pos: analysisItem.pos,
            ipa: analysisItem.ipa,
            cefr: analysisItem.cefr,
            // Include any other relevant fields
            ...analysisItem
          };
          break;
          
        case 'phrase':
          dialogItem = {
            analysisType: 'phrase',
            id: analysisItem.id || analysisItem.phrase,
            analysisId: analysisItem.analysisId || analysisItem.id,
            sessionId: analysisItem.sessionId || sessionId,
            phrase: analysisItem.phrase,
            naturalTranslation: analysisItem.naturalTranslation,
            contextualMeaning: analysisItem.contextualMeaning,
            partOfSpeech: analysisItem.partOfSpeech,
            // Include any other relevant fields
            ...analysisItem
          };
          break;
          
        case 'sentence':
          dialogItem = {
            analysisType: 'sentence',
            id: analysisItem.id || analysisItem.sentence,
            analysisId: analysisItem.analysisId || analysisItem.id,
            sessionId: analysisItem.sessionId || sessionId,
            sentence: analysisItem.sentence,
            naturalTranslation: analysisItem.naturalTranslation,
            mainIdea: analysisItem.mainIdea,
            // Include any other relevant fields
            ...analysisItem
          };
          break;
          
        case 'paragraph':
          dialogItem = {
            analysisType: 'paragraph',
            id: analysisItem.id || analysisItem.paragraph,
            analysisId: analysisItem.analysisId || analysisItem.id,
            sessionId: analysisItem.sessionId || sessionId,
            paragraph: analysisItem.paragraph,
            mainTopic: analysisItem.mainTopic,
            // Include any other relevant fields
            ...analysisItem
          };
          break;
          
        default:
          console.warn('🔍 [DEBUG] handleAnalysisClick - Unknown analysis type:', analysisItem.analysisType);
          return;
      }
      
      // Use dialogDispatcher to open view details dialog
      DialogDispatcher.openViewDetails(dialogItem);
      return;
    }
    
    // Fallback to original logic for other cases
    if (!analysisItem.analysis) {
      console.warn('🔍 [DEBUG] handleAnalysisClick - No analysis data found in analysisItem:', analysisItem);
      // Optional: Show toast notification to user
      return;
    }
    
    // Try to determine type from analysis data and handle accordingly
    try {
      console.log('🔍 [DEBUG] handleAnalysisClick - Raw analysis data:', analysisItem.analysis);
      
      // Determine type from analysis data structure
      let detectedType = 'word'; // default
      if (analysisItem.analysis.word) {
        detectedType = 'word';
      } else if (analysisItem.analysis.phrase) {
        detectedType = 'phrase';
      } else if (analysisItem.analysis.sentence) {
        detectedType = 'sentence';
      } else if (analysisItem.analysis.paragraph) {
        detectedType = 'paragraph';
      }
      
      // Transform based on detected type
      let analysis;
      switch (detectedType) {
        case 'word':
          analysis = transformWordAnalysisDB(analysisItem.analysis);
          break;
        // Add other transformations as needed
        default:
          console.warn('🔍 [DEBUG] handleAnalysisClick - No transformation for type:', detectedType);
          return;
      }
      
      console.log('🔍 [DEBUG] handleAnalysisClick - Transformed analysis:', analysis);
      
      // ✅ FIXED: Validate transformed data before setting state
      if (!analysis) {
        console.error('🔍 [DEBUG] handleAnalysisClick - Transform failed or invalid result:', analysis);
        return;
      }
      
      setAnalysisResult(analysis);
      setAnalysisType(detectedType as any);
      setIsDetailDialogOpen(true);
      
      console.log('🔍 [DEBUG] handleAnalysisClick - Dialog state set to open');
    } catch (error) {
      console.error('🔍 [DEBUG] handleAnalysisClick - Error during processing:', error);
      // Optional: Show error toast to user
    }
  };

  // Handle word click in session - backward compatibility
  const handleWordClick = (wordItem: any) => {
    console.log('🔍 [DEBUG] handleWordClick - Delegating to handleAnalysisClick');
    handleAnalysisClick(wordItem);
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

  // Handle overlay visibility change from BubbleMenu
  const handleOverlayVisibilityChange = useCallback((isVisible: boolean) => {
    setOverlayVisible(isVisible);
  }, []);

  // Handle Dynamic Island close
  const handleDynamicIslandClose = useCallback(() => {
    setDynamicIslandVisible(false);
    setDynamicIslandError(null);
    setDynamicIslandProgress(0);
  }, []);

  // Handle view details from Dynamic Island
  const handleDynamicIslandViewDetails = useCallback(() => {
    // Open detail dialog when viewing from Dynamic Island
    if (dynamicIslandResult) {
      setAnalysisResult(dynamicIslandResult.data);
      setAnalysisType(dynamicIslandResult.type);
      setIsDetailDialogOpen(true);
    }
  }, [dynamicIslandResult, setAnalysisResult, setAnalysisType, setIsDetailDialogOpen]);

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
            onOverlayVisibilityChange={handleOverlayVisibilityChange}
          />
        </div>

        {/* Sidebar */}
        <Suspense fallback={<AnalysisSidebarSkeleton />}>
          <LazyAnalysisSidebar
            selectedText={selectedText}
            analysisResult={analysisResult}
            activeTab={activeTab}
            isLoading={currentLoading}
            error={error}
            isDetailDialogOpen={isDetailDialogOpen}
            hideResultCard={overlayVisible}
            
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
            onAnalysisClick={handleAnalysisClick}
            onAnalysisAnalyze={handleWordAnalyze}
            onAnalysisRemove={handleWordRemove}
            
            // Dialog actions
            onViewDetails={() => setIsDetailDialogOpen(true)}
          />
        </Suspense>
      </div>

      {/* Analysis Result Dialog */}
      <AnalysisResultDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        analysis={analysisResult}
        analysisType={analysisType}
      />

      {/* Dynamic Island Status Bar */}
      <AnalysisDynamicIslandStatusBar
        isVisible={dynamicIslandVisible}
        isAnalyzing={isAnalyzing}
        analysisResult={dynamicIslandResult}
        error={dynamicIslandError}
        onClose={handleDynamicIslandClose}
        onViewDetails={handleDynamicIslandViewDetails}
        progress={dynamicIslandProgress}
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