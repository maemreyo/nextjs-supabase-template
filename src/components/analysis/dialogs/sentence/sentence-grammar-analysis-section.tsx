import React from 'react';
import { Brain, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface SentenceGrammarAnalysisSectionProps {
  function?: string;
  complexityLevel?: string;
  sentiment?: string;
  subtext?: string;
  sentence?: string;
  onAnalyzeGrammar?: (sentence: string) => void;
  className?: string;
}

/**
 * Sentence Grammar Analysis Section Component
 * Hiển thị phân tích ngữ pháp của câu: function, complexity, sentiment, subtext
 */
export const SentenceGrammarAnalysisSection: React.FC<SentenceGrammarAnalysisSectionProps> = ({
  function: sentenceFunction,
  complexityLevel,
  sentiment,
  subtext,
  sentence,
  onAnalyzeGrammar,
  className,
}) => {
  // Get sentence from parent component or use a default
  const sentenceForAnalysis = sentence || "This is a sample sentence for grammar analysis";
  
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Phân tích ngữ pháp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sentenceFunction && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Chức năng:</h4>
              <p className="text-sm leading-relaxed">{sentenceFunction}</p>
            </div>
          )}
          
          {complexityLevel && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Độ phức tạp:</h4>
              <Badge variant="outline">{complexityLevel}</Badge>
            </div>
          )}
          
          {sentiment && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Sắc thái:</h4>
              <Badge 
                variant={sentiment.includes('tích cực') ? 'default' : 
                        sentiment.includes('tiêu cực') ? 'destructive' : 'secondary'}
              >
                {sentiment}
              </Badge>
            </div>
          )}
        </div>
        
        {subtext && (
          <div>
            <h4 className="font-medium text-sm mb-1">Ý ngầm:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed italic">{subtext}</p>
            </div>
          </div>
        )}
        
        {onAnalyzeGrammar && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeGrammar(sentenceForAnalysis)}
            className="w-full mt-2"
            aria-label="Phân tích ngữ pháp chi tiết"
          >
            <Settings className="h-4 w-4 mr-2" />
            Phân tích ngữ pháp chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceGrammarAnalysisSection;