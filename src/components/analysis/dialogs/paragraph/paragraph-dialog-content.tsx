import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Volume2,
  BookOpen,
  Copy,
  ChevronDown,
  ChevronUp,
  Languages,
  Lightbulb,
  Link,
  Book,
  MessageCircle,
  FileText,
  GitBranch,
  Brain,
  Eye,
  Mic,
  Settings,
  Info,
  Target,
  Hash,
  TrendingUp,
  Star,
  User,
  BarChart3,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { ParagraphAnalysis } from '../../types/analysis-types';
import {
  ParagraphDialogContentProps,
  ParagraphInfoSectionProps,
  MainTopicSectionProps,
  StructureAnalysisSectionProps,
  KeyPointsSectionProps,
  SummarySectionProps,
  ParagraphContextSectionProps,
  SentimentAnalysisSectionProps,
} from './paragraph-dialog-types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { Progress } from '../../../ui/progress';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';
import { useSavedAnalysisDetail } from '@/hooks/useSavedAnalysisDetail';
import { analysisLogger } from '@/services/logger';
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';

// Import new modular components
import { ParagraphPrimaryInformationDisplayCard } from './paragraph-primary-information-display-card';
import { ParagraphStructureAnalysisSection } from './paragraph-structure-analysis-section';
import { ParagraphSentimentAnalysisSection } from './paragraph-sentiment-analysis-section';
import { ParagraphSummarySection } from './paragraph-summary-section';
import { ParagraphKeyPointsExtractionSection } from './paragraph-key-points-extraction-section';
import { ParagraphContextSection } from './paragraph-context-section';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Main Paragraph Dialog Content Component
 */
export const ParagraphDialogContent: React.FC<ParagraphDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedParagraph,
  onBreakdownSentence,
  onAnalyzeKeywords,
  showPronunciation = true,
  showContext = true,
  compact = false,
  className,
}) => {
  const { state, actions } = useDialogState('paragraph');
  const [isFetchingFullData, setIsFetchingFullData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch full analysis data using analysis.id
  const { analysis: fullAnalysisData, isLoading, isError, error } = useSavedAnalysisDetail(
    analysis?.id || null,
    {
      enabled: !!analysis?.id,
      analysisType: 'paragraph'
    }
  );
  
  // Debug logging
  analysisLogger.debug('Paragraph dialog loading state', {
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
    analysisLogger.debug('Paragraph dialog data', {
      hasAnalysis: !!analysis,
      hasFullData: !!fullAnalysisData,
      hasHighlightAnalysis: !!hasHighlightAnalysis,
      analysisType: fullAnalysisDataAny?.analysis_type || analysisAny.analysis_type
    });
    
    // If we have highlight_analysis, use it as the primary source
    if (hasHighlightAnalysis) {
      const highlightData = analysisAny.highlight_analysis || fullAnalysisDataAny?.highlight_analysis;
      
      analysisLogger.debug('Paragraph dialog using highlight_analysis', {
        hasHighlightData: !!highlightData,
        keys: highlightData ? Object.keys(highlightData) : []
      });
      
      // Extract data from highlight_analysis structure
      const paragraphFromHighlight = highlightData?.paragraph || analysisAny.paragraph || analysisAny.selected_text;
      const mainTopic = highlightData?.content?.main_topic || analysisAny.mainTopic;
      const tone = highlightData?.meta?.tone || analysisAny.tone;
      const targetAudience = highlightData?.meta?.audience || analysisAny.targetAudience;
      const type = highlightData?.meta?.type || analysisAny.type;
      const vocabularyLevel = highlightData?.meta?.vocabulary_level || analysisAny.vocabularyLevel;
      const sentimentLabel = highlightData?.content?.sentiment?.label || analysisAny.sentimentLabel;
      const sentimentIntensity = highlightData?.content?.sentiment?.intensity || analysisAny.sentimentIntensity;
      const sentimentJustification = highlightData?.content?.sentiment?.justification || analysisAny.sentimentJustification;
      const flowScore = highlightData?.content?.cohesion?.flow_score || analysisAny.flowScore;
      const logicScore = highlightData?.content?.cohesion?.logic_score || analysisAny.logicScore;
      const sentenceVariety = highlightData?.content?.sentence_structure?.variety || analysisAny.sentenceVariety;
      const betterVersion = highlightData?.evaluation?.improvement_suggestions?.[0]?.suggestion || analysisAny.betterVersion;
      const gapAnalysis = highlightData?.evaluation?.improvement_suggestions?.[0]?.suggestion || analysisAny.gapAnalysis;
      const keywords = highlightData?.content?.keywords || analysisAny.keywords;
      const transitionWords = highlightData?.content?.transitions?.map((t: any) => t.words) || analysisAny.transitionWords;
      
      // Extract structure breakdown
      const structureBreakdown = highlightData?.structure?.sentences?.map((s: any) => ({
        analysis: s.analysis,
        role: s.role,
        sentence_index: s.sentence_index,
        snippet: s.snippet
      })) || highlightData?.structure_breakdown ||
                     fullAnalysisDataAny?.paragraph_structure_breakdown || [];
      
      // Extract constructive feedback
      const constructiveFeedback = highlightData?.evaluation?.improvement_suggestions?.slice(1).map((s: any) => ({
        issue_type: s.issue_type,
        description: s.description,
        suggestion: s.suggestion
      })) || highlightData?.constructive_feedback ||
                         fullAnalysisDataAny?.paragraph_constructive_feedback || [];
      
      const paragraphAnalysisFromHighlight = {
        ...analysis,
        // Override with highlight_analysis data
        paragraph: paragraphFromHighlight,
        mainTopic,
        tone,
        targetAudience,
        type,
        vocabularyLevel,
        sentimentLabel,
        sentimentIntensity,
        sentimentJustification,
        flowScore,
        logicScore,
        sentenceVariety,
        betterVersion,
        gapAnalysis,
        keywords,
        transitionWords,
        structureBreakdown,
        constructiveFeedback,
        // Store the original highlight_analysis for reference
        highlight_analysis: highlightData
      };
      
      analysisLogger.debug('Paragraph dialog merged from highlight_analysis', {
        originalData: Object.keys(analysis),
        highlightDataKeys: highlightData ? Object.keys(highlightData) : [],
        mergedKeys: Object.keys(paragraphAnalysisFromHighlight)
      });
      
      return paragraphAnalysisFromHighlight;
    }
    
    // If we have full data, merge it with summary data
    if (fullAnalysisDataAny) {
      // Transform full data to match ParagraphAnalysis interface
      const fullParagraphAnalysis = {
        ...analysis,
        // Override with full data fields
        ...fullAnalysisDataAny,
        // Map related data from nested structure
        structureBreakdown: fullAnalysisDataAny.paragraph_structure_breakdown || [],
        constructiveFeedback: fullAnalysisDataAny.paragraph_constructive_feedback || [],
      };
      
      analysisLogger.debug('Paragraph dialog merged data', {
        originalData: Object.keys(analysis),
        fullDataKeys: Object.keys(fullAnalysisDataAny),
        mergedKeys: Object.keys(fullParagraphAnalysis),
        analysisType: fullAnalysisDataAny.analysis_type
      });
      
      return fullParagraphAnalysis;
    }
    
    // Fallback to summary data if full data is not available
    analysisLogger.debug('Paragraph dialog using fallback data', {
      hasAnalysis: !!analysis,
      keys: analysis ? Object.keys(analysis) : []
    });
    
    return analysis;
  }, [analysis, fullAnalysisData]);
  
  // Debug logging for merged analysis
  React.useEffect(() => {
    analysisLogger.debug('Paragraph dialog state', {
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
    keypoints: false,
    summary: false,
    sentiment: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

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

  const handleKeywordSelect = useCallback((keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis?.paragraph),
    hasStructure: !!(analysis?.tone || analysis?.targetAudience || analysis?.type || analysis?.vocabularyLevel),
    hasKeyPoints: !!(analysis?.keywords && analysis.keywords.length > 0),
    hasSummary: !!(analysis?.betterVersion || analysis?.gapAnalysis),
    hasSentiment: !!(analysis?.sentimentLabel || analysis?.sentimentIntensity),
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
          <ParagraphPrimaryInformationDisplayCard
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
        
        .keyword-highlight {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        
        .keyword-highlight:hover {
          background-color: hsl(var(--primary) / 0.1);
          border-radius: 4px;
          padding: 2px 4px;
        }
        
        .keyword-highlight.selected {
          background-color: hsl(var(--primary) / 0.2);
          border-radius: 4px;
          padding: 2px 4px;
        }
        
        .sentence-highlight {
          transition: all 0.2s ease-in-out;
        }
        
        .sentence-highlight:hover {
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

      {/* Main Paragraph Information - Using new modular component */}
      <ParagraphPrimaryInformationDisplayCard
        analysis={mergedAnalysis || analysis}
        onPronounce={onPronounce}
        showPronunciation={showPronunciation}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="topic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="topic">Chủ đề</TabsTrigger>
          <TabsTrigger value="structure">Cấu trúc</TabsTrigger>
          <TabsTrigger value="keypoints">Điểm chính</TabsTrigger>
          <TabsTrigger value="summary">Tóm tắt</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="sentiment">Cảm xúc</TabsTrigger>
        </TabsList>

        <TabsContent value="topic" className="space-y-4 mt-4 animate-fadeIn">
          <MainTopicSection
            mainTopic={mergedAnalysis?.mainTopic || analysis?.mainTopic}
            keywords={mergedAnalysis?.keywords || analysis?.keywords}
            onAnalyzeKeywords={onAnalyzeKeywords}
            onCopy={(text) => handleCopy(text, 'topic')}
            copied={copiedSection === 'topic'}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4 animate-fadeIn">
          <ParagraphStructureAnalysisSection
            tone={mergedAnalysis?.tone || analysis?.tone}
            targetAudience={mergedAnalysis?.targetAudience || analysis?.targetAudience}
            type={mergedAnalysis?.type || analysis?.type}
            vocabularyLevel={mergedAnalysis?.vocabularyLevel || analysis?.vocabularyLevel}
            flowScore={mergedAnalysis?.flowScore || analysis?.flowScore}
            logicScore={mergedAnalysis?.logicScore || analysis?.logicScore}
            sentenceVariety={mergedAnalysis?.sentenceVariety || analysis?.sentenceVariety}
            onAnalyzeStructure={() => onAnalyzeRelatedParagraph?.(mergedAnalysis?.paragraph || analysis?.paragraph)}
            paragraph={mergedAnalysis?.paragraph || analysis?.paragraph}
          />
        </TabsContent>

        <TabsContent value="keypoints" className="mt-4 animate-fadeIn">
          <ParagraphKeyPointsExtractionSection
            keywords={mergedAnalysis?.keywords || analysis?.keywords}
            transitionWords={mergedAnalysis?.transitionWords || analysis?.transitionWords}
            onAnalyzeKeywords={onAnalyzeKeywords}
            onCopy={(text) => handleCopy(text, 'keypoints')}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-4 animate-fadeIn">
          <ParagraphSummarySection
            betterVersion={mergedAnalysis?.betterVersion || analysis?.betterVersion}
            gapAnalysis={mergedAnalysis?.gapAnalysis || analysis?.gapAnalysis}
            onSummarize={() => onAnalyzeRelatedParagraph?.(mergedAnalysis?.paragraph || analysis?.paragraph)}
            onCopy={(text) => handleCopy(text, 'summary')}
            paragraph={mergedAnalysis?.paragraph || analysis?.paragraph}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <ParagraphContextSection
            paragraphContext={mergedAnalysis?.paragraph || analysis?.paragraph}
            onAnalyzeRelatedParagraph={onAnalyzeRelatedParagraph}
            onCopy={(text) => handleCopy(text, 'context')}
          />
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4 animate-fadeIn">
          <ParagraphSentimentAnalysisSection
            sentimentLabel={mergedAnalysis?.sentimentLabel || analysis?.sentimentLabel}
            sentimentIntensity={mergedAnalysis?.sentimentIntensity || analysis?.sentimentIntensity}
            sentimentJustification={mergedAnalysis?.sentimentJustification || analysis?.sentimentJustification}
            onAnalyzeSentiment={() => onAnalyzeRelatedParagraph?.(mergedAnalysis?.paragraph || analysis?.paragraph)}
            paragraph={mergedAnalysis?.paragraph || analysis?.paragraph}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Main Topic Section Component
 * This component is kept for backward compatibility but could be refactored further
 */
export const MainTopicSection: React.FC<MainTopicSectionProps> = ({
  mainTopic,
  keywords = [],
  onAnalyzeKeywords,
  onCopy,
  copied,
  className,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const handleKeywordClick = useCallback((keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  }, []);

  const handleAnalyzeKeywords = useCallback(() => {
    if (selectedKeywords.length > 0) {
      onAnalyzeKeywords?.(selectedKeywords);
    }
  }, [selectedKeywords, onAnalyzeKeywords]);

  return (
    <div className={cn('border-none shadow-sm p-4 rounded-lg bg-card', className)} data-testid="main-topic-section">
      <div className="space-y-4">
        {mainTopic && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Chủ đề chính:
            </h4>
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm leading-relaxed">{mainTopic}</p>
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(mainTopic)}
                  className="mt-2 h-8 px-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {keywords.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Từ khóa:</h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                  className="cursor-pointer keyword-highlight"
                  onClick={() => handleKeywordClick(keyword)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {keyword}
                </Badge>
              ))}
            </div>
            {selectedKeywords.length > 0 && (
              <Button
                variant="outline"
                onClick={handleAnalyzeKeywords}
                className="mt-3"
              >
                <Search className="h-4 w-4 mr-2" />
                Phân tích từ khóa đã chọn ({selectedKeywords.length})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParagraphDialogContent;