'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  FileText,
  FilePlus,
  History,
  Settings,
  Loader2,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Components
import { AnalysisEditor } from '@/components/analysis/AnalysisEditor';
import { WordAnalysisDisplay } from '@/components/analysis/WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from '@/components/analysis/SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from '@/components/analysis/ParagraphAnalysisDisplay';
import AuthGuard from '@/components/auth/auth-guard';

// Hooks
import { useWordAnalysis } from '@/hooks/useWordAnalysis';
import { useSentenceAnalysis } from '@/hooks/useSentenceAnalysis';
import { useParagraphAnalysis } from '@/hooks/useParagraphAnalysis';

// Store
import { useAnalysisStore, useAnalysisSelectors, useAnalysisActions } from '@/stores/analysis-store';

// Types
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

/**
 * Trang chính cho AI Semantic Analysis Editor
 */
function AnalysisPageContent() {
  
  // Local state
  const [activeTab, setActiveTab] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');

  // Store state và actions
  const {
    selectedText: storeSelectedText,
    selectedType: storeSelectedType,
    activeTab: storeActiveTab,
    isAnalyzing,
    lastError,
    analysisHistory
  } = useAnalysisStore();

  const {
    getWordAnalysis,
    getSentenceAnalysis,
    getParagraphAnalysis,
    getRecentHistory
  } = useAnalysisSelectors();

  const {
    analyzeText,
    clearAll
  } = useAnalysisActions();

  const {
    setSelectedText: setStoreSelectedText,
    setSelectedType: setStoreSelectedType,
    setActiveTab: setStoreActiveTab,
    clearSelection
  } = useAnalysisStore();

  // Data fetching hooks
  const wordAnalysis = useWordAnalysis(
    selectedText,
    '', // sentence context - sẽ được cập nhật khi có text đầy đủ
    '', // paragraph context - sẽ được cập nhật khi có text đầy đủ
    {
      enabled: activeTab === 'word' && !!selectedText,
      staleTime: 1000 * 60 * 30 // 30 minutes
    }
  );

  const sentenceAnalysis = useSentenceAnalysis(
    selectedText,
    '', // paragraph context
    {
      enabled: activeTab === 'sentence' && !!selectedText,
      staleTime: 1000 * 60 * 30
    }
  );

  const paragraphAnalysis = useParagraphAnalysis(
    selectedText,
    {
      enabled: activeTab === 'paragraph' && !!selectedText,
      staleTime: 1000 * 60 * 30
    }
  );

  // Event handlers
  const handleTextSelect = useCallback((text: string, type: 'word' | 'sentence' | 'paragraph') => {
    setSelectedText(text);
    setAnalysisType(type);
    setActiveTab(type);
    setStoreSelectedText(text);
    setStoreSelectedType(type);
    setStoreActiveTab(type);
  }, []);

  const handleAnalyze = useCallback(async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
    // Sử dụng store action để phân tích
    // Đây là nơi để tích hợp với actual API calls
    console.log(`Analyzing ${type}:`, text);
  }, []);

  const handleTabChange = useCallback((tab: 'word' | 'sentence' | 'paragraph') => {
    setActiveTab(tab);
    setStoreActiveTab(tab);
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
  }, [clearAll]);

  const recentHistory = getRecentHistory(5);

  // Lấy data hiện tại dựa trên tab
  const currentAnalysis = activeTab === 'word' 
    ? wordAnalysis.data 
    : activeTab === 'sentence' 
    ? sentenceAnalysis.data 
    : paragraphAnalysis.data;

  const currentError = activeTab === 'word' 
    ? wordAnalysis.error 
    : activeTab === 'sentence' 
    ? sentenceAnalysis.error 
    : paragraphAnalysis.error;

  const currentLoading = activeTab === 'word' 
    ? wordAnalysis.isLoading 
    : activeTab === 'sentence' 
    ? sentenceAnalysis.isLoading 
    : paragraphAnalysis.isLoading;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Semantic Analysis Editor</h1>
        <p className="text-gray-600">
          Phân tích chi tiết từ, câu và đoạn văn bằng AI để hiểu sâu sắc thái ngữ nghĩa và cải thiện kỹ năng viết.
        </p>
      </div>

      {lastError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{lastError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <AnalysisEditor
            onTextSelect={handleTextSelect}
            onAnalyze={handleAnalyze}
            className="h-full"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Analysis Tabs */}
          <Card className="p-4">
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
          </Card>

          {/* Analysis Results */}
          {selectedText && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Kết quả phân tích</h3>
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'word' ? 'Từ' : activeTab === 'sentence' ? 'Câu' : 'Đoạn'}
                </Badge>
              </div>

              {currentLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Đang phân tích...</span>
                </div>
              )}

              {currentError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{currentError instanceof Error ? currentError.message : String(currentError)}</AlertDescription>
                </Alert>
              )}

              {currentAnalysis && !currentLoading && !currentError && (
                <div className="max-h-[600px] overflow-y-auto">
                  {activeTab === 'word' && (
                    <WordAnalysisDisplay
                      analysis={currentAnalysis as WordAnalysis}
                      onSynonymClick={(word) => console.log('Synonym clicked:', word)}
                      onAntonymClick={(word) => console.log('Antonym clicked:', word)}
                    />
                  )}
                  
                  {activeTab === 'sentence' && (
                    <SentenceAnalysisDisplay
                      analysis={currentAnalysis as SentenceAnalysis}
                      onRewriteApply={handleRewriteApply}
                    />
                  )}
                  
                  {activeTab === 'paragraph' && (
                    <ParagraphAnalysisDisplay
                      analysis={currentAnalysis as ParagraphAnalysis}
                      onFeedbackApply={handleFeedbackApply}
                    />
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Thao tác nhanh
            </h3>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
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
          </Card>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Lịch sử dụng gần đây
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedText(item.input);
                      setAnalysisType(item.type);
                      setActiveTab(item.type);
                      setStoreSelectedText(item.input);
                      setStoreSelectedType(item.type);
                      setStoreActiveTab(item.type);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'word' ? 'Từ' : item.type === 'sentence' ? 'Câu' : 'Đoạn'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">
                      "{item.input.substring(0, 50)}{item.input.length > 50 ? '...' : ''}"
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Trang chính cho AI Semantic Analysis Editor với authentication guard
 */
export default function AnalysisPage() {
  return (
    <AuthGuard redirectTo="/auth/signin">
      <AnalysisPageContent />
    </AuthGuard>
  );
}