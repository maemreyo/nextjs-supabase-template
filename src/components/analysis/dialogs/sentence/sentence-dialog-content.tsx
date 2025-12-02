import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Copy,
  Info
} from 'lucide-react';
import { SentenceAnalysis } from '../../types/analysis-types';
import {
  SentenceDialogContentProps,
  SentenceContextSectionProps,
} from './sentence-dialog-types';
import { SentencePrimaryInformationDisplayCard } from './sentence-primary-information-display-card';
import { SentencePronunciationAudioPlayer } from './sentence-pronunciation-audio-player';
import { SentenceGrammarAnalysisSection } from './sentence-grammar-analysis-section';
import { SentenceMainIdeaBreakdownSection } from './sentence-main-idea-breakdown-section';
import { SentenceUsageExamplesSection } from './sentence-usage-examples-section';
import { SentenceRelatedSentencesSection } from './sentence-related-sentences-section';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';
import { useSavedAnalysisDetail } from '@/hooks/useSavedAnalysisDetail';
import { analysisLogger } from '@/services/logger';
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';

/**
 * Main Sentence Dialog Content Component
 */
export const SentenceDialogContent: React.FC<SentenceDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedSentence,
  onBreakdownClause,
  showPronunciation = true,
  showContext = true,
  compact = false,
  className,
}) => {
  const { state, actions } = useDialogState('sentence');
  const [isFetchingFullData, setIsFetchingFullData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch full analysis data using analysis.id
  const { analysis: fullAnalysisData, isLoading, isError, error } = useSavedAnalysisDetail(
    analysis?.id || null,
    {
      enabled: !!analysis?.id,
      analysisType: 'sentence'
    }
  );
  
  // Debug logging
  analysisLogger.debug('Sentence dialog loading state', {
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
    
    // Check if we have highlight_analysis data (type any to bypass TypeScript checking)
    const analysisAny = analysis as any;
    const fullAnalysisDataAny = fullAnalysisData as any;
    const hasHighlightAnalysis = analysisAny.highlight_analysis || fullAnalysisDataAny?.highlight_analysis;
    
    // Log dialog data for debugging
    analysisLogger.debug('Sentence dialog data', {
      hasAnalysis: !!analysis,
      hasFullData: !!fullAnalysisData,
      hasHighlightAnalysis: !!hasHighlightAnalysis,
      analysisType: fullAnalysisDataAny?.analysis_type || analysisAny.analysis_type
    });
    
    // If we have highlight_analysis, use it as the primary source
    if (hasHighlightAnalysis) {
      const highlightData = analysisAny.highlight_analysis || fullAnalysisDataAny?.highlight_analysis;
      
      analysisLogger.debug('Sentence dialog using highlight_analysis', {
        hasHighlightData: !!highlightData,
        keys: highlightData ? Object.keys(highlightData) : []
      });
      
      // Extract data from highlight_analysis structure
      const sentenceFromHighlight = highlightData?.sentence || analysisAny.sentence || analysisAny.selected_text;
      const naturalTranslation = highlightData?.meaning?.main_idea || analysisAny.naturalTranslation || analysisAny.translation;
      const literalTranslation = highlightData?.meaning?.main_idea || analysisAny.literalTranslation || analysisAny.translation;
      const mainIdea = highlightData?.meaning?.main_idea || analysisAny.mainIdea;
      const subject = highlightData?.structure?.subject || analysisAny.subject;
      const mainVerb = highlightData?.structure?.predicate || analysisAny.mainVerb;
      const object = highlightData?.structure?.object || analysisAny.object;
      const sentenceFunction = highlightData?.meta?.function || analysisAny.function;
      const sentenceType = highlightData?.meta?.type || analysisAny.sentenceType;
      const complexityLevel = highlightData?.meta?.complexity || analysisAny.complexityLevel;
      const sentiment = highlightData?.meaning?.sentiment || analysisAny.sentiment;
      const subtext = highlightData?.meaning?.subtext || analysisAny.subtext;
      
      // Extract clauses
      const clauses = highlightData?.structure?.clauses ||
                    highlightData?.clauses ||
                    fullAnalysisDataAny?.sentence_key_components?.map((c: any) => ({
                      phrase: c.phrase,
                      meaning: c.meaning,
                      type: c.type,
                      function: c.function
                    })) ||
                    analysisAny.clauses || [];
      
      // Extract rewrite suggestions
      const rewriteSuggestions = highlightData?.variations ||
                              highlightData?.style_analysis?.variations ||
                              fullAnalysisDataAny?.sentence_rewrite_suggestions?.map((r: any) => ({
                                style: r.style,
                                text: r.text
                              })) ||
                              analysisAny.rewriteSuggestions || [];
      
      const sentenceAnalysisFromHighlight = {
        ...analysis,
        // Override with highlight_analysis data
        sentence: sentenceFromHighlight,
        naturalTranslation,
        literalTranslation,
        mainIdea,
        subject,
        mainVerb,
        object,
        function,
        sentenceType,
        complexityLevel,
        sentiment,
        subtext,
        clauses,
        rewriteSuggestions,
        // Store the original highlight_analysis for reference
        highlight_analysis: highlightData
      };
      
      analysisLogger.debug('Sentence dialog merged from highlight_analysis', {
        originalData: Object.keys(analysis),
        highlightDataKeys: highlightData ? Object.keys(highlightData) : [],
        mergedKeys: Object.keys(sentenceAnalysisFromHighlight)
      });
      
      return sentenceAnalysisFromHighlight;
    }
    
    // If we have full data, merge it with summary data
    if (fullAnalysisDataAny) {
      // Transform full data to match SentenceAnalysis interface
      const fullSentenceAnalysis = {
        ...analysis,
        // Override with full data fields
        ...fullAnalysisDataAny,
        // Map related data from nested structure
        keyComponents: fullAnalysisDataAny.sentence_key_components || [],
        rewriteSuggestions: fullAnalysisDataAny.sentence_rewrite_suggestions || [],
      };
      
      analysisLogger.debug('Sentence dialog merged data', {
        originalData: Object.keys(analysis),
        fullDataKeys: Object.keys(fullAnalysisDataAny),
        mergedKeys: Object.keys(fullSentenceAnalysis),
        analysisType: fullAnalysisDataAny.analysis_type
      });
      
      return fullSentenceAnalysis;
    }
    
    // Fallback to summary data if full data is not available
    analysisLogger.debug('Sentence dialog using fallback data', {
      hasAnalysis: !!analysis,
      keys: analysis ? Object.keys(analysis) : []
    });
    
    return analysis;
  }, [analysis, fullAnalysisData]);
  
  // Debug logging for merged analysis
  React.useEffect(() => {
    analysisLogger.debug('Sentence dialog state', {
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
    structure: true,
    grammar: false,
    examples: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [hoveredClause, setHoveredClause] = useState<string | null>(null);

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

  const hasContent = useMemo(() => {
    const sanitized = sanitizeAnalysisForHandlers(analysis);
    return {
      hasContext: !!(analysis?.paragraphContext || analysis?.relationToPrevious),
      hasStructure: !!(analysis?.subject || analysis?.mainVerb || analysis?.object || analysis?.clauses),
      hasGrammar: !!(analysis?.function || analysis?.complexityLevel || analysis?.sentiment || analysis?.subtext),
      hasExamples: !!(analysis?.clauses && Object.keys(analysis.clauses).length > 0),
    };
  }, [analysis]);

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
          <div className="space-y-3">
            <SentencePrimaryInformationDisplayCard
              analysis={analysis}
              className="w-full"
            />
            {showPronunciation && (
              <div className="flex justify-end">
                <SentencePronunciationAudioPlayer
                  sentence={analysis.sentence}
                  onPronounce={onPronounce}
                />
              </div>
            )}
          </div>
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
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        .clause-highlight {
          transition: all 0.2s ease-in-out;
        }
        
        .clause-highlight:hover {
          background-color: hsl(var(--primary) / 0.1);
          border-radius: 4px;
          padding: 2px 4px;
          cursor: pointer;
        }
      `}</style>

      {/* Loading indicator for full data fetch */}
      {isFetchingFullData && mergedAnalysis && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Đang tải dữ liệu đầy đủ...
        </div>
      )}

      {/* Main Sentence Information */}
      <div className="space-y-3">
        <SentencePrimaryInformationDisplayCard
          analysis={mergedAnalysis || analysis}
          className="w-full"
        />
        {showPronunciation && (
          <div className="flex justify-end">
            <SentencePronunciationAudioPlayer
              sentence={mergedAnalysis?.sentence || (() => {
                const sanitized = sanitizeAnalysisForHandlers(analysis);
                const result = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis?.sentence || '';
                analysisLogger.debug('SentenceDialogContent: sentence value', {
                  mergedAnalysisSentence: mergedAnalysis?.sentence,
                  sanitized,
                  result,
                  resultType: typeof result
                });
                return result;
              })()}
              onPronounce={onPronounce}
            />
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="translation" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="translation">Bản dịch</TabsTrigger>
          <TabsTrigger value="structure">Cấu trúc</TabsTrigger>
          <TabsTrigger value="grammar">Ngữ pháp</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="examples">Ví dụ</TabsTrigger>
        </TabsList>

        <TabsContent value="translation" className="space-y-4 mt-4 animate-fadeIn">
          <SentenceMainIdeaBreakdownSection
            naturalTranslation={mergedAnalysis?.naturalTranslation || analysis?.naturalTranslation}
            literalTranslation={mergedAnalysis?.literalTranslation || analysis?.literalTranslation}
            mainIdea={mergedAnalysis?.mainIdea || analysis?.mainIdea}
            onCopy={(text) => handleCopy(text, 'translation')}
            copied={copiedSection === 'translation'}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4 animate-fadeIn">
          <SentenceRelatedSentencesSection
            subject={mergedAnalysis?.subject || analysis?.subject}
            mainVerb={mergedAnalysis?.mainVerb || analysis?.mainVerb}
            object={mergedAnalysis?.object || analysis?.object}
            clauses={mergedAnalysis?.clauses || analysis?.clauses}
            sentenceType={mergedAnalysis?.sentenceType || analysis?.sentenceType}
            onClauseClick={onBreakdownClause}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-4 animate-fadeIn">
          <SentenceGrammarAnalysisSection
            function={mergedAnalysis?.function || analysis?.function}
            complexityLevel={mergedAnalysis?.complexityLevel || analysis?.complexityLevel}
            sentiment={mergedAnalysis?.sentiment || analysis?.sentiment}
            subtext={mergedAnalysis?.subtext || analysis?.subtext}
            sentence={mergedAnalysis?.sentence || (() => {
              const sanitized = sanitizeAnalysisForHandlers(analysis);
              const result = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis?.sentence || '';
              analysisLogger.debug('SentenceDialogContent: grammar section sentence', {
                mergedAnalysisSentence: mergedAnalysis?.sentence,
                sanitized,
                result,
                resultType: typeof result
              });
              return result;
            })()}
            onAnalyzeGrammar={() => onAnalyzeRelatedSentence?.(mergedAnalysis?.sentence || (() => {
              const sanitized = sanitizeAnalysisForHandlers(analysis);
              const result = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis?.sentence || '';
              analysisLogger.debug('SentenceDialogContent: onAnalyzeGrammar sentence', {
                mergedAnalysisSentence: mergedAnalysis?.sentence,
                sanitized,
                result,
                resultType: typeof result
              });
              return result;
            })())}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <SentenceContextSection
            paragraphContext={mergedAnalysis?.paragraphContext || analysis?.paragraphContext}
            relationToPrevious={mergedAnalysis?.relationToPrevious || analysis?.relationToPrevious}
            onCopy={(text) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <SentenceUsageExamplesSection
            examples={(() => {
              const examples = mergedAnalysis?.keyComponents?.length > 0 ? mergedAnalysis.keyComponents : (analysis?.clauses ? Object.values(analysis.clauses) : []);
              
              // Debug logging to identify the issue
              analysisLogger.debug('SentenceDialogContent: examples data', {
                hasKeyComponents: !!(mergedAnalysis?.keyComponents?.length > 0),
                keyComponentsLength: mergedAnalysis?.keyComponents?.length,
                hasClauses: !!(analysis?.clauses),
                clausesType: typeof analysis?.clauses,
                clausesKeys: analysis?.clauses ? Object.keys(analysis.clauses) : [],
                examplesType: typeof examples,
                examplesLength: examples?.length,
                firstExample: examples?.[0],
                firstExampleType: typeof examples?.[0]
              });
              
              // Extract phrase from objects if needed
              if (examples && examples.length > 0 && typeof examples[0] === 'object') {
                const extractedExamples = examples.map((item: any) => {
                  if (item && typeof item === 'object' && 'phrase' in item) {
                    return item.phrase;
                  }
                  return item; // fallback to original
                });
                
                analysisLogger.debug('SentenceDialogContent: extracted examples', {
                  originalCount: examples.length,
                  extractedCount: extractedExamples.length,
                  samples: extractedExamples.slice(0, 2)
                });
                
                return extractedExamples;
              }
              
              return examples;
            })()}
            onAnalyzeExample={onAnalyzeRelatedSentence}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Context Section Component
 */
export const SentenceContextSection: React.FC<SentenceContextSectionProps> = ({
  paragraphContext,
  relationToPrevious,
  onCopy,
  copied,
  className,
}) => {
  const [showFullParagraph, setShowFullParagraph] = useState(false);

  if (!paragraphContext && !relationToPrevious) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Ngữ cảnh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relationToPrevious && (
          <div>
            <h4 className="font-medium text-sm mb-2">Liên kết với câu trước:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{relationToPrevious}</p>
            </div>
          </div>
        )}
        
        {paragraphContext && (
          <div>
            <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">
                {showFullParagraph
                  ? paragraphContext
                  : `${paragraphContext.substring(0, 200)}${paragraphContext.length > 200 ? '...' : ''}`
                }
              </p>
              {paragraphContext.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullParagraph(!showFullParagraph)}
                  className="mt-2 h-8 px-2"
                >
                  {showFullParagraph ? 'Thu gọn' : 'Xem thêm'}
                </Button>
              )}
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(paragraphContext)}
                  className="mt-2 h-8 px-2 ml-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceDialogContent;