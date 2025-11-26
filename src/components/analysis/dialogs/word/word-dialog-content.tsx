import React, { useEffect } from 'react';
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
  const loading = state.dialogState.loading;

  // Clear loading state when data is available
  useEffect(() => {
    try {
      if (analysis && loading) {
        actions.setLoading(false);
      }
    } catch (error) {
      console.error('Error clearing loading state in WordDialogContent:', error);
      // Fallback: try to clear loading state after a short delay
      setTimeout(() => {
        try {
          actions.setLoading(false);
        } catch (fallbackError) {
          console.error('Fallback error clearing loading state:', fallbackError);
        }
      }, 100);
    }
  }, [analysis, loading, actions]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Word Information */}
      <WordPrimaryInformationDisplayCard
        analysis={analysis}
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
              definition={analysis.definition}
              translation={analysis.translation}
              contextMeaning={analysis.contextMeaning}
              onCopy={onPronounce}
              compact={compact}
            />
          </TabsContent>

        <TabsContent value="examples" className="mt-4">
          <WordUsageExamplesSection
            examples={analysis.exampleSentence}
            exampleTranslation={analysis.exampleTranslation}
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
              {analysis.sentenceContext && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh câu:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">{analysis.sentenceContext}</p>
                  </div>
                </div>
              )}
              {analysis.paragraphContext && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">{analysis.paragraphContext}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          <WordSynonymsAntonymsRelatedTermsSection
            synonyms={[]}
            antonyms={[]}
            onWordClick={onAnalyzeRelatedWord}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default WordDialogContent;