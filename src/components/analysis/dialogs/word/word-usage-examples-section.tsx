import React, { useState, useCallback } from 'react';
import { BookOpen, ExternalLink, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface ExampleItem {
  sentence: string;
  translation?: string;
  id?: string;
}

interface WordUsageExamplesSectionProps {
  examples?: ExampleItem[] | string;
  exampleTranslation?: string;
  onAnalyzeExample?: (sentence: string) => void;
  onCopy?: (text: string) => void;
  className?: string;
  showCopyButton?: boolean;
  showAnalyzeButton?: boolean;
  maxExamples?: number;
  compact?: boolean;
}

/**
 * Word Usage Examples Section Component
 * Hiển thị các ví dụ sử dụng từ với khả năng phân tích và sao chép
 */
export const WordUsageExamplesSection: React.FC<WordUsageExamplesSectionProps> = ({
  examples,
  exampleTranslation,
  onAnalyzeExample,
  onCopy,
  className,
  showCopyButton = true,
  showAnalyzeButton = true,
  maxExamples = 5,
  compact = false,
}) => {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Handle both string and array examples
  const processedExamples = React.useMemo(() => {
    if (!examples) return [];
    
    if (typeof examples === 'string') {
      // Handle legacy string format
      return [{ sentence: examples, translation: exampleTranslation }];
    }
    
    // Handle array format
    return examples.slice(0, expanded ? undefined : maxExamples);
  }, [examples, exampleTranslation, expanded, maxExamples]);

  const hasMoreExamples = typeof examples === 'object' && examples.length > maxExamples;

  const handleCopy = useCallback(async (text: string, exampleId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExample(exampleId);
      
      // Call external copy handler if provided
      if (onCopy) {
        onCopy(text);
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedExample(null), 2000);
    } catch (error) {
      console.error('Failed to copy example:', error);
    }
  }, [onCopy]);

  const handleAnalyzeExample = useCallback((sentence: string) => {
    if (onAnalyzeExample) {
      onAnalyzeExample(sentence);
    }
  }, [onAnalyzeExample]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  if (processedExamples.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          Ví dụ sử dụng
          {!compact && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({processedExamples.length}{hasMoreExamples && `+${(examples as ExampleItem[]).length - maxExamples}`})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('space-y-4', compact && 'space-y-3')}>
        {processedExamples.map((example, index) => {
          const exampleId = example.id || `example-${index}`;
          const exampleText = example.sentence;
          const translationText = example.translation;
          
          return (
            <article 
              key={exampleId} 
              className="p-3 bg-muted/50 rounded-lg border border-border/50"
              aria-labelledby={`example-heading-${exampleId}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 
                  id={`example-heading-${exampleId}`}
                  className="text-sm font-medium sr-only"
                >
                  Ví dụ {index + 1}
                </h3>
                <div className="flex items-center gap-1">
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(exampleText, exampleId)}
                      className="h-6 px-2 text-xs"
                      aria-label={`Sao chép ví dụ ${index + 1}`}
                      title="Sao chép ví dụ"
                    >
                      {copiedExample === exampleId ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p 
                  className="text-sm leading-relaxed text-foreground"
                  lang="en"
                >
                  {exampleText}
                </p>
                
                {translationText && (
                  <p 
                    className="text-sm text-muted-foreground italic"
                    lang="vi"
                  >
                    {translationText}
                  </p>
                )}
              </div>
              
              {showAnalyzeButton && onAnalyzeExample && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyzeExample(exampleText)}
                    className="w-full"
                    aria-label={`Phân tích câu ví dụ ${index + 1}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Phân tích câu ví dụ
                  </Button>
                </div>
              )}
            </article>
          );
        })}
        
        {/* Show more/less button */}
        {hasMoreExamples && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="w-full"
              aria-expanded={expanded}
              aria-controls="examples-list"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Xem thêm {(examples as ExampleItem[]).length - maxExamples} ví dụ
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Copy all examples button */}
        {showCopyButton && processedExamples.length > 1 && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allExamplesText = processedExamples
                  .map((example, index) => {
                    let text = `${index + 1}. ${example.sentence}`;
                    if (example.translation) {
                      text += `\n   ${example.translation}`;
                    }
                    return text;
                  })
                  .join('\n\n');
                
                handleCopy(allExamplesText, 'all-examples');
              }}
              className="w-full"
              aria-label="Sao chép tất cả ví dụ"
            >
              {copiedExample === 'all-examples' ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Đã sao chép tất cả
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép tất cả ví dụ
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordUsageExamplesSection;