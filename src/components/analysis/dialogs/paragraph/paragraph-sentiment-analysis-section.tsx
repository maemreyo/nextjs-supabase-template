import React from 'react';
import { BarChart3, Brain } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { cn } from '@/lib/utils';

interface ParagraphSentimentAnalysisSectionProps {
  sentimentLabel?: string;
  sentimentIntensity?: number;
  sentimentJustification?: string;
  onAnalyzeSentiment?: (paragraph: string) => void;
  paragraph?: string;
  className?: string;
}

/**
 * Paragraph Sentiment Analysis Section Component
 * Displays sentiment analysis information including label, intensity, and justification
 */
export const ParagraphSentimentAnalysisSection: React.FC<ParagraphSentimentAnalysisSectionProps> = ({
  sentimentLabel,
  sentimentIntensity,
  sentimentJustification,
  onAnalyzeSentiment,
  paragraph,
  className,
}) => {
  // Use provided paragraph or a default for analysis
  const paragraphForAnalysis = paragraph || "This is a sample paragraph for sentiment analysis";
  
  const getSentimentColor = (label?: string) => {
    if (!label) return 'secondary';
    if (label.includes('tích cực') || label.includes('positiv')) return 'default';
    if (label.includes('tiêu cực') || label.includes('negativ')) return 'destructive';
    return 'secondary';
  };

  const getIntensityColor = (intensity?: number) => {
    if (!intensity) return 'bg-muted';
    if (intensity >= 0.7) return 'bg-green-500';
    if (intensity >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-sentiment-analysis-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Phân tích cảm xúc
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sentimentLabel && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-sentiment-label">
              <h4 className="font-medium text-sm mb-1">Nhãn cảm xúc:</h4>
              <Badge variant={getSentimentColor(sentimentLabel)}>
                {sentimentLabel}
              </Badge>
            </div>
          )}
          
          {sentimentIntensity !== undefined && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-sentiment-intensity">
              <h4 className="font-medium text-sm mb-1">Mức độ cảm xúc:</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Progress 
                    value={sentimentIntensity * 100} 
                    className="h-2" 
                    aria-label={`Mức độ cảm xúc: ${(sentimentIntensity * 100).toFixed(0)}%`}
                  />
                </div>
                <span className="text-sm font-medium">{(sentimentIntensity * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
        
        {sentimentJustification && (
          <div data-testid="paragraph-sentiment-justification">
            <h4 className="font-medium text-sm mb-2">Giải thích cảm xúc:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{sentimentJustification}</p>
            </div>
          </div>
        )}
        
        {onAnalyzeSentiment && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeSentiment(paragraphForAnalysis)}
            className="w-full mt-2"
            aria-label="Phân tích cảm xúc chi tiết"
            data-testid="paragraph-analyze-sentiment-btn"
          >
            <Brain className="h-4 w-4 mr-2" aria-hidden="true" />
            Phân tích cảm xúc chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphSentimentAnalysisSection;