import React from 'react';
import { Volume2 } from 'lucide-react';
import { WordAnalysis } from '../../types/analysis-types';
import { Card, CardHeader, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface WordPrimaryInformationDisplayCardProps {
  analysis: WordAnalysis;
  onPronounce?: (word: string) => void;
  showPhonetic?: boolean;
  className?: string;
}

/**
 * Word Primary Information Display Card Component
 * Hiển thị thông tin chính của từ: word, translation, phonetic, POS
 */
export const WordPrimaryInformationDisplayCard: React.FC<WordPrimaryInformationDisplayCardProps> = ({
  analysis,
  onPronounce,
  showPhonetic = true,
  className,
}) => {
  const handlePronounce = () => {
    onPronounce?.(analysis.word);
  };

  return (
    <Card 
      className={cn('border-none shadow-sm', className)}
      data-word-highlight
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-primary" role="heading" aria-level={2}>
              {analysis.word}
            </h2>
            <div className="flex items-center gap-2" role="group" aria-label="Thông tin từ loại">
              {analysis.pos && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  aria-label={`Loại từ: ${analysis.pos}`}
                >
                  {analysis.pos}
                </Badge>
              )}
              {analysis.cefr && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  aria-label={`Trình độ CEFR: ${analysis.cefr}`}
                >
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
                onClick={handlePronounce}
                className="h-8 px-2"
                aria-label={`Phát âm từ ${analysis.word}`}
                title="Phát âm"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showPhonetic && analysis.ipa && (
          <div className="mb-3" role="group" aria-label="Phiên âm">
            <span className="text-sm text-muted-foreground font-mono" aria-label="Phiên âm IPA">
              {analysis.ipa}
            </span>
          </div>
        )}
        {analysis.translation && (
          <div 
            className="text-lg text-muted-foreground" 
            role="definition"
            aria-label={`Bản dịch: ${analysis.translation}`}
          >
            {analysis.translation}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordPrimaryInformationDisplayCard;