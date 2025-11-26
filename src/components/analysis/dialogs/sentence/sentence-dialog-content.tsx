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
  Info
} from 'lucide-react';
import { SentenceAnalysis } from '../../types/analysis-types';
import {
  SentenceDialogContentProps,
  SentenceInfoSectionProps,
  SentenceStructureSectionProps,
  TranslationSectionProps,
  GrammarAnalysisSectionProps,
  SentenceContextSectionProps,
  SentenceExamplesSectionProps,
} from './sentence-dialog-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { cn } from '@/lib/utils';

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
      console.error('Failed to copy:', error);
    }
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis.paragraphContext || analysis.relationToPrevious),
    hasStructure: !!(analysis.subject || analysis.mainVerb || analysis.object || analysis.clauses),
    hasGrammar: !!(analysis.function || analysis.complexityLevel || analysis.sentiment || analysis.subtext),
    hasExamples: !!(analysis.clauses && Object.keys(analysis.clauses).length > 0),
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

      {/* Main Sentence Information */}
      <SentenceInfoSection
        analysis={analysis}
        onPronounce={onPronounce}
        showPronunciation={showPronunciation}
      />

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
          <TranslationSection
            naturalTranslation={analysis.naturalTranslation}
            literalTranslation={analysis.literalTranslation}
            mainIdea={analysis.mainIdea}
            onCopy={(text) => handleCopy(text, 'translation')}
            copied={copiedSection === 'translation'}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4 animate-fadeIn">
          <SentenceStructureSection
            subject={analysis.subject}
            mainVerb={analysis.mainVerb}
            object={analysis.object}
            clauses={analysis.clauses}
            sentenceType={analysis.sentenceType}
            onClauseClick={onBreakdownClause}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-4 animate-fadeIn">
          <GrammarAnalysisSection
            function={analysis.function}
            complexityLevel={analysis.complexityLevel}
            sentiment={analysis.sentiment}
            subtext={analysis.subtext}
            sentence={analysis.sentence}
            onAnalyzeGrammar={() => onAnalyzeRelatedSentence?.(analysis.sentence)}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <SentenceContextSection
            paragraphContext={analysis.paragraphContext}
            relationToPrevious={analysis.relationToPrevious}
            onCopy={(text) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <SentenceExamplesSection
            examples={analysis.clauses ? Object.values(analysis.clauses) : []}
            onAnalyzeExample={onAnalyzeRelatedSentence}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Sentence Information Section Component
 */
export const SentenceInfoSection: React.FC<SentenceInfoSectionProps> = ({
  analysis,
  onPronounce,
  showPronunciation = true,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePronounce = useCallback(() => {
    setIsPlaying(true);
    onPronounce?.(analysis.sentence);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [analysis.sentence, onPronounce]);

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-primary">
              {analysis.sentence}
            </div>
            <div className="flex items-center gap-2">
              {analysis.sentenceType && (
                <Badge variant="secondary" className="text-xs">
                  {analysis.sentenceType}
                </Badge>
              )}
              {analysis.complexityLevel && (
                <Badge variant="outline" className="text-xs">
                  {analysis.complexityLevel}
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
                aria-label="Phát âm câu"
              >
                <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {analysis.mainIdea && (
          <div className="text-sm text-muted-foreground italic">
            <Lightbulb className="h-4 w-4 inline mr-2" />
            {analysis.mainIdea}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Sentence Structure Section Component
 */
export const SentenceStructureSection: React.FC<SentenceStructureSectionProps> = ({
  subject,
  mainVerb,
  object,
  clauses,
  sentenceType,
  onClauseClick,
  className,
}) => {
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});

  const toggleClause = useCallback((clauseId: string) => {
    setExpandedClauses(prev => ({
      ...prev,
      [clauseId]: !prev[clauseId],
    }));
  }, []);

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Cấu trúc câu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subject && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Chủ ngữ:</h4>
              <p className="text-sm leading-relaxed">{subject}</p>
            </div>
          )}
          {mainVerb && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Động từ chính:</h4>
              <p className="text-sm leading-relaxed">{mainVerb}</p>
            </div>
          )}
          {object && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Tân ngữ:</h4>
              <p className="text-sm leading-relaxed">{object}</p>
            </div>
          )}
        </div>

        {clauses && Object.keys(clauses).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Các mệnh đề:</h4>
            <div className="space-y-2">
              {Object.entries(clauses).map(([clauseId, clauseText], index) => (
                <div
                  key={clauseId}
                  className="p-3 bg-muted/20 rounded-lg clause-highlight"
                  onClick={() => {
                    onClauseClick?.(clauseText as string);
                    toggleClause(clauseId);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mệnh đề {index + 1}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedClauses[clauseId] && 'rotate-180'
                      )}
                    />
                  </div>
                  {expandedClauses[clauseId] && (
                    <p className="text-sm mt-2 leading-relaxed">{clauseText as string}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sentenceType && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Loại câu:</span>
            <Badge variant="outline">{sentenceType}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Translation Section Component
 */
export const TranslationSection: React.FC<TranslationSectionProps> = ({
  naturalTranslation,
  literalTranslation,
  mainIdea,
  onCopy,
  copied,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Bản dịch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {naturalTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch tự nhiên:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{naturalTranslation}</p>
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(naturalTranslation)}
                  className="mt-2 h-8 px-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {literalTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch chữ:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed italic">{literalTranslation}</p>
            </div>
          </div>
        )}
        
        {mainIdea && (
          <div>
            <h4 className="font-medium text-sm mb-1">Ý chính:</h4>
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm leading-relaxed">{mainIdea}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Grammar Analysis Section Component
 */
export const GrammarAnalysisSection: React.FC<GrammarAnalysisSectionProps> = ({
  function: sentenceFunction,
  complexityLevel,
  sentiment,
  subtext,
  sentence,
  onAnalyzeGrammar,
  className,
}) => {
  // Get sentence from parent component or use a default
  const sentenceForAnalysis = sentence || "This is a sample sentence for grammar analysis";
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Phân tích ngữ pháp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sentenceFunction && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Chức năng:</h4>
              <p className="text-sm leading-relaxed">{sentenceFunction}</p>
            </div>
          )}
          
          {complexityLevel && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Độ phức tạp:</h4>
              <Badge variant="outline">{complexityLevel}</Badge>
            </div>
          )}
          
          {sentiment && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Sắc thái:</h4>
              <Badge 
                variant={sentiment.includes('tích cực') ? 'default' : 
                        sentiment.includes('tiêu cực') ? 'destructive' : 'secondary'}
              >
                {sentiment}
              </Badge>
            </div>
          )}
        </div>
        
        {subtext && (
          <div>
            <h4 className="font-medium text-sm mb-1">Ý ngầm:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed italic">{subtext}</p>
            </div>
          </div>
        )}
        
        {onAnalyzeGrammar && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeGrammar?.(sentenceForAnalysis)}
            className="w-full mt-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Phân tích ngữ pháp chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
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

/**
 * Examples Section Component
 */
export const SentenceExamplesSection: React.FC<SentenceExamplesSectionProps> = ({
  examples = [],
  onAnalyzeExample,
  className,
}) => {
  if (examples.length === 0) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Ví dụ liên quan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {examples.map((example, index) => (
          <div key={index} className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed mb-2">{example}</p>
            {onAnalyzeExample && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAnalyzeExample(example)}
                className="h-8 px-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                Phân tích
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SentenceDialogContent;