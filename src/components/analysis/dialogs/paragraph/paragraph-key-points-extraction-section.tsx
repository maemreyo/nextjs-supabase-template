import React, { useState, useCallback } from 'react';
import { Star, Hash, Search, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface ParagraphKeyPointsExtractionSectionProps {
  keywords?: string[];
  transitionWords?: string[];
  onAnalyzeKeywords?: (keywords: string[]) => void;
  onCopy?: (text: string) => void;
  className?: string;
}

/**
 * Paragraph Key Points Extraction Section Component
 * Displays key points information including keywords and transition words
 */
export const ParagraphKeyPointsExtractionSection: React.FC<ParagraphKeyPointsExtractionSectionProps> = ({
  keywords = [],
  transitionWords = [],
  onAnalyzeKeywords,
  onCopy,
  className,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleKeywordClick = useCallback((keyword: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  }, []);

  const handleAnalyzeKeywords = useCallback(() => {
    if (selectedKeywords.length > 0) {
      onAnalyzeKeywords?.(selectedKeywords);
    }
  }, [selectedKeywords, onAnalyzeKeywords]);

  const handleCopyAllKeywords = useCallback(async () => {
    if (keywords.length > 0) {
      try {
        await navigator.clipboard.writeText(keywords.join(', '));
        setCopied(true);
        onCopy?.(keywords.join(', '));
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
      }
    }
  }, [keywords, onCopy]);

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-key-points-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5" aria-hidden="true" />
          Điểm chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {keywords.length > 0 && (
          <div data-testid="paragraph-keywords">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Từ khóa quan trọng:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAllKeywords}
                className="h-8 px-2"
                aria-label="Sao chép tất cả từ khóa"
                data-testid="paragraph-copy-all-keywords-btn"
              >
                <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                {copied ? 'Đã sao chép' : 'Sao chép tất cả'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                  className="cursor-pointer keyword-highlight"
                  onClick={() => handleKeywordClick(keyword)}
                  aria-label={`Từ khóa: ${keyword}`}
                  data-testid={`paragraph-keyword-${index}`}
                >
                  <Hash className="h-3 w-3 mr-1" aria-hidden="true" />
                  {keyword}
                </Badge>
              ))}
            </div>
            {selectedKeywords.length > 0 && (
              <Button
                variant="outline"
                onClick={handleAnalyzeKeywords}
                className="mt-3"
                aria-label={`Phân tích ${selectedKeywords.length} từ khóa đã chọn`}
                data-testid="paragraph-analyze-selected-keywords-btn"
              >
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                Phân tích từ khóa đã chọn ({selectedKeywords.length})
              </Button>
            )}
          </div>
        )}
        
        {transitionWords.length > 0 && (
          <div data-testid="paragraph-transition-words">
            <h4 className="font-medium text-sm mb-2">Từ chuyển tiếp:</h4>
            <div className="flex flex-wrap gap-2">
              {transitionWords.map((word, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs"
                  aria-label={`Từ chuyển tiếp: ${word}`}
                  data-testid={`paragraph-transition-word-${index}`}
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphKeyPointsExtractionSection;