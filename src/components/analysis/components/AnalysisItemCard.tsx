import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Volume2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  BookmarkPlus
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

// Improved tooltip component with better accessibility
const SimpleTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="group relative inline-block">
    {children}
    <div
      className="invisible group-hover:visible absolute z-50 w-auto max-w-xs p-2 mt-1 text-xs text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none"
      role="tooltip"
      aria-hidden="true"
    >
      <div className="relative">
        {content}
        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
      </div>
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Get appropriate layout config with memoization
  const layout = useMemo(() => {
    const layouts = layoutConfig === 'compact' ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
    return layouts[analysis.analysisType];
  }, [layoutConfig, analysis.analysisType]);
  
  // Get card min height based on analysis type and layout
  const getCardMinHeight = () => {
    const type = analysis.analysisType;
    if (compact) {
      switch (type) {
        case 'word': return 'min-h-[100px]';
        case 'phrase': return 'min-h-[120px]';
        case 'sentence': return 'min-h-[140px]';
        case 'paragraph': return 'min-h-[160px]';
        default: return '';
      }
    } else {
      switch (type) {
        case 'word': return 'min-h-[120px]';
        case 'phrase': return 'min-h-[140px]';
        case 'sentence': return 'min-h-[160px]';
        case 'paragraph': return 'min-h-[200px]';
        default: return '';
      }
    }
  };
  
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
  
  // Handle text truncation with memoization
  const displayDescription = useMemo(() => {
    if (!content.description) return null;
    
    const shouldTruncate = truncateLength && content.description.length > truncateLength;
    return shouldTruncate && !isExpanded
      ? content.description.substring(0, truncateLength) + '...'
      : content.description;
  }, [content.description, truncateLength, isExpanded]);
  
  // Improved pronunciation handler with state management
  const handlePronounce = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || isSpeaking) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  // Copy to clipboard functionality
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  // Toggle expanded state
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);
  
  const shouldTruncate = truncateLength && content.description && content.description.length > truncateLength;
  
  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 rounded-lg overflow-hidden border-border/50 bg-card ${layout.cardPadding} ${layout.maxHeight || ''} ${getCardMinHeight()} group`}
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(analysis)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(analysis);
        }
      }}
      aria-label={`${content.title} - ${content.subtitle || ''}`}
    >
      <div className="h-full flex flex-col">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-3 flex-1">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className={`${layout.titleSize} text-primary font-semibold truncate mb-1 group-hover:text-primary/90 transition-colors`}>
              {content.title}
            </h3>
            {content.subtitle && (
              <p className="text-sm text-muted-foreground truncate mb-2">
                {content.subtitle}
              </p>
            )}
            {/* Phonetic display */}
            {showPhonetic && content.phonetic && (
              <code className="text-xs bg-muted/50 px-2 py-1 rounded-md block font-mono border border-border/30">
                {content.phonetic}
              </code>
            )}
          </div>
          
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Pronounce button for words and phrases */}
            {(analysis.analysisType === 'word' || analysis.analysisType === 'phrase') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePronounce(content.title);
                }}
                className={`h-7 w-7 p-0 hover:bg-muted/50 ${isSpeaking ? 'text-primary animate-pulse' : ''}`}
                title="Phát âm"
                aria-label="Phát âm"
                disabled={isSpeaking}
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
                  className="h-7 w-7 p-0 hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Thêm tùy chọn"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onAnalyze?.(analysis)} className="cursor-pointer">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Phân tích chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy(content.title)} className="cursor-pointer">
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép
                </DropdownMenuItem>
                {content.phonetic && (
                  <DropdownMenuItem onClick={() => handlePronounce(content.title)} className="cursor-pointer">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Phát âm
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Lưu vào danh sách
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove?.(analysis.analysisId, analysis.analysisType)}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Badges */}
        {content.badges && content.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {content.badges.map((badge: any, index: number) => (
              badge.tooltip ? (
                <SimpleTooltip key={index} content={badge.tooltip}>
                  <Badge
                    variant="outline"
                    className={`${badge.color || ''} text-xs px-2 py-0.5 flex items-center gap-1 hover:bg-muted/30 transition-colors cursor-default`}
                  >
                    {badge.icon && <span className="text-xs">{badge.icon}</span>}
                    {badge.label}
                  </Badge>
                </SimpleTooltip>
              ) : (
                <Badge
                  key={index}
                  variant={badge.variant || 'outline'}
                  className="text-xs px-2 py-0.5 hover:bg-muted/30 transition-colors cursor-default"
                >
                  {badge.label}
                </Badge>
              )
            ))}
          </div>
        )}
        
        {/* Description with truncation */}
        {displayDescription && (
          <div className={`${layout.textSize} text-muted-foreground mt-auto`}>
            <p className="leading-relaxed">{displayDescription}</p>
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs mt-2 hover:text-primary transition-colors"
                onClick={toggleExpanded}
                aria-expanded={isExpanded}
                aria-controls={`description-${analysis.analysisId}`}
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