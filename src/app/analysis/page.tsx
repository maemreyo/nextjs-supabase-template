'use client';

import { useState, useCallback, useEffect } from 'react';
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
  History,
  Settings,
  Loader2,
  AlertTriangle,
  Zap,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Components
import { ImprovedAnalysisEditor } from '@/components/analysis/ImprovedAnalysisEditor';
import { WordAnalysisDisplay } from '@/components/analysis/WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from '@/components/analysis/SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from '@/components/analysis/ParagraphAnalysisDisplay';
import AuthGuard from '@/components/auth/auth-guard';

// Hooks
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';

// Store
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

/**
 * Trang cải tiến cho AI Semantic Analysis Editor
 */
function ImprovedAnalysisPageContent() {
  // Local state
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar collapsible sections state
  const [isAnalysisTypeOpen, setIsAnalysisTypeOpen] = useState(true);
  const [isAnalysisResultsOpen, setIsAnalysisResultsOpen] = useState(true);
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
            paragraphContext: ''
          });
          break;
          
        case 'sentence':
          result = await sentenceAnalysisMutation.mutateAsync({
            sentence: text
          });
          break;
          
        case 'paragraph':
          result = await paragraphAnalysisMutation.mutateAsync({
            paragraph: text
          });
          break;
          
        default:
          throw new Error('Invalid analysis type');
      }
      
      setAnalysisResult(result);
      
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
  }, [clearAll]);

  const recentHistory = getRecentHistory(5);

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word' 
    ? wordAnalysisMutation 
    : analysisType === 'sentence' 
    ? sentenceAnalysisMutation 
    : paragraphAnalysisMutation;

  const currentLoading = isAnalyzing || currentMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">AI Semantic Analysis Editor</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Phân tích chi tiết từ, câu và đoạn văn bằng AI để hiểu sâu sắc thái ngữ nghĩa và cải thiện kỹ năng viết.
        </p>
      </div>

      {(error || lastError || currentMutation.error) && (
        <Alert className="mb-4 sm:mb-6 border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || lastError || (currentMutation.error instanceof Error ? currentMutation.error.message : 'Lỗi không xác định')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Editor - occupies 2/3 of space */}
        <div className="lg:col-span-2">
          <ImprovedAnalysisEditor
            onTextSelect={handleTextSelect}
            onAnalyze={handleAnalyze}
            className="h-full"
          />
        </div>

        {/* Sidebar - occupies 1/3 of space */}
        <div className="lg:col-span-1 space-y-3 lg:space-y-4">
          {/* Analysis Type Selector */}
          <Card className="p-3 sm:p-4 sticky top-6">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setIsAnalysisTypeOpen(!isAnalysisTypeOpen)}
            >
              <h3 className="font-semibold text-foreground">Loại phân tích</h3>
              <div className="flex items-center gap-2">
                {selectedText && (
                  <Badge variant="outline" className="text-xs">
                    {selectedText.length} ký tự
                  </Badge>
                )}
                {isAnalysisTypeOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
            
            {isAnalysisTypeOpen && (
              <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="word" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Từ
                  </TabsTrigger>
                  
                  <TabsTrigger value="sentence" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Câu
                  </TabsTrigger>
                  
                  <TabsTrigger value="paragraph" className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    Đoạn
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </Card>

          {/* Analysis Results */}
          {selectedText && (
            <Card className="p-3 sm:p-4">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsAnalysisResultsOpen(!isAnalysisResultsOpen)}
              >
                <h3 className="font-semibold text-foreground">Kết quả phân tích</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activeTab === 'word' ? 'Từ' : activeTab === 'sentence' ? 'Câu' : 'Đoạn'}
                  </Badge>
                  {isAnalysisResultsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {isAnalysisResultsOpen && (
                <>
                  {currentLoading && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Đang phân tích...</span>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  )}

                  {analysisResult && !currentLoading && !error && (
                    <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Phân tích hoàn tất</span>
                      </div>
                      
                      {activeTab === 'word' && (
                        <WordAnalysisDisplay
                          analysis={analysisResult as WordAnalysis}
                          onSynonymClick={(word) => console.log('Synonym clicked:', word)}
                          onAntonymClick={(word) => console.log('Antonym clicked:', word)}
                        />
                      )}
                      
                      {activeTab === 'sentence' && (
                        <SentenceAnalysisDisplay
                          analysis={analysisResult as SentenceAnalysis}
                          onRewriteApply={handleRewriteApply}
                        />
                      )}
                      
                      {activeTab === 'paragraph' && (
                        <ParagraphAnalysisDisplay
                          analysis={analysisResult as ParagraphAnalysis}
                          onFeedbackApply={handleFeedbackApply}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-3 sm:p-4">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            >
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Zap className="h-4 w-4" />
                Thao tác nhanh
              </h3>
              {isQuickActionsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            
            {isQuickActionsOpen && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedText('');
                    setAnalysisResult(null);
                    setError(null);
                  }}
                  className="w-full justify-start"
                >
                  Xóa lựa chọn
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full justify-start"
                >
                  Xóa tất cả
                </Button>
              </div>
            )}
          </Card>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <Card className="p-3 sm:p-4">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Lịch sử phân tích
                </h3>
                {isHistoryOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
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
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'word' ? 'Từ' : item.type === 'sentence' ? 'Câu' : 'Đoạn'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString('vi-VN')}
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
        </div>
      </div>
    </div>
  );
}

/**
 * Trang cải tiến cho AI Semantic Analysis Editor với authentication guard
 */
export default function ImprovedAnalysisPage() {
  return (
    <AuthGuard redirectTo="/auth/signin">
      <ImprovedAnalysisPageContent />
    </AuthGuard>
  );
}