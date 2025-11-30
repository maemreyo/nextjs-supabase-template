'use client';

import React, { Suspense, lazy, startTransition, useCallback, useEffect } from 'react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';

// Components
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor';
import AnalysisErrorBoundary from '@/components/analysis/AnalysisErrorBoundary';
import AuthGuard from '@/components/auth/auth-guard';
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
import { DialogRootRenderer } from '@/components/analysis/dialogs/common/dialog-root-renderer';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
import { isDirectStructure } from '@/components/analysis/types/analysis-types';
import { createBreadcrumbItems } from '@/lib/navigation';
import { Breadcrumb, ResponsiveBreadcrumb, MobileBreadcrumb } from '@/components/ui/breadcrumb';
import { analysisLogger } from '@/services/logger';
import { api } from '@/lib/api-client-client';

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
    setSelectedText(item.content);
    setAnalysisType(item.type);
    setActiveTab(item.type);
    // Note: analysisResult will be set by the hook when needed
  };

  // Function to fetch detailed analysis data for non-word types
  const fetchDetailedAnalysisData = async (
    analysisType: 'phrase' | 'sentence' | 'paragraph',
    analysisId: string
  ): Promise<PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis> => {
    try {
      analysisLogger.info('Fetching detailed analysis data', { analysisType, analysisId });
      
      // Use the new detail method with type parameter
      const response = await api.analyses.detail(analysisId, {
        params: { type: analysisType }
      });
      
      if (response.success && response.data) {
        analysisLogger.success('Successfully fetched detailed analysis data', { analysisType, analysisId });
        return response.data as PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
      } else {
        const errorMessage = response.error?.message || 'Failed to fetch analysis data';
        analysisLogger.error('Failed to fetch detailed analysis data', {
          analysisType,
          analysisId,
          error: errorMessage
        });
        throw new Error(errorMessage);
      }
    } catch (error) {
      analysisLogger.error('Error fetching detailed analysis data', {
        analysisType,
        analysisId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // Handle analysis click in session - unified handler for all analysis types
  const handleAnalysisClick = (analysisItem: any) => {
    // Use helper functions for structure detection
    const isDirect = isDirectStructure(analysisItem);
    
    analysisLogger.info('Opening analysis detail', {
      analysisType: analysisItem?.analysisType,
      analysisId: analysisItem?.analysisId,
      isDirect
    });
    
    // ✅ FIXED: Added comprehensive null/undefined checks
    if (!analysisItem) {
      analysisLogger.warn('Analysis item is null or undefined');
      return;
    }
    
    // ✅ FIXED: Use analysisType from analysisItem - primary data structure
    if (isDirect && analysisItem.analysisType) {
      const analysisType = analysisItem.analysisType;
      
      // Extract real ID from prefixed IDs for non-word types
      let realAnalysisId = analysisItem.analysisId;
      if (analysisType !== 'word' && typeof analysisItem.analysisId === 'string') {
        // Handle prefixed IDs like "phrase_123", "sentence_456", "paragraph_789"
        const idMatch = analysisItem.analysisId.match(/^(word|phrase|sentence|paragraph)_(.+)$/);
        if (idMatch && idMatch[2]) {
          realAnalysisId = idMatch[2]; // Extract the actual ID part
          analysisLogger.debug('Extracted real ID from prefixed ID', {
            originalId: analysisItem.analysisId,
            extractedId: realAnalysisId,
            analysisType
          });
        }
      }
      
      // Create proper analysis item for dialog dispatcher based on type
      let dialogItem: any;
      
      switch (analysisType) {
        case 'word':
          dialogItem = {
            ...analysisItem,
            word: analysisItem.word,
          };
          break;
          
        case 'phrase':
          dialogItem = {
            ...analysisItem,
            phrase: analysisItem.phrase,
          };
          break;
          
        case 'sentence':
          dialogItem = {
            ...analysisItem,
            sentence: analysisItem.sentence,
          };
          break;
          
        case 'paragraph':
          dialogItem = {
            ...analysisItem,
            paragraph: analysisItem.paragraph,
          };
          break;
          
        default:
          analysisLogger.warn('Unknown analysis type', { analysisType });
          return;
      }
      
      // Use dialogDispatcher to open view details dialog
      // For all types, use the real ID for API calls
      const tempDialogItem = {
        ...dialogItem,
        analysisId: realAnalysisId // Use the real ID for API call
      };
      
      // Open dialog with loading state
      DialogDispatcher.openViewDetails(tempDialogItem);
      
      // For non-word types, fetch detailed data in the background
      if (analysisType !== 'word') {
        fetchDetailedAnalysisData(analysisType, realAnalysisId)
          .then((detailedData: PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis) => {
            // Update dialog with complete data
            const completeDialogItem = {
              ...dialogItem,
              [analysisType]: detailedData
            };
            DialogDispatcher.openViewDetails(completeDialogItem);
            analysisLogger.success('Successfully fetched detailed analysis data', {
              analysisType,
              analysisId: realAnalysisId
            });
          })
          .catch((error: any) => {
            analysisLogger.error('Failed to fetch detailed analysis data', {
              analysisType,
              analysisId: realAnalysisId,
              error
            });
          });
      }
      
      return;
    }
    
    // Invalid data structure - neither direct nor legacy format
    analysisLogger.warn('handleAnalysisClick - Expected direct structure (word/phrase/sentence/paragraph)', {
      analysisItem: JSON.stringify(analysisItem)
    });
    // Optional: Show toast notification to user
    return;
  };

  // Handle word click in session - backward compatibility
  const handleWordClick = (wordItem: any) => {
    handleAnalysisClick(wordItem);
  };

  // Handle word analyze from session
  const handleWordAnalyze = (wordItem: any) => {
    handleWordFromSessionAnalyze(wordItem.word, wordItem);
  };

  // Handle word removal from session
  const handleWordRemove = (wordId: string) => {
    // Handle word removal from session
    
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
      const dynamicAnalysisItem: any = {
        id: `dynamic-${Date.now()}`,
        analysisId: `dynamic-${Date.now()}`,
        sessionId: sessionId || '',
        analysisType: dynamicIslandResult.type,
        [dynamicIslandResult.type]: dynamicIslandResult.data
      };
      DialogDispatcher.openViewDetails(dynamicAnalysisItem);
    }
  }, [dynamicIslandResult]);

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
            
            // Dialog actions - using new dialog system
            onViewDetails={() => {
              if (analysisResult) {
                const analysisItem: any = {
                  id: `sidebar-${Date.now()}`,
                  analysisId: `sidebar-${Date.now()}`,
                  sessionId: sessionId || '',
                  analysisType,
                  [analysisType]: analysisResult
                };
                DialogDispatcher.openViewDetails(analysisItem);
              }
            }}
          />
        </Suspense>
      </div>


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
      
      {/* Dialog Root Renderer - Renders all dialogs using portal */}
      <DialogRootRenderer />
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