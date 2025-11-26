import React, { useState, useCallback } from 'react';
import { Info, Search, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface ParagraphContextSectionProps {
  paragraphContext?: string;
  relatedParagraphs?: string[];
  onAnalyzeRelatedParagraph?: (paragraph: string) => void;
  onCopy?: (text: string) => void;
  className?: string;
}

/**
 * Paragraph Context Section Component
 * Displays context information and related paragraphs
 */
export const ParagraphContextSection: React.FC<ParagraphContextSectionProps> = ({
  paragraphContext,
  relatedParagraphs = [],
  onAnalyzeRelatedParagraph,
  onCopy,
  className,
}) => {
  const [showFullContext, setShowFullContext] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use provided paragraph context or a default for analysis
  const paragraphForAnalysis = paragraphContext || "This is a sample paragraph for analysis";

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [onCopy]);

  if (!paragraphContext) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-context-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          Ngữ cảnh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div data-testid="paragraph-context-content">
          <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed">
              {showFullContext
                ? paragraphContext
                : `${paragraphContext.substring(0, 200)}${paragraphContext.length > 200 ? '...' : ''}`
              }
            </p>
            {paragraphContext.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullContext(!showFullContext)}
                className="mt-2 h-8 px-2"
                aria-label={showFullContext ? "Thu gọn ngữ cảnh" : "Xem thêm ngữ cảnh"}
                data-testid="paragraph-toggle-context-btn"
              >
                {showFullContext ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" aria-hidden="true" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" aria-hidden="true" />
                    Xem thêm
                  </>
                )}
              </Button>
            )}
            {onCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(paragraphContext)}
                className="mt-2 h-8 px-2 ml-2"
                aria-label="Sao chép ngữ cảnh"
                data-testid="paragraph-copy-context-btn"
              >
                <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </Button>
            )}
          </div>
        </div>
        
        {relatedParagraphs.length > 0 && (
          <div data-testid="paragraph-related-paragraphs">
            <h4 className="font-medium text-sm mb-2">Đoạn văn liên quan:</h4>
            <div className="space-y-2">
              {relatedParagraphs.map((relatedParagraph, index) => (
                <div 
                  key={index} 
                  className="p-2 bg-muted/20 rounded text-sm"
                  data-testid={`paragraph-related-${index}`}
                >
                  {relatedParagraph.substring(0, 100)}{relatedParagraph.length > 100 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {onAnalyzeRelatedParagraph && (
          <Button
            variant="outline"
            onClick={() => onAnalyzeRelatedParagraph(paragraphForAnalysis)}
            className="w-full mt-2"
            aria-label="Phân tích đoạn văn liên quan"
            data-testid="paragraph-analyze-related-btn"
          >
            <Search className="h-4 w-4 mr-2" aria-hidden="true" />
            Phân tích đoạn văn liên quan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphContextSection;