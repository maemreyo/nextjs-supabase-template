import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen,
  Volume2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnalysisItem, AnalysisItemProps, DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from '../types/analysis-types';
import { normalizePOS } from '../helpers/pos-normalizer';

interface AnalysisItemCardProps extends AnalysisItemProps {
  layoutConfig?: 'default' | 'compact';
}

// Simple tooltip component to replace missing UI component
const SimpleTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="group relative inline-block">
    {children}
    <div className="invisible group-hover:visible absolute z-10 w-auto p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
      {content}
      <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
    </div>
  </div>
);

export function AnalysisItemCard({
  analysis,
  onClick,
  onAnalyze,
  onRemove,
  compact = false,
  showPhonetic = true,
  truncateLength,
  layoutConfig = compact ? 'compact' : 'default'
}: AnalysisItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get appropriate layout config
  const layouts = layoutConfig === 'compact' ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
  const layout = layouts[analysis.analysisType];
  
  // Determine content to display based on analysis type
  const getContent = () => {
    switch (analysis.analysisType) {
      case 'word':
        return getWordContent(analysis);
      case 'phrase':
        return getPhraseContent(analysis);
      case 'sentence':
        return getSentenceContent(analysis);
      case 'paragraph':
        return getParagraphContent(analysis);
      default:
        return null;
    }
  };
  
  const getWordContent = (wordAnalysis: any) => {
    const posInfo = normalizePOS(wordAnalysis.pos);
    return {
      title: wordAnalysis.word,
      subtitle: wordAnalysis.translation,
      phonetic: wordAnalysis.ipa,
      badges: [
        ...(wordAnalysis.pos ? [{ label: posInfo.abbreviation, color: posInfo.color, icon: posInfo.icon, tooltip: posInfo.label }] : []),
        ...(wordAnalysis.cefr ? [{ label: wordAnalysis.cefr, variant: 'secondary' as const }] : []),
      ],
      description: wordAnalysis.definition || wordAnalysis.contextMeaning,
    };
  };
  
  const getPhraseContent = (phraseAnalysis: any) => {
    const posInfo = normalizePOS(phraseAnalysis.partOfSpeech);
    return {
      title: phraseAnalysis.phrase,
      subtitle: phraseAnalysis.naturalTranslation || phraseAnalysis.vietnameseTranslation,
      phonetic: null, // Phrases don't typically have phonetic
      badges: [
        ...(phraseAnalysis.partOfSpeech ? [{ label: posInfo.abbreviation, color: posInfo.color, icon: posInfo.icon, tooltip: posInfo.label }] : []),
        ...(phraseAnalysis.phraseType ? [{ label: phraseAnalysis.phraseType, variant: 'secondary' as const }] : []),
      ],
      description: phraseAnalysis.contextualMeaning || phraseAnalysis.literalMeaning,
    };
  };
  
  const getSentenceContent = (sentenceAnalysis: any) => {
    return {
      title: sentenceAnalysis.sentence,
      subtitle: sentenceAnalysis.naturalTranslation,
      phonetic: null, // Sentences don't typically have phonetic
      badges: [
        ...(sentenceAnalysis.sentenceType ? [{ label: sentenceAnalysis.sentenceType, variant: 'outline' as const }] : []),
        ...(sentenceAnalysis.complexityLevel ? [{ label: sentenceAnalysis.complexityLevel, variant: 'secondary' as const }] : []),
      ],
      description: sentenceAnalysis.mainIdea,
    };
  };
  
  const getParagraphContent = (paragraphAnalysis: any) => {
    return {
      title: paragraphAnalysis.paragraph.substring(0, 100) + (paragraphAnalysis.paragraph.length > 100 ? '...' : ''),
      subtitle: paragraphAnalysis.mainTopic,
      phonetic: null, // Paragraphs don't have phonetic
      badges: [
        ...(paragraphAnalysis.type ? [{ label: paragraphAnalysis.type, variant: 'outline' as const }] : []),
        ...(paragraphAnalysis.vocabularyLevel ? [{ label: paragraphAnalysis.vocabularyLevel, variant: 'secondary' as const }] : []),
        ...(paragraphAnalysis.sentimentLabel ? [{ label: paragraphAnalysis.sentimentLabel, variant: 'secondary' as const }] : []),
      ],
      description: paragraphAnalysis.mainTopic,
    };
  };
  
  const content = getContent();
  if (!content) return null;
  
  // Handle text truncation
  const shouldTruncate = truncateLength && content.description && content.description.length > truncateLength;
  const displayDescription = shouldTruncate && !isExpanded 
    ? content.description.substring(0, truncateLength) + '...' 
    : content.description;
  
  const handlePronounce = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };
  
  return (
    <Card className={`analysis-card analysis-card-${analysis.analysisType} ${compact ? 'analysis-card-' + analysis.analysisType + '-compact' : ''} hover:shadow-md transition-all duration-200 cursor-pointer ${layout.cardPadding} ${layout.maxHeight || ''}`}>
      <div onClick={() => onClick?.(analysis)}>
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className={`${layout.titleSize} text-primary truncate`}>
              {content.title}
            </h3>
            {content.subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {content.subtitle}
              </p>
            )}
            {/* Phonetic display */}
            {showPhonetic && content.phonetic && (
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block">
                {content.phonetic}
              </code>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {/* Pronounce button for words and phrases */}
            {(analysis.analysisType === 'word' || analysis.analysisType === 'phrase') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePronounce(content.title);
                }}
                className="h-6 w-6 p-0"
                title="Phát âm"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            )}
            
            {/* More options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAnalyze?.(analysis)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Phân tích chi tiết
                </DropdownMenuItem>
                {content.phonetic && (
                  <DropdownMenuItem onClick={() => handlePronounce(content.title)}>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Phát âm
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove?.(analysis.analysisId, analysis.analysisType)}
                  className="text-destructive"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {content.badges?.map((badge: any, index: number) => (
            badge.tooltip ? (
              <SimpleTooltip key={index} content={badge.tooltip}>
                <Badge variant="outline" className={`${badge.color} text-xs px-1 py-0 flex items-center gap-1`}>
                  {badge.icon && <span>{badge.icon}</span>}
                  {badge.label}
                </Badge>
              </SimpleTooltip>
            ) : (
              <Badge key={index} variant={badge.variant || 'outline'} className="text-xs px-1 py-0">
                {badge.label}
              </Badge>
            )
          ))}
        </div>
        
        {/* Description with truncation */}
        {displayDescription && (
          <div className={`${layout.textSize} text-muted-foreground`}>
            <p>{displayDescription}</p>
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Đọc thêm
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default AnalysisItemCard;