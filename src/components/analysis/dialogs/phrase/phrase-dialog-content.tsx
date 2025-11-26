import React, { useState, useCallback, useMemo } from 'react';
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
      console.error('Failed to copy:', error);
    }
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis.sentenceContext || analysis.paragraphContext),
    hasExamples: !!(analysis.usageExamples && analysis.usageExamples.length > 0),
    hasRelated: !!(analysis.synonyms || analysis.antonyms || analysis.variations),
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
      {/* Main Phrase Information */}
      <PhraseInfoSection
        analysis={analysis}
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
          <PhraseMeaningSection
            naturalTranslation={analysis.naturalTranslation}
            literalMeaning={analysis.literalMeaning}
            contextualMeaning={analysis.contextualMeaning}
            vietnameseTranslation={analysis.vietnameseTranslation}
            onCopy={(text: string) => handleCopy(text, 'meaning')}
            copied={copiedSection === 'meaning'}
          />
          <PhraseAdditionalInfoSection
            partOfSpeech={analysis.partOfSpeech}
            phraseType={analysis.phraseType}
            grammaticalPattern={analysis.grammaticalPattern}
            registerLevel={analysis.registerLevel}
            complexityLevel={analysis.complexityLevel}
            frequencyLevel={analysis.frequencyLevel}
            culturalNotes={analysis.culturalNotes}
            stylisticNotes={analysis.stylisticNotes}
            memoryAid={analysis.memoryAid}
            onCopy={(text: string) => handleCopy(text, 'additional')}
            copied={copiedSection === 'additional'}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <PhraseExamplesSection
            usageExamples={analysis.usageExamples}
            usageTips={analysis.usageTips}
            onAnalyzeExample={onAnalyzeRelatedPhrase}
            onCopy={(text: string) => handleCopy(text, 'examples')}
            copied={copiedSection === 'examples'}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <PhraseContextSection
            sentenceContext={analysis.sentenceContext}
            paragraphContext={analysis.paragraphContext}
            onCopy={(text: string) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="related" className="mt-4 animate-fadeIn">
          <PhraseRelatedWordsSection
            synonyms={analysis.synonyms}
            antonyms={analysis.antonyms}
            variations={analysis.variations}
            onPhraseClick={onAnalyzeRelatedPhrase}
            hoveredPhrase={hoveredPhrase}
            onPhraseHover={setHoveredPhrase}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Phrase Information Section Component
 */
export const PhraseInfoSection: React.FC<PhraseInfoSectionProps> = ({
  analysis,
  onPronounce,
  showPronunciation = true,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-primary" data-phrase-highlight>
              {analysis.phrase}
            </div>
            <div className="flex items-center gap-2">
              {analysis.partOfSpeech && (
                <Badge variant="secondary" className="text-xs">
                  {analysis.partOfSpeech}
                </Badge>
              )}
              {analysis.phraseType && (
                <Badge variant="outline" className="text-xs">
                  {analysis.phraseType}
                </Badge>
              )}
              {analysis.registerLevel && (
                <Badge variant="outline" className="text-xs">
                  {analysis.registerLevel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showPronunciation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPronounce?.(analysis.phrase)}
                className="h-8 px-2"
                aria-label="Phát âm cụm từ"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {analysis.vietnameseTranslation && (
          <div className="text-lg text-muted-foreground">
            {analysis.vietnameseTranslation}
          </div>
        )}
        {analysis.naturalTranslation && (
          <div className="text-md text-muted-foreground mt-2">
            {analysis.naturalTranslation}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Pronunciation Section Component
 */
export const PhrasePronunciationSection: React.FC<PhrasePronunciationSectionProps> = ({
  phrase,
  onPronounce,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePronounce = useCallback(() => {
    setIsPlaying(true);
    onPronounce?.(phrase);
    // Reset playing state after animation
    setTimeout(() => setIsPlaying(false), 1000);
  }, [phrase, onPronounce]);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePronounce}
        disabled={isPlaying}
        className="h-8 px-3"
        aria-label={`Phát âm ${phrase}`}
      >
        <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
      </Button>
    </div>
  );
};

/**
 * Meaning Section Component
 */
export const PhraseMeaningSection: React.FC<PhraseMeaningSectionProps> = ({
  naturalTranslation,
  literalMeaning,
  contextualMeaning,
  vietnameseTranslation,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Nghĩa của cụm từ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {naturalTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch tự nhiên:</h4>
            <p className="text-sm leading-relaxed">{naturalTranslation}</p>
          </div>
        )}
        {literalMeaning && (
          <div>
            <h4 className="font-medium text-sm mb-1">Nghĩa đen:</h4>
            <p className="text-sm leading-relaxed">{literalMeaning}</p>
          </div>
        )}
        {contextualMeaning && (
          <div>
            <h4 className="font-medium text-sm mb-1">Nghĩa trong ngữ cảnh:</h4>
            <p className="text-sm leading-relaxed">{contextualMeaning}</p>
          </div>
        )}
        {vietnameseTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch tiếng Việt:</h4>
            <p className="text-sm leading-relaxed">{vietnameseTranslation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Examples Section Component
 */
export const PhraseExamplesSection: React.FC<PhraseExamplesSectionProps> = ({
  usageExamples,
  usageTips,
  onAnalyzeExample,
  className,
}) => {
  if (!usageExamples || usageExamples.length === 0) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Ví dụ sử dụng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {usageExamples.map((example: string, index: number) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm leading-relaxed mb-2">
              {example}
            </p>
            {onAnalyzeExample && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAnalyzeExample(example)}
                className="w-full"
              >
                <Link className="h-4 w-4 mr-2" />
                Phân tích ví dụ
              </Button>
            )}
          </div>
        ))}
        
        {usageTips && usageTips.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Mẹo sử dụng:
            </h4>
            <ul className="text-sm leading-relaxed space-y-1">
              {usageTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Related Words Section Component
 */
export const PhraseRelatedWordsSection: React.FC<PhraseRelatedWordsSectionProps> = ({
  synonyms = [],
  antonyms = [],
  variations = [],
  onPhraseClick,
  hoveredPhrase,
  onPhraseHover,
  className,
}) => {
  if (synonyms.length === 0 && antonyms.length === 0 && variations.length === 0) return null;

  return (
    <Card className={cn('border-none shadow-sm transition-all duration-300 hover:shadow-md', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Cụm từ liên quan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {synonyms.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Đồng nghĩa:</h4>
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym: string, index: number) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer hover:bg-secondary/80 transition-colors",
                    hoveredPhrase === synonym && "ring-2 ring-secondary ring-offset-2"
                  )}
                  onClick={() => onPhraseClick?.(synonym)}
                  onMouseEnter={() => onPhraseHover?.(synonym)}
                  onMouseLeave={() => onPhraseHover?.(null)}
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
              {antonyms.map((antonym: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors",
                    hoveredPhrase === antonym && "ring-2 ring-accent ring-offset-2"
                  )}
                  onClick={() => onPhraseClick?.(antonym)}
                  onMouseEnter={() => onPhraseHover?.(antonym)}
                  onMouseLeave={() => onPhraseHover?.(null)}
                >
                  {antonym}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {variations.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Biến thể:</h4>
            <div className="flex flex-wrap gap-2">
              {variations.map((variation: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors",
                    hoveredPhrase === variation && "ring-2 ring-accent ring-offset-2"
                  )}
                  onClick={() => onPhraseClick?.(variation)}
                  onMouseEnter={() => onPhraseHover?.(variation)}
                  onMouseLeave={() => onPhraseHover?.(null)}
                >
                  {variation}
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
export const PhraseContextSection: React.FC<PhraseContextSectionProps> = ({
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
export const PhraseAdditionalInfoSection: React.FC<PhraseAdditionalInfoSectionProps> = ({
  partOfSpeech,
  phraseType,
  grammaticalPattern,
  registerLevel,
  complexityLevel,
  frequencyLevel,
  culturalNotes,
  stylisticNotes,
  memoryAid,
  className,
}) => {
  const hasAdditionalInfo = !!(partOfSpeech || phraseType || grammaticalPattern || registerLevel || complexityLevel || frequencyLevel || culturalNotes || stylisticNotes || memoryAid);

  if (!hasAdditionalInfo) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Thông tin bổ sung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {partOfSpeech && (
            <div>
              <h4 className="font-medium text-sm mb-1">Loại từ:</h4>
              <Badge variant="secondary">{partOfSpeech}</Badge>
            </div>
          )}
          {phraseType && (
            <div>
              <h4 className="font-medium text-sm mb-1">Loại cụm từ:</h4>
              <Badge variant="outline">{phraseType}</Badge>
            </div>
          )}
          {registerLevel && (
            <div>
              <h4 className="font-medium text-sm mb-1">Trình độ đăng ký:</h4>
              <Badge variant="outline">{registerLevel}</Badge>
            </div>
          )}
          {complexityLevel && (
            <div>
              <h4 className="font-medium text-sm mb-1">Mức độ phức tạp:</h4>
              <Badge variant="outline">{complexityLevel}</Badge>
            </div>
          )}
          {frequencyLevel && (
            <div>
              <h4 className="font-medium text-sm mb-1">Mức độ tần suất:</h4>
              <Badge variant="outline">{frequencyLevel}</Badge>
            </div>
          )}
        </div>
        
        {grammaticalPattern && (
          <div>
            <h4 className="font-medium text-sm mb-1">Mẫu ngữ pháp:</h4>
            <p className="text-sm leading-relaxed font-mono bg-muted/30 p-2 rounded">
              {grammaticalPattern}
            </p>
          </div>
        )}
        
        {memoryAid && (
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Mẹo ghi nhớ:
            </h4>
            <p className="text-sm leading-relaxed bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded">
              {memoryAid}
            </p>
          </div>
        )}
        
        {culturalNotes && (
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ghi chú văn hóa:
            </h4>
            <p className="text-sm leading-relaxed bg-blue-50 border-l-4 border-blue-300 p-3 rounded">
              {culturalNotes}
            </p>
          </div>
        )}
        
        {stylisticNotes && (
          <div>
            <h4 className="font-medium text-sm mb-1">Ghi chú phong cách:</h4>
            <p className="text-sm leading-relaxed bg-purple-50 border-l-4 border-purple-300 p-3 rounded">
              {stylisticNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhraseDialogContent;