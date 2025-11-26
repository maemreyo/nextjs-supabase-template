import React from 'react';
import { Lightbulb } from 'lucide-react';
import { SentenceAnalysis } from '../../types/analysis-types';
import { Card, CardHeader, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface SentencePrimaryInformationDisplayCardProps {
  analysis: SentenceAnalysis;
  className?: string;
}

/**
 * Sentence Primary Information Display Card Component
 * Hiển thị thông tin chính của câu: sentence, translation, mainIdea
 */
export const SentencePrimaryInformationDisplayCard: React.FC<SentencePrimaryInformationDisplayCardProps> = ({
  analysis,
  className,
}) => {
  return (
    <Card 
      className={cn('border-none shadow-sm', className)}
      data-sentence-highlight
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg font-bold text-primary leading-relaxed" role="heading" aria-level={2}>
              {analysis.sentence}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0" role="group" aria-label="Thông tin câu">
              {analysis.sentenceType && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  aria-label={`Loại câu: ${analysis.sentenceType}`}
                >
                  {analysis.sentenceType}
                </Badge>
              )}
              {analysis.complexityLevel && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  aria-label={`Độ phức tạp: ${analysis.complexityLevel}`}
                >
                  {analysis.complexityLevel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {analysis.mainIdea && (
          <div 
            className="text-sm text-muted-foreground italic flex items-start gap-2" 
            role="definition"
            aria-label={`Ý chính: ${analysis.mainIdea}`}
          >
            <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{analysis.mainIdea}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentencePrimaryInformationDisplayCard;