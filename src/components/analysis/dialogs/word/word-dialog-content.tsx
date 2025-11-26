import React, { useEffect, useState } from 'react';
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
  const [isFetchingFullData, setIsFetchingFullData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch full analysis data using analysis.id
  const { analysis: fullAnalysisData, isLoading, isError, error } = useSavedAnalysisDetail(
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

  // Update loading states
  useEffect(() => {
    try {
      // Set loading when fetching full data
      if (isLoading) {
        setIsFetchingFullData(true);
        actions.setLoading(true);
      } else {
        setIsFetchingFullData(false);
        // Clear loading when we have merged data
        if (mergedAnalysis) {
          actions.setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error managing loading state in WordDialogContent:', error);
      setIsFetchingFullData(false);
    }
  }, [isLoading, mergedAnalysis, actions]);

  // Handle error state
  useEffect(() => {
    if (isError && error) {
      console.error('🔍 [DEBUG] WordDialogContent - Error fetching full analysis data:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch full analysis data');
      setIsFetchingFullData(false);
      // Don't clear loading - we still have summary data to show
    } else {
      setFetchError(null);
    }
  }, [isError, error]);

  // Show error state if fetch failed
  if (fetchError && !mergedAnalysis) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive">
                Không thể tải dữ liệu đầy đủ. Hiển thị thông tin cơ bản.
              </p>
              <p className="text-xs text-muted-foreground">{fetchError}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Fallback to basic display */}
        {analysis && (
          <WordPrimaryInformationDisplayCard
            analysis={analysis}
            onPronounce={onPronounce}
            showPhonetic={showPhonetic}
          />
        )}
      </div>
    );
  }

  // Show loading state while fetching full data
  if (isFetchingFullData && !mergedAnalysis) {
    return (
      <div className={cn('space-y-4', className)}>
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

  // Main content with merged data
  return (
    <div className={cn('space-y-4', className)}>
      {/* Loading indicator for full data fetch */}
      {isFetchingFullData && mergedAnalysis && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Đang tải dữ liệu đầy đủ...
        </div>
      )}

      {/* Main Word Information */}
      <WordPrimaryInformationDisplayCard
        analysis={mergedAnalysis || analysis}
        onPronounce={onPronounce}
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