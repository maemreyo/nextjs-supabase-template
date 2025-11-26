import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Volume2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils'; // Đảm bảo bạn có utility này (thường mặc định khi cài shadcn)
import { AnalysisItemProps, DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from '../types/analysis-types';
import { normalizePOS } from '../helpers/pos-normalizer';

interface AnalysisItemCardProps extends AnalysisItemProps {
  layoutConfig?: 'default' | 'compact';
  className?: string;
}

export function AnalysisItemCard({
  analysis,
  onClick,
  onAnalyze,
  onRemove,
  compact = false,
  showPhonetic = true,
  truncateLength,
  layoutConfig = compact ? 'compact' : 'default',
  className
}: AnalysisItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Layout Strategy
  const layoutStyle = layoutConfig === 'compact' ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
  const activeLayout = layoutStyle[analysis.analysisType] || {};

  // Data Normalization Logic - Extracted for clarity
  const normalizedData = useMemo(() => {
    const commonProps = {
      phonetic: null as string | null,
      badges: [] as Array<{ label: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive'; color?: string; icon?: React.ReactNode; tooltip?: string }>,
      isLongText: false,
    };

    switch (analysis.analysisType) {
      case 'word': {
        const posInfo = normalizePOS(analysis.pos);
        return {
          ...commonProps,
          title: analysis.word,
          subtitle: analysis.translation,
          phonetic: analysis.ipa,
          description: analysis.definition || analysis.contextMeaning,
          badges: [],
        };
      }
      case 'phrase': {
        const posInfo = normalizePOS(analysis.partOfSpeech);
        return {
          ...commonProps,
          title: analysis.phrase,
          subtitle: analysis.naturalTranslation || analysis.vietnameseTranslation,
          description: analysis.contextualMeaning || analysis.literalMeaning,
          badges: [
            ...(analysis.phraseType ? [{ label: analysis.phraseType, variant: 'secondary' as const }] : []),
          ],
        };
      }
      case 'sentence': {
        return {
          ...commonProps,
          title: analysis.sentence,
          subtitle: analysis.naturalTranslation,
          description: analysis.mainIdea,
          badges: [
            ...(analysis.sentenceType ? [{ label: analysis.sentenceType, variant: 'outline' as const }] : []),
          ],
        };
      }
      case 'paragraph': {
        return {
          ...commonProps,
          title: analysis.paragraph, // Will handle truncation in render
          subtitle: analysis.mainTopic,
          description: analysis.mainTopic, // Fallback description
          isLongText: true,
          badges: [
            ...(analysis.type ? [{ label: analysis.type, variant: 'outline' as const }] : []),
            ...(analysis.sentimentLabel ? [{ label: analysis.sentimentLabel, variant: 'secondary' as const }] : []),
          ],
        };
      }
      default:
        return null;
    }
  }, [analysis]);

  if (!normalizedData) return null;

  // Render Helpers
  const isWordOrPhrase = analysis.analysisType === 'word' || analysis.analysisType === 'phrase';

  // Multi-line truncation configuration for each analysis type
  const getTruncationConfig = (type: string) => {
    switch (type) {
      case 'word':
        return { titleLines: 1, subtitleLines: 1 };
      case 'phrase':
        return { titleLines: 2, subtitleLines: 1 };
      case 'sentence':
        return { titleLines: 2, subtitleLines: 2 };
      case 'paragraph':
        return { titleLines: 3, subtitleLines: 2 };
      default:
        return { titleLines: 1, subtitleLines: 1 };
    }
  };

  const truncationConfig = getTruncationConfig(analysis.analysisType);

  // Description Truncation Logic
  const descriptionText = normalizedData.description || '';
  const shouldTruncateDesc = truncateLength && descriptionText.length > truncateLength;
  const displayDescription = shouldTruncateDesc && !isExpanded
    ? `${descriptionText.substring(0, truncateLength)}...`
    : descriptionText;

  // Title Truncation Logic - use truncateLength instead of hardcoded 100
  const displayTitle = normalizedData.isLongText && truncateLength
    ? (normalizedData.title.length > truncateLength ? `${normalizedData.title.substring(0, truncateLength)}...` : normalizedData.title)
    : normalizedData.title;

  const handlePronounce = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = () => onClick?.(analysis);

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between transition-all duration-200",
        "hover:shadow-md hover:border-primary/50",
        "cursor-pointer bg-card text-card-foreground",
        activeLayout.maxHeight,
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={cn("p-4 pb-2 space-y-0", activeLayout.cardPadding)}>
        <div className="flex items-start justify-between gap-2">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold leading-none tracking-tight",
                `line-clamp-${truncationConfig.titleLines}`,
                activeLayout.titleSize
              )}>
                {displayTitle.toLowerCase()}
              </h3>

              {/* Badges List */}
              {normalizedData.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {normalizedData.badges.map((badge: any, index) => {
                    const BadgeEl = (
                      <Badge
                        key={index}
                        variant={badge.variant || 'outline'}
                        className={cn(
                          "text-[10px] px-1.5 h-5 font-normal border-transparent bg-secondary/50 text-secondary-foreground hover:bg-secondary/70",
                          badge.color // Allow custom color override if really needed, but try to rely on variant
                        )}
                      >
                        {badge.icon && <span className="mr-1">{badge.icon}</span>}
                        {badge.label}
                      </Badge>
                    );

                    return BadgeEl;
                  })}
                </div>
              )}

              {/* Phonetic Badge */}
              {showPhonetic && normalizedData.phonetic && (
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                  {normalizedData.phonetic}
                </span>
              )}


            </div>
            {/* POS Badge */}
            {isWordOrPhrase && (
              (analysis.analysisType === 'word' && analysis.pos) ||
              (analysis.analysisType === 'phrase' && analysis.partOfSpeech)
            ) && (
                <span className="text-xs text-muted-foreground font-mono">
                  {(analysis.analysisType === 'word' ? analysis.pos : analysis.partOfSpeech)?.toLowerCase()}
                </span>
              )}
            {/* Subtitle / Translation */}
            {normalizedData.subtitle && (
              <p className={cn(
                "text-sm text-muted-foreground mt-4",
                `line-clamp-${truncationConfig.subtitleLines}`
              )}>
                {normalizedData.subtitle.toLowerCase()}
              </p>
            )}
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {isWordOrPhrase && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePronounce(normalizedData.title);
                }}
              >
                <Volume2 className="h-4 w-4" />
                <span className="sr-only">Phát âm</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Thêm</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onAnalyze?.(analysis)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Phân tích chi tiết
                </DropdownMenuItem>
                {normalizedData.phonetic && (
                  <DropdownMenuItem onClick={() => handlePronounce(normalizedData.title)}>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Phát âm
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemove?.(analysis.analysisId, analysis.analysisType)}
                  className="text-destructive focus:text-destructive"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xóa khỏi danh sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default AnalysisItemCard;