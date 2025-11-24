'use client';

import React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  FileText,
  FilePlus,
  Clock,
  Settings,
  Loader2,
  AlertTriangle,
  Zap,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MousePointer,
  Trash2,
  RotateCcw,
  Eye,
  ArrowLeft,
  Plus,
} from 'lucide-react';

// Components
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor';
import { AnalysisPanel } from '@/components/analysis/AnalysisPanel';
import { CompactResultCard } from '@/components/analysis/CompactResultCard';
import AnalysisErrorBoundary from '@/components/analysis/AnalysisErrorBoundary';
import AnalysisDebugPanel from '@/components/analysis/AnalysisDebugPanel';
import AuthGuard from '@/components/auth/auth-guard';
import SessionWordList from '@/components/analysis/SessionWordList';
import { SessionActions } from '@/components/analysis';

// Hooks
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';
import { useSessionData } from '@/hooks/useSessionData';

// Store
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';
import { useSessionStore } from '@/stores/session-store';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import AnalysisResultDialog from '@/components/analysis/AnalysisResultDialog';
import SavedAnalysesManager from '@/components/analysis/SavedAnalysesManager';
import { useAppNavigation, createBreadcrumbItems, NavigationValidation } from '@/lib/navigation';
import { Breadcrumb, ResponsiveBreadcrumb, MobileBreadcrumb } from '@/components/ui/breadcrumb';

/**
 * Trang cải tiến cho AI Semantic Analysis Editor
 */
function ImprovedAnalysisPageContent() {
  // Get sessionId from URL parameters
  const searchParams = useSearchParams();
  
  // For Next.js 16, we need to handle searchParams carefully
  // Let's access sessionId directly from searchParams object
  let sessionId: string | null = null;
  try {
    // Try to get sessionId directly - this should work with both old and new Next.js
    sessionId = (searchParams as any)?.get?.('sessionId');
    
    // Validate sessionId if we got one
    if (sessionId && NavigationValidation.isValidSessionId(sessionId)) {
      // Valid sessionId
    } else {
      sessionId = null;
    }
  } catch (error) {
    console.error('[DEBUG] AnalysisPage - Error processing searchParams:', error);
    sessionId = null;
  }

  // Load session data
  const {
    session,
    analyses,
    isLoading: isSessionLoading,
    error: sessionError,
    getWordList
  } = useSessionData(sessionId || undefined, {
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Local state
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);

  // Ref to track the last analysis request at parent level
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
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
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();
  const { createSession } = useSessionStore();

  // Mutations cho analysis
  const wordAnalysisMutation = useWordAnalysisMutation();
  const sentenceAnalysisMutation = useSentenceAnalysisMutation();
  const paragraphAnalysisMutation = useParagraphAnalysisMutation();

  // Sync local state với store state
  useEffect(() => {
    if (storeSelectedText) {
      setSelectedText(storeSelectedText);
      setAnalysisType(storeSelectedType);
      setActiveTab(storeSelectedType);
    }
  }, [storeSelectedText, storeSelectedType, storeActiveTab]);

  // Event handlers
  const handleTextSelect = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    setSelectedText(text);
    setAnalysisType(type);
    setActiveTab(type);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
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

    setIsAnalyzing(true);
    setError(null);

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

      setAnalysisResult(result);
      setAnalysisPanelOpen(true);

      // Add to history using store directly
      const { addToHistory } = useAnalysisStore.getState();
      addToHistory({
        id: `${type}-${Date.now()}`,
        type,
        input: text,
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Phân tích thất bại';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [wordAnalysisMutation, sentenceAnalysisMutation, paragraphAnalysisMutation]);

  const handleTabChange = useCallback((tab: 'word' | 'sentence' | 'paragraph') => {
    setActiveTab(tab);
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
    setSelectedText('');
    setActiveTab('word');
    setAnalysisType('word');
    setAnalysisResult(null);
    setError(null);
    setAnalysisPanelOpen(false);
  }, [clearAll]);

  // Handle new session creation
  const handleCreateNewSession = useCallback(async () => {
    const title = `Session mới - ${new Date().toLocaleDateString('vi-VN')}`;
    const newSession = await createSession({
      title,
      session_type: 'mixed'
    });
    navigateToAnalysis(newSession.id);
  }, [createSession, navigateToAnalysis]);

  const recentHistory = getRecentHistory(5);

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word'
    ? wordAnalysisMutation
    : analysisType === 'sentence'
      ? sentenceAnalysisMutation
      : paragraphAnalysisMutation;

  const currentLoading = isAnalyzing || currentMutation.isPending;


  // Create breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!session) return createBreadcrumbItems('/analysis');
    return createBreadcrumbItems('/analysis', sessionId, session.title);
  }, [session, sessionId]);

  return (
    <div
      className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 max-w-7xl h-[calc(100vh-2rem)] flex flex-col"
    >
      {/* Page Header - Only show when not in session mode */}
      {!sessionId && (
        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2">AI Semantic Analysis Editor</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Phân tích chi tiết từ, câu và đoạn văn bằng AI để hiểu sâu sắc thái ngữ nghĩa và cải thiện kỹ năng viết.
          </p>
        </div>
      )}

      {/* Quick Navigation when in session mode */}
      {sessionId && (
        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <SessionActions
            session={session}
            analysesCount={analyses.length}
            onNavigateBack={() => navigateToSessions()}
            onCreateNewSession={handleCreateNewSession}
          />
        </div>
      )}

      {(error || lastError || currentMutation.error) && (
        <Alert className="mb-4 border-destructive/50 bg-destructive/10 text-destructive flex-shrink-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || lastError || (currentMutation.error instanceof Error ? currentMutation.error.message : 'Lỗi không xác định')}
          </AlertDescription>
        </Alert>
      )}

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
              setAnalysisResult(result.data);
              setAnalysisPanelOpen(true);
            }}
            isAnalyzing={isAnalyzing}
            className="h-full"
            sessionId={sessionId || undefined}
          />
        </div>

        {/* Sidebar - occupies 1/3 of space */}
        <div
          className="lg:col-span-1 space-y-3 lg:space-y-4 overflow-y-auto"
        >
          {/* Compact Analysis Results */}
          {selectedText && (
            <CompactResultCard
              analysis={analysisResult}
              analysisType={activeTab}
              isLoading={currentLoading}
              error={error}
              onViewDetails={() => setIsDetailDialogOpen(true)}
            />
          )}

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <Card className="p-3 sm:p-4" title="Lịch sử phân tích gần đây">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                title={isHistoryOpen ? "Thu gọn" : "Mở rộng"}
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Lịch sử phân tích</span>
                  <span className="sm:hidden">Lịch sử</span>
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs" title={`${recentHistory.length} mục`}>
                    {recentHistory.length}
                  </Badge>
                  {isHistoryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {isHistoryOpen && (
                <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                  {recentHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 border rounded cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedText(item.input);
                        setAnalysisType(item.type);
                        setActiveTab(item.type);
                        setAnalysisResult(item.result);
                      }}
                      title={`Phân tích lại: ${item.input.substring(0, 100)}${item.input.length > 100 ? '...' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'word' ? 'Từ' : item.type === 'sentence' ? 'Câu' : 'Đoạn'}
                        </Badge>
                        <span className="text-xs text-muted-foreground" title={new Date(item.timestamp).toLocaleString('vi-VN')}>
                          {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        "{item.input.substring(0, 50)}{item.input.length > 50 ? '...' : ''}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Session Word List */}
          {sessionId && (
            <SessionWordList
              words={getWordList()}
              onWordClick={(wordItem) => {
                // Handle word click - could show detailed analysis
                console.log('Word clicked:', wordItem);
              }}
              onWordRemove={(wordId) => {
                // Handle word removal from session
                console.log('Word removed:', wordId);
              }}
              className="mb-4"
            />
          )}

        </div>
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