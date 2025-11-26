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
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { Progress } from '../../../ui/progress';
import { cn } from '@/lib/utils';

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

      {/* Main Paragraph Information */}
      <ParagraphInfoSection
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
          <StructureAnalysisSection
            tone={analysis.tone}
            targetAudience={analysis.targetAudience}
            type={analysis.type}
            vocabularyLevel={analysis.vocabularyLevel}
            flowScore={analysis.flowScore}
            logicScore={analysis.logicScore}
            sentenceVariety={analysis.sentenceVariety}
            onAnalyzeStructure={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
          />
        </TabsContent>

        <TabsContent value="keypoints" className="mt-4 animate-fadeIn">
          <KeyPointsSection
            keywords={analysis.keywords}
            transitionWords={analysis.transitionWords}
            onAnalyzeKeywords={onAnalyzeKeywords}
            onCopy={(text) => handleCopy(text, 'keypoints')}
            copied={copiedSection === 'keypoints'}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-4 animate-fadeIn">
          <SummarySection
            betterVersion={analysis.betterVersion}
            gapAnalysis={analysis.gapAnalysis}
            onSummarize={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
            onCopy={(text) => handleCopy(text, 'summary')}
            copied={copiedSection === 'summary'}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <ParagraphContextSection
            paragraphContext={analysis.paragraph}
            onAnalyzeRelatedParagraph={onAnalyzeRelatedParagraph}
            onCopy={(text) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4 animate-fadeIn">
          <SentimentAnalysisSection
            sentimentLabel={analysis.sentimentLabel}
            sentimentIntensity={analysis.sentimentIntensity}
            sentimentJustification={analysis.sentimentJustification}
            onAnalyzeSentiment={() => onAnalyzeRelatedParagraph?.(analysis.paragraph)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Paragraph Information Section Component
 */
export const ParagraphInfoSection: React.FC<ParagraphInfoSectionProps> = ({
  analysis,
  onPronounce,
  showPronunciation = true,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullParagraph, setShowFullParagraph] = useState(false);

  const handlePronounce = useCallback(() => {
    setIsPlaying(true);
    onPronounce?.(analysis.paragraph);
    setTimeout(() => setIsPlaying(false), 3000);
  }, [analysis.paragraph, onPronounce]);

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-primary">
              {analysis.paragraph.substring(0, 100)}{analysis.paragraph.length > 100 ? '...' : ''}
            </div>
            <div className="flex items-center gap-2">
              {analysis.type && (
                <Badge variant="secondary" className="text-xs">
                  {analysis.type}
                </Badge>
              )}
              {analysis.vocabularyLevel && (
                <Badge variant="outline" className="text-xs">
                  {analysis.vocabularyLevel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showPronunciation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePronounce}
                className="h-8 px-2"
                aria-label="Phát âm đoạn văn"
              >
                <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">
          <p className="leading-relaxed">
            {showFullParagraph
              ? analysis.paragraph
              : `${analysis.paragraph.substring(0, 200)}${analysis.paragraph.length > 200 ? '...' : ''}`
            }
          </p>
          {analysis.paragraph.length > 200 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullParagraph(!showFullParagraph)}
              className="mt-2 h-8 px-2"
            >
              {showFullParagraph ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Xem thêm
                </>
              )}
            </Button>
          )}
        </div>
        {analysis.mainTopic && (
          <div className="mt-3 text-sm italic text-muted-foreground">
            <Target className="h-4 w-4 inline mr-2" />
            Chủ đề chính: {analysis.mainTopic}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main Topic Section Component
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
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Chủ đề chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mainTopic && (
          <div>
            <h4 className="font-medium text-sm mb-2">Chủ đề chính:</h4>
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
      </CardContent>
    </Card>
  );
};

/**
 * Structure Analysis Section Component
 */
export const StructureAnalysisSection: React.FC<StructureAnalysisSectionProps> = ({
  tone,
  targetAudience,
  type,
  vocabularyLevel,
  flowScore,
  logicScore,
  sentenceVariety,
  onAnalyzeStructure,
  className,
}) => {
  // Get paragraph from parent component or use a default
  const paragraphForAnalysis = "This is a sample paragraph for structure analysis";
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Phân tích cấu trúc
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tone && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Giọng văn:</h4>
              <p className="text-sm leading-relaxed">{tone}</p>
            </div>
          )}
          
          {targetAudience && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Đối tượng mục tiêu:</h4>
              <p className="text-sm leading-relaxed">{targetAudience}</p>
            </div>
          )}
          
          {type && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Loại văn bản:</h4>
              <Badge variant="outline">{type}</Badge>
            </div>
          )}
          
          {vocabularyLevel && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Trình độ từ vựng:</h4>
              <Badge variant="outline">{vocabularyLevel}</Badge>
            </div>
          )}
        </div>

        {(flowScore !== undefined || logicScore !== undefined) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Điểm số chất lượng:</h4>
            
            {flowScore !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Luồng văn:</span>
                  <span className="font-medium">{flowScore}/10</span>
                </div>
                <Progress value={flowScore * 10} className="h-2" />
              </div>
            )}
            
            {logicScore !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tính logic:</span>
                  <span className="font-medium">{logicScore}/10</span>
                </div>
                <Progress value={logicScore * 10} className="h-2" />
              </div>
            )}
          </div>
        )}
        
        {sentenceVariety && (
          <div>
            <h4 className="font-medium text-sm mb-1">Đa dạng câu:</h4>
            <p className="text-sm leading-relaxed">{sentenceVariety}</p>
          </div>
        )}
        
        {onAnalyzeStructure && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeStructure(paragraphForAnalysis)}
            className="w-full mt-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Phân tích cấu trúc chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Key Points Section Component
 */
export const KeyPointsSection: React.FC<KeyPointsSectionProps> = ({
  keywords = [],
  transitionWords = [],
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

  const handleCopyAllKeywords = useCallback(() => {
    if (keywords.length > 0) {
      onCopy?.(keywords.join(', '));
    }
  }, [keywords, onCopy]);

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" />
          Điểm chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {keywords.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Từ khóa quan trọng:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAllKeywords}
                className="h-8 px-2"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Đã sao chép' : 'Sao chép tất cả'}
              </Button>
            </div>
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
        
        {transitionWords.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Từ chuyển tiếp:</h4>
            <div className="flex flex-wrap gap-2">
              {transitionWords.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Summary Section Component
 */
export const SummarySection: React.FC<SummarySectionProps> = ({
  betterVersion,
  gapAnalysis,
  onSummarize,
  onCopy,
  copied,
  className,
}) => {
  // Get paragraph from parent component or use a default
  const paragraphForSummary = "This is a sample paragraph for summarization";
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Tóm tắt & Cải tiến
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {betterVersion && (
          <div>
            <h4 className="font-medium text-sm mb-2">Phiên bản cải tiến:</h4>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm leading-relaxed">{betterVersion}</p>
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(betterVersion)}
                  className="mt-2 h-8 px-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {gapAnalysis && (
          <div>
            <h4 className="font-medium text-sm mb-2">Phân tích khoảng trống:</h4>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm leading-relaxed">{gapAnalysis}</p>
            </div>
          </div>
        )}
        
        {onSummarize && (
          <Button
            variant="outline"
            onClick={() => onSummarize(paragraphForSummary)}
            className="w-full mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tóm tắt lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Context Section Component
 */
export const ParagraphContextSection: React.FC<ParagraphContextSectionProps> = ({
  paragraphContext,
  onAnalyzeRelatedParagraph,
  onCopy,
  copied,
  className,
}) => {
  // Get paragraph from parent component or use a default
  const paragraphForAnalysis = paragraphContext || "This is a sample paragraph for analysis";
  const [showFullContext, setShowFullContext] = useState(false);

  if (!paragraphContext) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Ngữ cảnh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed">
              {showFullContext
                ? paragraphContext
                : `${paragraphContext.substring(0, 200)}${paragraphContext.length > 200 ? '...' : ''}`
              }
            </p>
            {paragraphContext.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContext(!showFullContext)}
                className="mt-2 h-8 px-2"
              >
                {showFullContext ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Xem thêm
                  </>
                )}
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
        
        {onAnalyzeRelatedParagraph && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeRelatedParagraph(paragraphForAnalysis)}
            className="w-full mt-2"
          >
            <Search className="h-4 w-4 mr-2" />
            Phân tích đoạn văn liên quan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Sentiment Analysis Section Component
 */
export const SentimentAnalysisSection: React.FC<SentimentAnalysisSectionProps> = ({
  sentimentLabel,
  sentimentIntensity,
  sentimentJustification,
  onAnalyzeSentiment,
  className,
}) => {
  // Get paragraph from parent component or use a default
  const paragraphForAnalysis = "This is a sample paragraph for sentiment analysis";
  const getSentimentColor = (label?: string) => {
    if (!label) return 'secondary';
    if (label.includes('tích cực') || label.includes('positiv')) return 'default';
    if (label.includes('tiêu cực') || label.includes('negativ')) return 'destructive';
    return 'secondary';
  };

  const getIntensityColor = (intensity?: number) => {
    if (!intensity) return 'bg-muted';
    if (intensity >= 0.7) return 'bg-green-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Phân tích cảm xúc
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sentimentLabel && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Nhãn cảm xúc:</h4>
              <Badge variant={getSentimentColor(sentimentLabel)}>
                {sentimentLabel}
              </Badge>
            </div>
          )}
          
          {sentimentIntensity !== undefined && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Mức độ cảm xúc:</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Progress value={sentimentIntensity * 100} className="h-2" />
                </div>
                <span className="text-sm font-medium">{(sentimentIntensity * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
        
        {sentimentJustification && (
          <div>
            <h4 className="font-medium text-sm mb-2">Giải thích cảm xúc:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{sentimentJustification}</p>
            </div>
          </div>
        )}
        
        {onAnalyzeSentiment && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeSentiment(paragraphForAnalysis)}
            className="w-full mt-2"
          >
            <Brain className="h-4 w-4 mr-2" />
            Phân tích cảm xúc chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphDialogContent;