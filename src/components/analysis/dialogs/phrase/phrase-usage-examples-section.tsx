import React, { useState } from 'react';
import { Copy, Check, Link, Lightbulb, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface ExampleItem {
  text: string;
  translation?: string;
  context?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

interface PhraseUsageExamplesSectionProps {
  usageExamples?: string[] | ExampleItem[];
  usageTips?: string[];
  onAnalyzeExample?: (example: string | ExampleItem) => void;
  onCopy?: (text: string, type: string) => void;
  className?: string;
  showCopyButton?: boolean;
  maxExamples?: number;
  defaultExpanded?: boolean;
}

/**
 * Phrase Usage Examples Section Component
 * Hiển thị các ví dụ sử dụng cụm từ và mẹo sử dụng
 */
export const PhraseUsageExamplesSection: React.FC<PhraseUsageExamplesSectionProps> = ({
  usageExamples,
  usageTips,
  onAnalyzeExample,
  onCopy,
  className,
  showCopyButton = true,
  maxExamples,
  defaultExpanded = true,
}) => {
  const [expandedExamples, setExpandedExamples] = useState<Record<number, boolean>>({});
  const [expandedTips, setExpandedTips] = useState(defaultExpanded);
  const [copiedExample, setCopiedExample] = useState<number | null>(null);
  const [copiedTip, setCopiedTip] = useState<number | null>(null);

  // Normalize examples to ExampleItem format
  const normalizedExamples: ExampleItem[] = (usageExamples || []).map(example => {
    if (typeof example === 'string') {
      return { text: example };
    }
    return example;
  });

  // Limit examples if maxExamples is specified
  const displayExamples = maxExamples ? normalizedExamples.slice(0, maxExamples) : normalizedExamples;
  const hasMoreExamples = maxExamples && normalizedExamples.length > maxExamples;

  const toggleExampleExpansion = (index: number) => {
    setExpandedExamples(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyExample = async (example: ExampleItem, index: number) => {
    try {
      const textToCopy = example.context 
        ? `${example.text}\n\nNgữ cảnh: ${example.context}`
        : example.text;
      
      await navigator.clipboard.writeText(textToCopy);
      setCopiedExample(index);
      onCopy?.(textToCopy, 'example');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedExample(null), 2000);
    } catch (error) {
      console.error('Failed to copy example:', error);
    }
  };

  const handleCopyTip = async (tip: string, index: number) => {
    try {
      await navigator.clipboard.writeText(tip);
      setCopiedTip(index);
      onCopy?.(tip, 'tip');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedTip(null), 2000);
    } catch (error) {
      console.error('Failed to copy tip:', error);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return '';
    }
  };

  if (!usageExamples?.length && !usageTips?.length) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="usage-examples-section">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link className="h-5 w-5" />
          Ví dụ sử dụng
          {usageExamples?.length && (
            <Badge variant="secondary" className="text-xs">
              {usageExamples.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Examples */}
        {displayExamples.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ví dụ thực tế:</h4>
            
            {displayExamples.map((example, index) => (
              <div 
                key={index} 
                className="p-4 bg-muted/30 rounded-lg border border-muted/50"
                data-testid={`example-${index}`}
              >
                <div className="space-y-2">
                  {/* Example text with metadata */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed flex-1">
                      {example.text}
                    </p>
                    
                    {example.difficulty && (
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs shrink-0', getDifficultyColor(example.difficulty))}
                      >
                        {getDifficultyLabel(example.difficulty)}
                      </Badge>
                    )}
                  </div>

                  {/* Translation if available */}
                  {example.translation && (
                    <p className="text-sm text-muted-foreground italic">
                      {example.translation}
                    </p>
                  )}

                  {/* Context (expandable) */}
                  {example.context && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExampleExpansion(index)}
                        className="h-6 px-2 text-xs font-medium flex items-center gap-1"
                        aria-expanded={expandedExamples[index]}
                        aria-controls={`example-context-${index}`}
                      >
                        Ngữ cảnh
                        {expandedExamples[index] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {expandedExamples[index] && (
                        <div 
                          id={`example-context-${index}`}
                          className="text-xs text-muted-foreground bg-muted/50 p-2 rounded"
                        >
                          {example.context}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags if available */}
                  {example.tags && example.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {example.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    {onAnalyzeExample && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAnalyzeExample(example)}
                        className="h-7 px-2 text-xs"
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Phân tích
                      </Button>
                    )}
                    
                    {showCopyButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyExample(example, index)}
                        className="h-7 px-2 text-xs"
                        aria-label="Sao chép ví dụ"
                      >
                        {copiedExample === index ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Show more examples button */}
            {hasMoreExamples && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // This would typically trigger showing more examples
                    console.log('Show more examples');
                  }}
                >
                  Xem thêm {normalizedExamples.length - maxExamples} ví dụ
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Usage Tips */}
        {usageTips && usageTips.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedTips(!expandedTips)}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedTips}
              aria-controls="usage-tips-content"
            >
              <Lightbulb className="h-4 w-4" />
              Mẹo sử dụng ({usageTips.length})
              {expandedTips ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedTips && (
              <div id="usage-tips-content" className="space-y-2">
                {usageTips.map((tip, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded"
                    data-testid={`tip-${index}`}
                  >
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{tip}</p>
                      
                      {showCopyButton && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyTip(tip, index)}
                          className="h-6 px-2 mt-2 text-xs"
                          aria-label="Sao chép mẹo"
                        >
                          {copiedTip === index ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhraseUsageExamplesSection;