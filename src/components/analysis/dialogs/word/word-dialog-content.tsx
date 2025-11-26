import React, { useState, useCallback, useMemo } from 'react';
import { Volume2, BookOpen, Copy, ExternalLink, ChevronDown, ChevronUp, Volume2 as Volume2Icon } from 'lucide-react';
import { WordAnalysis } from '../../types/analysis-types';
import {
  WordDialogContentProps,
  WordInfoSectionProps,
  PronunciationSectionProps,
  DefinitionSectionProps,
  ExamplesSectionProps,
  RelatedWordsSectionProps,
  ContextSectionProps,
  AdditionalInfoSectionProps,
} from './word-dialog-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { cn } from '@/lib/utils';

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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    context: false,
    examples: true,
    related: false,
  });
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
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
      console.error('Failed to copy:', error);
    }
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis.sentenceContext || analysis.paragraphContext),
    hasExamples: !!(analysis.exampleSentence && analysis.exampleTranslation),
    hasRelated: !!(analysis.inferenceClues || analysis.rootMeaning),
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
      {/* Main Word Information */}
      <WordInfoSection
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

        <TabsContent value="definition" className="space-y-4 mt-4 animate-fadeIn">
            <DefinitionSection
              definition={analysis.definition}
              translation={analysis.translation}
              contextMeaning={analysis.contextMeaning}
              onCopy={(text) => handleCopy(text, 'definition')}
              copied={copiedSection === 'definition'}
            />
            <AdditionalInfoSection
              pos={analysis.pos}
              cefr={analysis.cefr}
              tone={analysis.tone}
              rootMeaning={analysis.rootMeaning}
              inferenceClues={analysis.inferenceClues}
              inferenceReasoning={analysis.inferenceReasoning}
              onCopy={(text) => handleCopy(text, 'additional')}
              copied={copiedSection === 'additional'}
            />
          </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <ExamplesSection
            exampleSentence={analysis.exampleSentence}
            exampleTranslation={analysis.exampleTranslation}
            onAnalyzeExample={onAnalyzeRelatedWord}
            onCopy={(text) => handleCopy(text, 'examples')}
            copied={copiedSection === 'examples'}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <ContextSection
            sentenceContext={analysis.sentenceContext}
            paragraphContext={analysis.paragraphContext}
            onCopy={(text) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="related" className="mt-4 animate-fadeIn">
          <RelatedWordsSection
            synonyms={[]}
            antonyms={[]}
            onWordClick={onAnalyzeRelatedWord}
            hoveredWord={hoveredWord}
            onWordHover={setHoveredWord}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Word Information Section Component
 */
export const WordInfoSection: React.FC<WordInfoSectionProps> = ({
  analysis,
  onPronounce,
  showPhonetic = true,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-primary">
              {analysis.word}
            </div>
            <div className="flex items-center gap-2">
              {analysis.pos && (
                <Badge variant="secondary" className="text-xs">
                  {analysis.pos}
                </Badge>
              )}
              {analysis.cefr && (
                <Badge variant="outline" className="text-xs">
                  {analysis.cefr}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showPhonetic && analysis.ipa && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPronounce?.(analysis.word)}
                className="h-8 px-2"
                aria-label="Phát âm từ"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showPhonetic && analysis.ipa && (
          <div className="mb-3">
            <span className="text-sm text-muted-foreground font-mono">
              {analysis.ipa}
            </span>
          </div>
        )}
        {analysis.translation && (
          <div className="text-lg text-muted-foreground">
            {analysis.translation}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Pronunciation Section Component
 */
export const PronunciationSection: React.FC<PronunciationSectionProps> = ({
  word,
  ipa,
  onPronounce,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePronounce = useCallback(() => {
    setIsPlaying(true);
    onPronounce?.(word);
    // Reset playing state after animation
    setTimeout(() => setIsPlaying(false), 1000);
  }, [word, onPronounce]);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {ipa && (
        <span className="text-sm font-mono text-muted-foreground">
          {ipa}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePronounce}
        disabled={isPlaying}
        className="h-8 px-3"
        aria-label={`Phát âm ${word}`}
      >
        <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
      </Button>
    </div>
  );
};

/**
 * Definition Section Component
 */
export const DefinitionSection: React.FC<DefinitionSectionProps> = ({
  definition,
  translation,
  contextMeaning,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Định nghĩa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {definition && (
          <div>
            <h4 className="font-medium text-sm mb-1">Định nghĩa:</h4>
            <p className="text-sm leading-relaxed">{definition}</p>
          </div>
        )}
        {translation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch:</h4>
            <p className="text-sm leading-relaxed">{translation}</p>
          </div>
        )}
        {contextMeaning && (
          <div>
            <h4 className="font-medium text-sm mb-1">Nghĩa trong ngữ cảnh:</h4>
            <p className="text-sm leading-relaxed">{contextMeaning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Examples Section Component
 */
export const ExamplesSection: React.FC<ExamplesSectionProps> = ({
  exampleSentence,
  exampleTranslation,
  onAnalyzeExample,
  className,
}) => {
  if (!exampleSentence) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Ví dụ sử dụng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed mb-2">
            {exampleSentence}
          </p>
          {exampleTranslation && (
            <p className="text-sm text-muted-foreground italic">
              {exampleTranslation}
            </p>
          )}
        </div>
        {onAnalyzeExample && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyzeExample(exampleSentence)}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Phân tích câu ví dụ
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Related Words Section Component
 */
export const RelatedWordsSection: React.FC<RelatedWordsSectionProps> = ({
  synonyms = [],
  antonyms = [],
  onWordClick,
  hoveredWord,
  onWordHover,
  className,
}) => {
  if (synonyms.length === 0 && antonyms.length === 0) return null;

  return (
    <Card className={cn('border-none shadow-sm transition-all duration-300 hover:shadow-md', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Từ liên quan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {synonyms.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Đồng nghĩa:</h4>
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer hover:bg-secondary/80 transition-colors",
                    hoveredWord === synonym && "ring-2 ring-secondary ring-offset-2"
                  )}
                  onClick={() => onWordClick?.(synonym)}
                  onMouseEnter={() => onWordHover?.(synonym)}
                  onMouseLeave={() => onWordHover?.(null)}
                >
                  {synonym}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {antonyms.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Trái nghĩa:</h4>
            <div className="flex flex-wrap gap-2">
              {antonyms.map((antonym, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors",
                    hoveredWord === antonym && "ring-2 ring-accent ring-offset-2"
                  )}
                  onClick={() => onWordClick?.(antonym)}
                  onMouseEnter={() => onWordHover?.(antonym)}
                  onMouseLeave={() => onWordHover?.(null)}
                >
                  {antonym}
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
 * Context Section Component
 */
export const ContextSection: React.FC<ContextSectionProps> = ({
  sentenceContext,
  paragraphContext,
  className,
}) => {
  const [showFullParagraph, setShowFullParagraph] = useState(false);

  if (!sentenceContext && !paragraphContext) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Ngữ cảnh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sentenceContext && (
          <div>
            <h4 className="font-medium text-sm mb-2">Ngữ cảnh câu:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{sentenceContext}</p>
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
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Additional Information Section Component
 */
export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  pos,
  cefr,
  tone,
  rootMeaning,
  inferenceClues,
  inferenceReasoning,
  className,
}) => {
  const hasAdditionalInfo = !!(pos || cefr || tone || rootMeaning || inferenceClues || inferenceReasoning);

  if (!hasAdditionalInfo) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Thông tin bổ sung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {pos && (
            <div>
              <h4 className="font-medium text-sm mb-1">Loại từ:</h4>
              <Badge variant="secondary">{pos}</Badge>
            </div>
          )}
          {cefr && (
            <div>
              <h4 className="font-medium text-sm mb-1">Trình độ:</h4>
              <Badge variant="outline">{cefr}</Badge>
            </div>
          )}
          {tone && (
            <div>
              <h4 className="font-medium text-sm mb-1">Sắc thái:</h4>
              <Badge variant="outline">{tone}</Badge>
            </div>
          )}
        </div>
        
        {rootMeaning && (
          <div>
            <h4 className="font-medium text-sm mb-1">Nghĩa gốc:</h4>
            <p className="text-sm leading-relaxed">{rootMeaning}</p>
          </div>
        )}
        
        {inferenceClues && (
          <div>
            <h4 className="font-medium text-sm mb-1">Dấu hiệu suy luận:</h4>
            <p className="text-sm leading-relaxed">{inferenceClues}</p>
          </div>
        )}
        
        {inferenceReasoning && (
          <div>
            <h4 className="font-medium text-sm mb-1">Lý do suy luận:</h4>
            <p className="text-sm leading-relaxed">{inferenceReasoning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordDialogContent;