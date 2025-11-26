import React, { useState, useCallback } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface WordDefinitionAndContextMeaningListProps {
  definition?: string;
  translation?: string;
  contextMeaning?: string;
  onCopy?: (text: string) => void;
  className?: string;
  showCopyButton?: boolean;
  compact?: boolean;
}

/**
 * Word Definition and Context Meaning List Component
 * Hiển thị định nghĩa, bản dịch và nghĩa trong ngữ cảnh của từ
 */
export const WordDefinitionAndContextMeaningList: React.FC<WordDefinitionAndContextMeaningListProps> = ({
  definition,
  translation,
  contextMeaning,
  onCopy,
  className,
  showCopyButton = true,
  compact = false,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      
      // Call external copy handler if provided
      if (onCopy) {
        onCopy(text);
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [onCopy]);

  const hasContent = !!(definition || translation || contextMeaning);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          Định nghĩa
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('space-y-4', compact && 'space-y-3')}>
        {definition && (
          <section aria-labelledby="definition-heading">
            <div className="flex items-center justify-between mb-2">
              <h3 
                id="definition-heading" 
                className="font-medium text-sm"
              >
                Định nghĩa:
              </h3>
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(definition, 'definition')}
                  className="h-6 px-2 text-xs"
                  aria-label="Sao chép định nghĩa"
                  title="Sao chép định nghĩa"
                >
                  {copiedSection === 'definition' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <p 
              className="text-sm leading-relaxed text-foreground"
              role="definition"
              aria-describedby="definition-heading"
            >
              {definition}
            </p>
          </section>
        )}

        {translation && (
          <section aria-labelledby="translation-heading">
            <div className="flex items-center justify-between mb-2">
              <h3 
                id="translation-heading" 
                className="font-medium text-sm"
              >
                Bản dịch:
              </h3>
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(translation, 'translation')}
                  className="h-6 px-2 text-xs"
                  aria-label="Sao chép bản dịch"
                  title="Sao chép bản dịch"
                >
                  {copiedSection === 'translation' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <p 
              className="text-sm leading-relaxed text-muted-foreground"
              role="definition"
              aria-describedby="translation-heading"
            >
              {translation}
            </p>
          </section>
        )}

        {contextMeaning && (
          <section aria-labelledby="context-meaning-heading">
            <div className="flex items-center justify-between mb-2">
              <h3 
                id="context-meaning-heading" 
                className="font-medium text-sm"
              >
                Nghĩa trong ngữ cảnh:
              </h3>
              {showCopyButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(contextMeaning, 'context-meaning')}
                  className="h-6 px-2 text-xs"
                  aria-label="Sao chép nghĩa trong ngữ cảnh"
                  title="Sao chép nghĩa trong ngữ cảnh"
                >
                  {copiedSection === 'context-meaning' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            <p 
              className="text-sm leading-relaxed text-foreground bg-muted/30 p-3 rounded-md"
              role="definition"
              aria-describedby="context-meaning-heading"
            >
              {contextMeaning}
            </p>
          </section>
        )}

        {/* Copy all button */}
        {showCopyButton && (definition || translation || contextMeaning) && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allText = [
                  definition && `Định nghĩa: ${definition}`,
                  translation && `Bản dịch: ${translation}`,
                  contextMeaning && `Nghĩa trong ngữ cảnh: ${contextMeaning}`
                ].filter(Boolean).join('\n\n');
                
                handleCopy(allText, 'all');
              }}
              className="w-full"
              aria-label="Sao chép tất cả định nghĩa"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Đã sao chép
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép tất cả
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordDefinitionAndContextMeaningList;