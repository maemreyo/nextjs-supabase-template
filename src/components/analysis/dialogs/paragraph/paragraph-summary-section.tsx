import React, { useState, useCallback } from 'react';
import { Sparkles, RefreshCw, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface ParagraphSummarySectionProps {
  betterVersion?: string;
  gapAnalysis?: string;
  onSummarize?: (paragraph: string) => void;
  onCopy?: (text: string) => void;
  paragraph?: string;
  className?: string;
}

/**
 * Paragraph Summary Section Component
 * Displays summary information including improved version and gap analysis
 */
export const ParagraphSummarySection: React.FC<ParagraphSummarySectionProps> = ({
  betterVersion,
  gapAnalysis,
  onSummarize,
  onCopy,
  paragraph,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  
  // Use provided paragraph or a default for summarization
  const paragraphForSummary = paragraph || "This is a sample paragraph for summarization";

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

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="paragraph-summary-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Tóm tắt & Cải tiến
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {betterVersion && (
          <div data-testid="paragraph-better-version">
            <h4 className="font-medium text-sm mb-2">Phiên bản cải tiến:</h4>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm leading-relaxed">{betterVersion}</p>
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(betterVersion)}
                  className="mt-2 h-8 px-2"
                  aria-label="Sao chép phiên bản cải tiến"
                  data-testid="paragraph-copy-better-version-btn"
                >
                  <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {gapAnalysis && (
          <div data-testid="paragraph-gap-analysis">
            <h4 className="font-medium text-sm mb-2">Phân tích khoảng trống:</h4>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm leading-relaxed">{gapAnalysis}</p>
            </div>
          </div>
        )}
        
        {onSummarize && (
          <Button
            variant="outline"
            onClick={() => onSummarize(paragraphForSummary)}
            className="w-full mt-2"
            aria-label="Tóm tắt lại đoạn văn"
            data-testid="paragraph-summarize-btn"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Tóm tắt lại
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ParagraphSummarySection;