import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Volume2, BookOpen, Copy, ChevronDown, ChevronUp, Languages, Lightbulb, Link, Book, MessageCircle } from 'lucide-react';
import { PhraseAnalysis } from '../../types/analysis-types';
import {
  PhraseDialogContentProps,
  PhraseInfoSectionProps,
  PhrasePronunciationSectionProps,
  PhraseMeaningSectionProps,
  PhraseExamplesSectionProps,
  PhraseRelatedWordsSectionProps,
  PhraseContextSectionProps,
  PhraseAdditionalInfoSectionProps
} from './phrase-dialog-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';
import { useSavedAnalysisDetail } from '@/hooks/useSavedAnalysisDetail';
import { analysisLogger } from '@/services/logger';
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';

// Import new modular components
import { PhrasePrimaryInformationDisplayCard } from './phrase-primary-information-display-card';
import { PhrasePronunciationAudioPlayer } from './phrase-pronunciation-audio-player';
import { PhraseContextualMeaningAnalysisSection } from './phrase-contextual-meaning-analysis-section';
import { PhraseUsageExamplesSection } from './phrase-usage-examples-section';
import { PhraseRelatedPhrasesSection } from './phrase-related-phrases-section';
import { PhraseGrammarPatternsSection } from './phrase-grammar-patterns-section';

/**
 * Main Phrase Dialog Content Component
 */
export const PhraseDialogContent: React.FC<PhraseDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedPhrase,
  showPronunciation = true,
  showContext = true,
  className,
}) => {
  const { state, actions } = useDialogState('phrase');
  const [isFetchingFullData, setIsFetchingFullData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch full analysis data using analysis.id
  const { analysis: fullAnalysisData, isLoading, isError, error } = useSavedAnalysisDetail(
    analysis?.id || null,
    {
      enabled: !!analysis?.id,
      analysisType: 'phrase'
    }
  );
  
  // Debug logging
  analysisLogger.debug('Phrase dialog loading state', {
    id: analysis?.id,
    isLoading,
    isError,
    error: error?.message,
    hasFullData: !!fullAnalysisData,
    analysisType: fullAnalysisData?.analysis_type
  });

  // Merge summary data with full data, prioritizing full data
  const mergedAnalysis = React.useMemo(() => {
    if (!analysis) return null;
    
    // If we have full data, merge it with summary data
    if (fullAnalysisData) {
      // Transform full data to match PhraseAnalysis interface
      const fullPhraseAnalysis = {
        ...analysis,
        // Override with full data fields
        ...fullAnalysisData,
        // Note: Phrase analysis doesn't have complex nested structures like word/sentence
        // So we can use the full data directly
      };
      
      analysisLogger.debug('Phrase dialog merged data', {
        originalData: Object.keys(analysis),
        fullDataKeys: Object.keys(fullAnalysisData),
        mergedKeys: Object.keys(fullPhraseAnalysis),
        analysisType: fullAnalysisData.analysis_type
      });
      
      return fullPhraseAnalysis;
    }
    
    // Fallback to summary data if full data is not available
    return analysis;
  }, [analysis, fullAnalysisData]);
  
  // Debug logging for merged analysis
  React.useEffect(() => {
    analysisLogger.debug('Phrase dialog state', {
      hasAnalysis: !!analysis,
      hasFullData: !!fullAnalysisData,
      hasMergedData: !!mergedAnalysis,
      isLoading,
      isFetchingFullData,
      analysisType: fullAnalysisData?.analysis_type
    });
  }, [analysis, fullAnalysisData, mergedAnalysis, isLoading, isFetchingFullData, fullAnalysisData?.analysis_type]);

  // Update loading states
  useEffect(() => {
    try {
      // Set loading when fetching full data
      if (isLoading) {
        setIsFetchingFullData(true);
        actions.setLoading(true);
      } else {
        setIsFetchingFullData(false);
        // Clear loading when not fetching and we have either analysis or merged data
        if (analysis || mergedAnalysis) {
          actions.setLoading(false);
        }
      }
    } catch (error) {
      setIsFetchingFullData(false);
      actions.setLoading(false);
    }
  }, [isLoading, actions, analysis, mergedAnalysis]);

  // Handle error state
  useEffect(() => {
    if (isError && error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch full analysis data');
      setIsFetchingFullData(false);
      // Don't clear loading - we still have summary data to show
    } else {
      setFetchError(null);
    }
  }, [isError, error]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    context: false,
    examples: true,
    related: false,
  });
  const [hoveredPhrase, setHoveredPhrase] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleCopy = useCallback(async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
    }
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis?.sentenceContext || analysis?.paragraphContext),
    hasExamples: !!(analysis?.usageExamples && analysis.usageExamples.length > 0),
    hasRelated: !!(analysis?.synonyms || analysis?.antonyms || analysis?.variations),
  }), [analysis]);

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
          <PhrasePrimaryInformationDisplayCard
            analysis={analysis}
            onPronounce={onPronounce}
            showPronunciation={showPronunciation}
          />
        )}
      </div>
    );
  }

  // Show loading state only when we don't have any data yet
  if (isFetchingFullData && !analysis && !mergedAnalysis) {
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

  return (
    <div className={cn('space-y-4', className)}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>

      {/* Loading indicator for full data fetch */}
      {isFetchingFullData && mergedAnalysis && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Đang tải dữ liệu đầy đủ...
        </div>
      )}

      {/* Main Phrase Information */}
      <PhrasePrimaryInformationDisplayCard
        analysis={mergedAnalysis || analysis}
        onPronounce={onPronounce}
        showPronunciation={showPronunciation}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="meaning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meaning">Nghĩa</TabsTrigger>
          <TabsTrigger value="examples">Ví dụ</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="related">Liên quan</TabsTrigger>
        </TabsList>

        <TabsContent value="meaning" className="space-y-4 mt-4 animate-fadeIn">
          <PhraseContextualMeaningAnalysisSection
            naturalTranslation={mergedAnalysis?.naturalTranslation || analysis?.naturalTranslation}
            literalMeaning={mergedAnalysis?.literalMeaning || analysis?.literalMeaning}
            contextualMeaning={mergedAnalysis?.contextualMeaning || analysis?.contextualMeaning}
            vietnameseTranslation={mergedAnalysis?.vietnameseTranslation || analysis?.vietnameseTranslation}
            culturalNotes={mergedAnalysis?.culturalNotes || analysis?.culturalNotes}
            stylisticNotes={mergedAnalysis?.stylisticNotes || analysis?.stylisticNotes}
            memoryAid={mergedAnalysis?.memoryAid || analysis?.memoryAid}
            onCopy={(text: string, type: string) => handleCopy(text, type)}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <PhraseUsageExamplesSection
            usageExamples={mergedAnalysis?.usageExamples || analysis?.usageExamples}
            usageTips={mergedAnalysis?.usageTips || analysis?.usageTips}
            onAnalyzeExample={(example: string | any) => onAnalyzeRelatedPhrase?.(typeof example === 'string' ? example : example.text)}
            onCopy={(text: string, type: string) => handleCopy(text, type)}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <Card className={cn('border-none shadow-sm')}>
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

        <TabsContent value="related" className="mt-4 animate-fadeIn">
          <div className="space-y-4">
            <PhraseRelatedPhrasesSection
              synonyms={mergedAnalysis?.synonyms || analysis?.synonyms}
              antonyms={mergedAnalysis?.antonyms || analysis?.antonyms}
              variations={mergedAnalysis?.variations || analysis?.variations}
              onPhraseClick={(phrase: string | any) => onAnalyzeRelatedPhrase?.(typeof phrase === 'string' ? phrase : phrase.text)}
              onCopy={(text: string, type: string) => handleCopy(text, type)}
            />
            
            <PhraseGrammarPatternsSection
              grammaticalPattern={mergedAnalysis?.grammaticalPattern || analysis?.grammaticalPattern}
              partOfSpeech={mergedAnalysis?.partOfSpeech || analysis?.partOfSpeech}
              phraseType={mergedAnalysis?.phraseType || analysis?.phraseType}
              complexityLevel={mergedAnalysis?.complexityLevel || analysis?.complexityLevel}
              frequencyLevel={mergedAnalysis?.frequencyLevel || analysis?.frequencyLevel}
              onCopy={(text: string, type: string) => handleCopy(text, type)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhraseDialogContent;