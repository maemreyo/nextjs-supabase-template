import React from 'react';
import { GitBranch, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Progress } from '../../../ui/progress';
import { cn } from '@/lib/utils';

interface ParagraphStructureAnalysisSectionProps {
  tone?: string;
  targetAudience?: string;
  type?: string;
  vocabularyLevel?: string;
  flowScore?: number;
  logicScore?: number;
  sentenceVariety?: string;
  onAnalyzeStructure?: (paragraph: string) => void;
  paragraph?: string;
  className?: string;
}

/**
 * Paragraph Structure Analysis Section Component
 * Displays structure analysis information including tone, audience, type, vocabulary level, and quality scores
 */
export const ParagraphStructureAnalysisSection: React.FC<ParagraphStructureAnalysisSectionProps> = ({
  tone,
  targetAudience,
  type,
  vocabularyLevel,
  flowScore,
  logicScore,
  sentenceVariety,
  onAnalyzeStructure,
  paragraph,
  className,
}) => {
  // Use provided paragraph or a default for analysis
  const paragraphForAnalysis = paragraph || "This is a sample paragraph for structure analysis";

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-structure-analysis-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" aria-hidden="true" />
          Phân tích cấu trúc
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tone && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-tone">
              <h4 className="font-medium text-sm mb-1 text-primary">Giọng văn:</h4>
              <p className="text-sm leading-relaxed">{tone}</p>
            </div>
          )}
          
          {targetAudience && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-target-audience">
              <h4 className="font-medium text-sm mb-1 text-primary">Đối tượng mục tiêu:</h4>
              <p className="text-sm leading-relaxed">{targetAudience}</p>
            </div>
          )}
          
          {type && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-type">
              <h4 className="font-medium text-sm mb-1 text-primary">Loại văn bản:</h4>
              <Badge variant="outline">{type}</Badge>
            </div>
          )}
          
          {vocabularyLevel && (
            <div className="p-3 bg-muted/30 rounded-lg" data-testid="paragraph-vocab-level">
              <h4 className="font-medium text-sm mb-1 text-primary">Trình độ từ vựng:</h4>
              <Badge variant="outline">{vocabularyLevel}</Badge>
            </div>
          )}
        </div>

        {(flowScore !== undefined || logicScore !== undefined) && (
          <div className="space-y-3" data-testid="paragraph-quality-scores">
            <h4 className="font-medium text-sm">Điểm số chất lượng:</h4>
            
            {flowScore !== undefined && (
              <div className="space-y-2" data-testid="paragraph-flow-score">
                <div className="flex justify-between text-sm">
                  <span>Luồng văn:</span>
                  <span className="font-medium">{flowScore}/10</span>
                </div>
                <Progress 
                  value={flowScore * 10} 
                  className="h-2" 
                  aria-label={`Điểm luồng văn: ${flowScore} trên 10`}
                />
              </div>
            )}
            
            {logicScore !== undefined && (
              <div className="space-y-2" data-testid="paragraph-logic-score">
                <div className="flex justify-between text-sm">
                  <span>Tính logic:</span>
                  <span className="font-medium">{logicScore}/10</span>
                </div>
                <Progress 
                  value={logicScore * 10} 
                  className="h-2" 
                  aria-label={`Điểm tính logic: ${logicScore} trên 10`}
                />
              </div>
            )}
          </div>
        )}
        
        {sentenceVariety && (
          <div data-testid="paragraph-sentence-variety">
            <h4 className="font-medium text-sm mb-1">Đa dạng câu:</h4>
            <p className="text-sm leading-relaxed">{sentenceVariety}</p>
          </div>
        )}
        
        {onAnalyzeStructure && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeStructure(paragraphForAnalysis)}
            className="w-full mt-2"
            aria-label="Phân tích cấu trúc chi tiết"
            data-testid="paragraph-analyze-structure-btn"
          >
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            Phân tích cấu trúc chi tiết
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphStructureAnalysisSection;