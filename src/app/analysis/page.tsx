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
  ChevronUp,
  MousePointer,
  Trash2,
  RotateCcw,
  Eye
} from 'lucide-react';

// Components
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor';
import { AnalysisPanel } from '@/components/analysis/AnalysisPanel';
import { CompactResultCard } from '@/components/analysis/CompactResultCard';
import AnalysisErrorBoundary from '@/components/analysis/AnalysisErrorBoundary';
import AnalysisDebugPanel from '@/components/analysis/AnalysisDebugPanel';
import AuthGuard from '@/components/auth/auth-guard';

// Hooks
import { useWordAnalysisMutation } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysisMutation } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysisMutation } from '@/hooks/useParagraphAnalysis';

// Store
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import AnalysisResultDialog from '@/components/analysis/AnalysisResultDialog';

/**
 * Trang cải tiến cho AI Semantic Analysis Editor
 */
function ImprovedAnalysisPageContent() {
  console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - Component started');
  // Local state
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
  
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

  // Sync local state với store state
  useEffect(() => {
    console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - Sync effect triggered', {
      storeSelectedText,
      storeSelectedType,
      storeActiveTab
    });
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
    console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - handleAnalyze called', { text, type });
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

  const recentHistory = getRecentHistory(5);

  // Determine current mutation based on analysis type
  const currentMutation = analysisType === 'word' 
    ? wordAnalysisMutation 
    : analysisType === 'sentence' 
    ? sentenceAnalysisMutation 
    : paragraphAnalysisMutation;

  const currentLoading = isAnalyzing || currentMutation.isPending;

  console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - About to render', {
    selectedText,
    analysisType,
    activeTab,
    isAnalyzing,
    error,
    lastError,
    analysisResult,
    currentLoading,
    analysisPanelOpen
  });

  console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - About to render main container');
  return (
    <div
      className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 max-w-7xl h-[calc(100vh-2rem)] flex flex-col"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        minHeight: '100vh'
      }}
    >
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2">AI Semantic Analysis Editor</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Phân tích chi tiết từ, câu và đoạn văn bằng AI để hiểu sâu sắc thái ngữ nghĩa và cải thiện kỹ năng viết.
        </p>
      </div>

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
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          minHeight: '400px'
        }}
      >
        {/* Main Editor - occupies 2/3 of space */}
        <div
          className="lg:col-span-2 min-h-0"
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            minHeight: '300px'
          }}
        >
          {(() => {
            console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - Rendering AnalysisEditor');
            return null;
          })()}
          <AnalysisEditor
            onTextSelect={handleTextSelect}
            onAnalyze={handleAnalyze}
            className="h-full"
          />
        </div>

        {/* Sidebar - occupies 1/3 of space */}
        <div
          className="lg:col-span-1 space-y-3 lg:space-y-4 overflow-y-auto"
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
            minHeight: '300px'
          }}
        >
          {/* Analysis Type Selector */}
          <Card className="p-3 sm:p-4 sticky top-6" title="Chọn loại phân tích phù hợp với văn bản">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setIsAnalysisTypeOpen(!isAnalysisTypeOpen)}
              title={isAnalysisTypeOpen ? "Thu gọn" : "Mở rộng"}
            >
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Loại phân tích</span>
                <span className="sm:hidden">Phân tích</span>
              </h3>
              <div className="flex items-center gap-2">
                {selectedText && (
                  <Badge variant="outline" className="text-xs" title={`${selectedText.length} ký tự đã chọn`}>
                    <MousePointer className="h-3 w-3 mr-1" />
                    {selectedText.length}
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
                  <TabsTrigger value="word" className="flex items-center gap-2" title="Phân tích từ vựng">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Từ</span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="sentence" className="flex items-center gap-2" title="Phân tích câu">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Câu</span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="paragraph" className="flex items-center gap-2" title="Phân tích đoạn văn">
                    <FilePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Đoạn</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </Card>

          {/* Selected Text Display */}
          {selectedText && (
            <Card className="p-3 sm:p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">Văn bản đã chọn</h3>
                <Badge variant="outline" className="text-xs">{selectedText.length} ký tự</Badge>
              </div>
              
              <div className="bg-background p-2 rounded border-l-4 border-primary mb-3">
                <p className="text-xs italic text-foreground line-clamp-3">"{selectedText}"</p>
              </div>

              <div className="flex justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedText('');
                    setAnalysisResult(null);
                    setError(null);
                  }}
                  className="text-xs h-7 px-2"
                >
                  Xóa
                </Button>
                
                <Button
                  onClick={() => handleAnalyze(selectedText, activeTab)}
                  disabled={currentLoading}
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  {currentLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Phân tích
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

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

          {/* Quick Actions */}
          <Card className="p-3 sm:p-4" title="Các thao tác nhanh">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              title={isQuickActionsOpen ? "Thu gọn" : "Mở rộng"}
            >
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Thao tác nhanh</span>
                <span className="sm:hidden">Nhanh</span>
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
                  title="Xóa văn bản đã chọn"
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Xóa lựa chọn</span>
                  <span className="sm:hidden">Xóa chọn</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full justify-start"
                  title="Xóa tất cả dữ liệu"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Xóa tất cả</span>
                  <span className="sm:hidden">Xóa hết</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <Card className="p-3 sm:p-4" title="Lịch sử phân tích gần đây">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                title={isHistoryOpen ? "Thu gọn" : "Mở rộng"}
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" />
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

          {/* Analysis Panel */}
          {analysisPanelOpen && analysisResult && (
            <>
              {(() => {
                console.log('🔍 [DEBUG] ImprovedAnalysisPageContent - Rendering AnalysisPanel', {
                  analysisPanelOpen,
                  analysisResult,
                  analysisType: activeTab,
                  selectedText
                });
                return null;
              })()}
              <AnalysisPanel
                analysisPanelOpen={analysisPanelOpen}
                setAnalysisPanelOpen={setAnalysisPanelOpen}
                analysisResult={analysisResult}
                analysisType={activeTab}
                selectedText={selectedText}
              />
            </>
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
  console.log('🔍 [DEBUG] ImprovedAnalysisPage - Main page component started');
  return (
    <AuthGuard redirectTo="/auth/signin">
      <AnalysisErrorBoundary>
        <ImprovedAnalysisPageContent />
        <AnalysisDebugPanel />
      </AnalysisErrorBoundary>
    </AuthGuard>
  );
}