import React, { useState, useCallback } from 'react';
import { Volume2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { ParagraphAnalysis } from '../../types/analysis-types';
import { Card, CardHeader, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface ParagraphPrimaryInformationDisplayCardProps {
  analysis: ParagraphAnalysis;
  onPronounce?: (paragraph: string) => void;
  showPronunciation?: boolean;
  className?: string;
}

/**
 * Paragraph Primary Information Display Card Component
 * Displays the main paragraph information with pronunciation and basic metadata
 */
export const ParagraphPrimaryInformationDisplayCard: React.FC<ParagraphPrimaryInformationDisplayCardProps> = ({
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
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-primary-info-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-primary" data-paragraph-highlight>
              {analysis.paragraph.substring(0, 100)}{analysis.paragraph.length > 100 ? '...' : ''}
            </div>
            <div className="flex items-center gap-2">
              {analysis.type && (
                <Badge variant="secondary" className="text-xs" data-testid="paragraph-type-badge">
                  {analysis.type}
                </Badge>
              )}
              {analysis.vocabularyLevel && (
                <Badge variant="outline" className="text-xs" data-testid="paragraph-vocab-level-badge">
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
                data-testid="paragraph-pronounce-btn"
              >
                <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-muted-foreground">
          <p className="leading-relaxed" data-testid="paragraph-content">
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
              aria-label={showFullParagraph ? "Thu gọn đoạn văn" : "Xem thêm đoạn văn"}
              data-testid="paragraph-toggle-btn"
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
          <div className="mt-3 text-sm italic text-muted-foreground" data-testid="paragraph-main-topic">
            <Target className="h-4 w-4 inline mr-2" aria-hidden="true" />
            Chủ đề chính: {analysis.mainTopic}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphPrimaryInformationDisplayCard;