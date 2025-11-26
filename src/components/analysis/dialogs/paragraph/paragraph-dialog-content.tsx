import React, { useState, useCallback, useMemo } from 'react';
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

// Import new modular components
import { ParagraphPrimaryInformationDisplayCard } from './paragraph-primary-information-display-card';
import { ParagraphStructureAnalysisSection } from './paragraph-structure-analysis-section';
import { ParagraphSentimentAnalysisSection } from './paragraph-sentiment-analysis-section';
import { ParagraphSummarySection } from './paragraph-summary-section';
import { ParagraphKeyPointsExtractionSection } from './paragraph-key-points-extraction-section';
import { ParagraphContextSection } from './paragraph-context-section';

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
      console.error('Failed to copy:', error);
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
    hasContext: !!(analysis.paragraph),
    hasStructure: !!(analysis.tone || analysis.targetAudience || analysis.type || analysis.vocabularyLevel),
    hasKeyPoints: !!(analysis.keywords && analysis.keywords.length > 0),
    hasSummary: !!(analysis.betterVersion || analysis.gapAnalysis),
    hasSentiment: !!(analysis.sentimentLabel || analysis.sentimentIntensity),
  }), [analysis]);

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

      {/* Main Paragraph Information - Using new modular component */}
      <ParagraphPrimaryInformationDisplayCard
        analysis={analysis}
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
            mainTopic={analysis.mainTopic}
            keywords={analysis.keywords}
            onAnalyzeKeywords={onAnalyzeKeywords}
            onCopy={(text) => handleCopy(text, 'topic')}
            copied={copiedSection === 'topic'}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4 animate-fadeIn">
          <ParagraphStructureAnalysisSection
            tone={analysis.tone}
            targetAudience={analysis.targetAudience}
            type={analysis.type}
            vocabularyLevel={analysis.vocabularyLevel}
            flowScore={analysis.flowScore}
            logicScore={analysis.logicScore}
            sentenceVariety={analysis.sentenceVariety}
            onAnalyzeStructure={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
            paragraph={analysis.paragraph}
          />
        </TabsContent>

        <TabsContent value="keypoints" className="mt-4 animate-fadeIn">
          <ParagraphKeyPointsExtractionSection
            keywords={analysis.keywords}
            transitionWords={analysis.transitionWords}
            onAnalyzeKeywords={onAnalyzeKeywords}
            onCopy={(text) => handleCopy(text, 'keypoints')}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-4 animate-fadeIn">
          <ParagraphSummarySection
            betterVersion={analysis.betterVersion}
            gapAnalysis={analysis.gapAnalysis}
            onSummarize={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
            onCopy={(text) => handleCopy(text, 'summary')}
            paragraph={analysis.paragraph}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <ParagraphContextSection
            paragraphContext={analysis.paragraph}
            onAnalyzeRelatedParagraph={onAnalyzeRelatedParagraph}
            onCopy={(text) => handleCopy(text, 'context')}
          />
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4 animate-fadeIn">
          <ParagraphSentimentAnalysisSection
            sentimentLabel={analysis.sentimentLabel}
            sentimentIntensity={analysis.sentimentIntensity}
            sentimentJustification={analysis.sentimentJustification}
            onAnalyzeSentiment={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
            paragraph={analysis.paragraph}
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