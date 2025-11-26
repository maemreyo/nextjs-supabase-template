import React from 'react';
import { Volume2 } from 'lucide-react';
import { PhraseAnalysis } from '../../types/analysis-types';
import { Card, CardHeader, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface PhrasePrimaryInformationDisplayCardProps {
  analysis: PhraseAnalysis;
  onPronounce?: (phrase: string) => void;
  showPronunciation?: boolean;
  className?: string;
}

/**
 * Phrase Primary Information Display Card Component
 * Hiển thị thông tin chính của cụm từ: phrase, naturalTranslation, literalMeaning
 */
export const PhrasePrimaryInformationDisplayCard: React.FC<PhrasePrimaryInformationDisplayCardProps> = ({
  analysis,
  onPronounce,
  showPronunciation = true,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="phrase-primary-info-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 
              className="text-2xl font-bold text-primary" 
              data-phrase-highlight
              id="phrase-title"
            >
              {analysis.phrase}
            </h2>
            <div className="flex items-center gap-2" aria-label="Phân loại cụm từ">
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
                aria-label={`Phát âm ${analysis.phrase}`}
                data-testid="pronounce-button"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {analysis.vietnameseTranslation && (
          <div className="text-lg text-muted-foreground" data-testid="vietnamese-translation">
            {analysis.vietnameseTranslation}
          </div>
        )}
        {analysis.naturalTranslation && (
          <div className="text-md text-muted-foreground" data-testid="natural-translation">
            {analysis.naturalTranslation}
          </div>
        )}
        {analysis.literalMeaning && (
          <div className="text-sm text-muted-foreground italic" data-testid="literal-meaning">
            {analysis.literalMeaning}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhrasePrimaryInformationDisplayCard;