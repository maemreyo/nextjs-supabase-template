import React, { useEffect, useCallback } from 'react';
import { WordAnalysis } from '../../types/analysis-types';
import { WordDialogContentProps } from './word-dialog-types';
import { WordPrimaryInformationDisplayCard } from './word-primary-information-display-card';
import { WordDefinitionAndContextMeaningList } from './word-definition-and-context-meaning-list';
import { WordUsageExamplesSection } from './word-usage-examples-section';
import { WordSynonymsAntonymsRelatedTermsSection } from './word-synonyms-antonyms-related-terms-section';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { DialogLoadingIndicator } from '../common/dialog-loading-indicator';
import { DialogErrorHandler } from '../common/dialog-error-handler';
import { useSavedAnalysisDetail } from '@/hooks/useSavedAnalysisDetail';

/**
 * Main Word Dialog Content Component
 */
export const WordDialogContent: React.FC<WordDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedWord,
  showPhonetic = true,
  showContext = true,
  compact = false,
  className,
}) => {
  const { state, actions } = useDialogState('word');
  
  // Sử dụng useDialogLoading hook thay thế multiple loading states
  const {
    isLoading,
    error,
    message,
    setGlobalLoading,
    setLocalLoading,
    setActionLoading,
    clearError,
    hasAnyLoading,
    primaryLoadingSource
  } = useDialogLoading('word');

  // Fetch full analysis data using analysis.id
  const { analysis: fullAnalysisData, isLoading: isFetchingFullData, isError, error: fetchError } = useSavedAnalysisDetail(
    analysis?.id || null,
    { enabled: !!analysis?.id }
  );

  // Merge summary data with full data, prioritizing full data
  const mergedAnalysis = React.useMemo(() => {
    if (!analysis) return null;
    
    // If we have full data, merge it with summary data
    if (fullAnalysisData && fullAnalysisData.analysis_type === 'word') {
      // Transform full data to match WordAnalysis interface
      const fullWordAnalysis = {
        ...analysis,
        // Override with full data fields
        ...fullAnalysisData,
        // Map related data from nested structure
        synonyms: fullAnalysisData.word_synonyms?.map((s: any) => s.synonym_word) || [],
        antonyms: fullAnalysisData.word_antonyms?.map((a: any) => a.antonym_word) || [],
        collocations: fullAnalysisData.word_collocations?.map((c: any) => ({
          phrase: c.collocation_phrase,
          meaning: c.meaning,
          frequency_level: c.frequency_level
        })) || [],
      };
      
      console.log('🔍 [DEBUG] WordDialogContent - Merged analysis data', {
        hasSummaryData: !!analysis,
        hasFullData: !!fullAnalysisData,
        hasSynonyms: fullWordAnalysis.synonyms.length > 0,
        hasAntonyms: fullWordAnalysis.antonyms.length > 0,
        hasCollocations: fullWordAnalysis.collocations.length > 0,
      });
      
      return fullWordAnalysis;
    }
    
    // Fallback to summary data if full data is not available
    return analysis;
  }, [analysis, fullAnalysisData]);

  // Quản lý loading state khi fetch full data - đơn giản hóa
  useEffect(() => {
    try {
      // Chỉ set local loading khi fetching full data
      if (isFetchingFullData) {
        setLocalLoading('fullData', true);
      } else {
        setLocalLoading('fullData', false);
      }
    } catch (error) {
      console.error('Error managing loading state in WordDialogContent:', error);
      setLocalLoading('fullData', false);
    }
  }, [isFetchingFullData, setLocalLoading]);

  // Quản lý global loading state - chỉ khi cần thiết
  useEffect(() => {
    // Chỉ clear global loading khi có merged data và không đang fetch
    if (mergedAnalysis && !isFetchingFullData && isLoading) {
      setGlobalLoading(false);
    }
  }, [mergedAnalysis, isFetchingFullData, isLoading, setGlobalLoading]);

  // Xử lý lỗi khi fetch data
  useEffect(() => {
    if (isError && fetchError) {
      console.error('🔍 [DEBUG] WordDialogContent - Error fetching full analysis data:', fetchError);
      // Sử dụng error handler từ hook thay vì local state
      // Không clear loading - vẫn có summary data để hiển thị
    }
  }, [isError, fetchError]);

  // Handler cho pronunciation action
  const handlePronounce = useCallback(async (word: string) => {
    setActionLoading('pronunciation', true);
    try {
      await onPronounce?.(word);
    } catch (error) {
      console.error('Error pronouncing word:', error);
      // Error sẽ được xử lý bởi DialogErrorHandler
    } finally {
      setActionLoading('pronunciation', false);
    }
  }, [onPronounce, setActionLoading]);

  // Handler cho retry khi có lỗi
  const handleRetry = useCallback(() => {
    clearError();
    // Trigger refetch bằng cách reset và fetch lại
    window.location.reload(); // Simple retry - có thể cải thiện sau
  }, [clearError]);

  // Show error state nếu có lỗi nghiêm trọng
  if (error && !mergedAnalysis && !analysis) {
    return (
      <div className={cn('space-y-4', className)}>
        <DialogErrorHandler
          error={error}
          onRetry={handleRetry}
          onDismiss={clearError}
        />
      </div>
    );
  }

  // Show loading state khi đang fetch full data và không có data nào
  if (isLoading && !mergedAnalysis && !analysis) {
    return (
      <div className={cn('space-y-4', className)}>
        <DialogLoadingIndicator
          type="global"
          message="Đang tải dữ liệu từ vựng..."
          overlay={false}
        />
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-lg"></div>
          <div className="h-10 bg-muted rounded-lg w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Main content với merged data
  return (
    <div className={cn('space-y-4', className)}>
      {/* Error handler chỉ hiển thị khi có lỗi */}
      {error && (
        <DialogErrorHandler
          error={error}
          onRetry={handleRetry}
          onDismiss={clearError}
        />
      )}

      {/* Loading indicator cho full data fetch */}
      {primaryLoadingSource === 'local' && (
        <DialogLoadingIndicator
          type="local"
          message="Đang tải dữ liệu đầy đủ..."
        />
      )}

      {/* Main Word Information */}
      <WordPrimaryInformationDisplayCard
        analysis={mergedAnalysis || analysis}
        onPronounce={handlePronounce}
        showPhonetic={showPhonetic}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="definition" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="definition">Định nghĩa</TabsTrigger>
          <TabsTrigger value="examples">Ví dụ</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="related">Liên quan</TabsTrigger>
        </TabsList>

        <TabsContent value="definition" className="space-y-4 mt-4">
            <WordDefinitionAndContextMeaningList
              definition={mergedAnalysis?.definition || analysis?.definition}
              translation={mergedAnalysis?.translation || analysis?.translation}
              contextMeaning={mergedAnalysis?.contextMeaning || analysis?.contextMeaning}
              onCopy={onPronounce}
              compact={compact}
            />
          </TabsContent>

        <TabsContent value="examples" className="mt-4">
          <WordUsageExamplesSection
            examples={mergedAnalysis?.exampleSentence || analysis?.exampleSentence}
            exampleTranslation={mergedAnalysis?.exampleTranslation || analysis?.exampleTranslation}
            onAnalyzeExample={onAnalyzeRelatedWord}
            compact={compact}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ngữ cảnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(mergedAnalysis?.sentenceContext || analysis?.sentenceContext) && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh câu:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {mergedAnalysis?.sentenceContext || analysis?.sentenceContext}
                    </p>
                  </div>
                </div>
              )}
              {(mergedAnalysis?.paragraphContext || analysis?.paragraphContext) && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {mergedAnalysis?.paragraphContext || analysis?.paragraphContext}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          <WordSynonymsAntonymsRelatedTermsSection
            synonyms={mergedAnalysis?.synonyms || []}
            antonyms={mergedAnalysis?.antonyms || []}
            onWordClick={onAnalyzeRelatedWord}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default WordDialogContent;