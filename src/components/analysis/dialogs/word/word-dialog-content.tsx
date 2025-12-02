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
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';
import { analysisLogger } from '@/services/logger';

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
    {
      enabled: !!analysis?.id,
      analysisType: 'word'
    }
  );
  
  // Debug logging
  analysisLogger.debug('Word dialog loading state', {
    id: analysis?.id,
    isLoading: isFetchingFullData,
    isError,
    error: fetchError?.message,
    hasFullData: !!fullAnalysisData,
    analysisType: fullAnalysisData?.analysis_type
  });

  // Merge summary data with full data, prioritizing full data
  const mergedAnalysis = React.useMemo(() => {
    if (!analysis) return null;
    
    // Check if we have highlight_analysis data (type any to bypass TypeScript checking)
    const analysisAny = analysis as any;
    const fullAnalysisDataAny = fullAnalysisData as any;
    const hasHighlightAnalysis = analysisAny.highlight_analysis || fullAnalysisDataAny?.highlight_analysis;
    
    // Log dialog data for debugging
    analysisLogger.debug('Word dialog data', {
      hasAnalysis: !!analysis,
      hasFullData: !!fullAnalysisData,
      hasHighlightAnalysis: !!hasHighlightAnalysis,
      analysisType: fullAnalysisDataAny?.analysis_type || analysisAny.analysis_type
    });
    
    // If we have highlight_analysis, use it as the primary source
    if (hasHighlightAnalysis) {
      const highlightData = analysisAny.highlight_analysis || fullAnalysisDataAny?.highlight_analysis;
      
      analysisLogger.debug('Word dialog using highlight_analysis', {
        hasHighlightData: !!highlightData,
        keys: highlightData ? Object.keys(highlightData) : []
      });
      
      // Extract data from highlight_analysis structure
      const wordFromHighlight = highlightData?.word || analysisAny.word || analysisAny.selected_text;
      const definition = highlightData?.definitions?.[0] || highlightData?.definition || analysisAny.definition;
      const translation = highlightData?.vietnamese_translation || analysisAny.vietnamese_translation || analysisAny.translation;
      const contextMeaning = highlightData?.context_meaning || analysisAny.contextMeaning;
      const exampleSentence = highlightData?.examples?.[0] || analysisAny.exampleSentence;
      const exampleTranslation = highlightData?.example_translations?.[0] || analysisAny.exampleTranslation;
      const ipa = highlightData?.ipa || analysisAny.ipa;
      const pos = highlightData?.pos || highlightData?.part_of_speech || analysisAny.pos;
      const cefr = highlightData?.cefr || analysisAny.cefr;
      
      // Extract related terms
      const synonyms = highlightData?.synonyms ||
                     highlightData?.relations?.synonyms ||
                     fullAnalysisDataAny?.word_synonyms?.map((s: any) => s.synonym_word) ||
                     analysisAny.synonyms || [];
      
      const antonyms = highlightData?.antonyms ||
                     highlightData?.relations?.antonyms ||
                     fullAnalysisDataAny?.word_antonyms?.map((a: any) => a.antonym_word) ||
                     analysisAny.antonyms || [];
      
      const collocations = highlightData?.collocations ||
                         highlightData?.relations?.collocations ||
                         fullAnalysisDataAny?.word_collocations?.map((c: any) => ({
                           phrase: c.collocation_phrase,
                           meaning: c.meaning,
                           frequency_level: c.frequency_level
                         })) ||
                         analysisAny.collocations || [];
      
      const wordAnalysisFromHighlight = {
        ...analysis,
        // Override with highlight_analysis data
        word: wordFromHighlight,
        definition,
        translation,
        contextMeaning,
        exampleSentence,
        exampleTranslation,
        ipa,
        pos,
        cefr,
        synonyms,
        antonyms,
        collocations,
        // Store the original highlight_analysis for reference
        highlight_analysis: highlightData
      };
      
      analysisLogger.debug('Word dialog merged from highlight_analysis', {
        originalData: Object.keys(analysis),
        highlightDataKeys: highlightData ? Object.keys(highlightData) : [],
        mergedKeys: Object.keys(wordAnalysisFromHighlight)
      });
      
      return wordAnalysisFromHighlight;
    }
    
    // If we have full data, merge it with summary data
    if (fullAnalysisDataAny && fullAnalysisDataAny.analysis_type === 'word') {
      // Transform full data to match WordAnalysis interface
      const fullWordAnalysis = {
        ...analysis,
        // Override with full data fields
        ...fullAnalysisDataAny,
        // Map related data from nested structure
        synonyms: fullAnalysisDataAny.word_synonyms?.map((s: any) => s.synonym_word) || [],
        antonyms: fullAnalysisDataAny.word_antonyms?.map((a: any) => a.antonym_word) || [],
        collocations: fullAnalysisDataAny.word_collocations?.map((c: any) => ({
          phrase: c.collocation_phrase,
          meaning: c.meaning,
          frequency_level: c.frequency_level
        })) || [],
      };
      
      analysisLogger.debug('Word dialog merged data', {
        originalData: Object.keys(analysis),
        fullDataKeys: Object.keys(fullAnalysisDataAny),
        mergedKeys: Object.keys(fullWordAnalysis),
        analysisType: fullAnalysisDataAny.analysis_type
      });
      
      return fullWordAnalysis;
    }
    
    // Fallback to summary data if full data is not available
    analysisLogger.debug('Word dialog using fallback data', {
      hasAnalysis: !!analysis,
      keys: analysis ? Object.keys(analysis) : []
    });
    
    return analysis;
  }, [analysis, fullAnalysisData]);
  
  // Debug logging for merged analysis
  React.useEffect(() => {
    analysisLogger.debug('Word dialog state', {
      hasAnalysis: !!analysis,
      hasFullData: !!fullAnalysisData,
      hasMergedData: !!mergedAnalysis,
      isLoading: isFetchingFullData,
      analysisType: fullAnalysisData?.analysis_type
    });
  }, [analysis, fullAnalysisData, mergedAnalysis, isFetchingFullData, fullAnalysisData?.analysis_type]);

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
  }, []);

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
            synonyms={mergedAnalysis?.synonyms || analysis?.synonyms || []}
            antonyms={mergedAnalysis?.antonyms || analysis?.antonyms || []}
            onWordClick={onAnalyzeRelatedWord}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default WordDialogContent;