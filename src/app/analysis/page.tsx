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

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';
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
    phraseAnalysis,
    setActiveTab,
    setAnalysisType,
    setSelectedText,
    setIsDetailDialogOpen,
    setAnalysisPanelOpen,
    setIsHistoryOpen,
    setIsAnalysisTypeOpen,
    setIsQuickActionsOpen,
    handleTextSelect,
    handleAnalyze,
    handleTabChange,
    handleRewriteApply,
    handleFeedbackApply,
    handleClearAll,
  } = useAnalysisPageLogic({ sessionId: sessionId || undefined });

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word'
    ? wordAnalysisMutation
    : analysisType === 'sentence'
      ? sentenceAnalysisMutation
      : paragraphAnalysisMutation;

  // Create breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!session) return createBreadcrumbItems('/analysis');
    return createBreadcrumbItems('/analysis', sessionId, session.title);
  }, [session, sessionId]);

  // Handle history item click
  const handleHistoryItemClick = (item: any) => {
    setSelectedText(item.input);
    setAnalysisType(item.type);
    setActiveTab(item.type);
    // Note: analysisResult will be set by the hook when needed
  };

  // Handle word click in session
  const handleWordClick = (wordItem: any) => {
    // Handle word click - could show detailed analysis
    console.log('Word clicked:', wordItem);
  };

  // Handle word removal from session
  const handleWordRemove = (wordId: string) => {
    // Handle word removal from session
    console.log('Word removed:', wordId);
  };

  return (
    <div
      className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 max-w-7xl h-[calc(100vh-2rem)] flex flex-col"
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
        className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-0"
      >
        {/* Main Content - Editor or Saved Analyses */}
        <div
          className="lg:col-span-2 min-h-0"
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
        analysisType={activeTab}
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