import React, { useState, useCallback } from 'react';
import { Network, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface RelatedTerm {
  word: string;
  type?: 'synonym' | 'antonym' | 'related';
  definition?: string;
  frequency?: number;
}

interface WordSynonymsAntonymsRelatedTermsSectionProps {
  synonyms?: string[] | RelatedTerm[];
  antonyms?: string[] | RelatedTerm[];
  relatedTerms?: string[] | RelatedTerm[];
  onWordClick?: (word: string) => void;
  onCopy?: (text: string) => void;
  className?: string;
  showCopyButton?: boolean;
  showAnalyzeButton?: boolean;
  maxItems?: number;
  compact?: boolean;
}

/**
 * Word Synonyms Antonyms Related Terms Section Component
 * Hiển thị từ đồng nghĩa, trái nghĩa và các từ liên quan
 */
export const WordSynonymsAntonymsRelatedTermsSection: React.FC<WordSynonymsAntonymsRelatedTermsSectionProps> = ({
  synonyms,
  antonyms,
  relatedTerms,
  onWordClick,
  onCopy,
  className,
  showCopyButton = true,
  showAnalyzeButton = true,
  maxItems = 10,
  compact = false,
}) => {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Normalize terms to RelatedTerm format
  const normalizeTerms = useCallback((terms: string[] | RelatedTerm[] | undefined, type: 'synonym' | 'antonym' | 'related'): RelatedTerm[] => {
    if (!terms) return [];
    
    return terms.slice(0, maxItems).map(term => {
      if (typeof term === 'string') {
        return { word: term, type };
      }
      return { ...term, type };
    });
  }, [maxItems]);

  const normalizedSynonyms = normalizeTerms(synonyms, 'synonym');
  const normalizedAntonyms = normalizeTerms(antonyms, 'antonym');
  const normalizedRelated = normalizeTerms(relatedTerms, 'related');

  const hasContent = !!(normalizedSynonyms.length || normalizedAntonyms.length || normalizedRelated.length);

  const handleWordClick = useCallback((word: string) => {
    if (onWordClick) {
      onWordClick(word);
    }
  }, [onWordClick]);

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

  const renderTermList = useCallback((terms: RelatedTerm[], type: 'synonym' | 'antonym' | 'related') => {
    if (terms.length === 0) return null;

    const typeConfig = {
      synonym: {
        label: 'Đồng nghĩa',
        variant: 'secondary' as const,
        bgClass: 'bg-blue-50/50 dark:bg-blue-900/20',
      },
      antonym: {
        label: 'Trái nghĩa',
        variant: 'outline' as const,
        bgClass: 'bg-red-50/50 dark:bg-red-900/20',
      },
      related: {
        label: 'Liên quan',
        variant: 'default' as const,
        bgClass: 'bg-green-50/50 dark:bg-green-900/20',
      },
    };

    const config = typeConfig[type];
    const sectionId = `${type}-section`;

    return (
      <section 
        key={type}
        className={cn('space-y-3', config.bgClass, 'p-3 rounded-lg')}
        aria-labelledby={sectionId}
      >
        <div className="flex items-center justify-between">
          <h3 
            id={sectionId}
            className="font-medium text-sm"
          >
            {config.label}:
          </h3>
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const termsText = terms.map(t => t.word).join(', ');
                handleCopy(termsText, type);
              }}
              className="h-6 px-2 text-xs"
              aria-label={`Sao chép tất cả ${config.label.toLowerCase()}`}
              title={`Sao chép tất cả ${config.label.toLowerCase()}`}
            >
              {copiedSection === type ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2" role="list">
          {terms.map((term, index) => {
            const termId = `${type}-${index}`;
            const isHovered = hoveredWord === term.word;
            
            return (
              <div
                key={termId}
                className="relative group"
                role="listitem"
              >
                <Badge
                  variant={config.variant}
                  className={cn(
                    "cursor-pointer hover:opacity-80 transition-all duration-200",
                    "px-3 py-1 text-sm",
                    isHovered && "ring-2 ring-offset-2 ring-primary scale-105",
                    term.frequency && term.frequency > 0.8 && "font-semibold"
                  )}
                  onClick={() => handleWordClick(term.word)}
                  onMouseEnter={() => setHoveredWord(term.word)}
                  onMouseLeave={() => setHoveredWord(null)}
                  aria-label={`${config.label}: ${term.word}`}
                  title={term.definition || `${config.label}: ${term.word}`}
                >
                  {term.word}
                  {term.frequency && (
                    <span className="ml-1 text-xs opacity-60">
                      {Math.round(term.frequency * 100)}%
                    </span>
                  )}
                </Badge>
                
                {/* Tooltip for additional info */}
                {term.definition && isHovered && (
                  <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-popover border border-border rounded-md shadow-lg text-xs max-w-xs">
                    <div className="font-medium mb-1">{term.word}</div>
                    <div className="text-muted-foreground">{term.definition}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {showAnalyzeButton && onWordClick && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => terms[0] && handleWordClick(terms[0].word)}
              className="h-7 px-2 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Phân tích {config.label.toLowerCase()}
            </Button>
          </div>
        )}
      </section>
    );
  }, [hoveredWord, showCopyButton, showAnalyzeButton, onWordClick, handleCopy, copiedSection]);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm transition-all duration-300 hover:shadow-md', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Network className="h-5 w-5" aria-hidden="true" />
          Từ liên quan
          {!compact && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({normalizedSynonyms.length + normalizedAntonyms.length + normalizedRelated.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('space-y-4', compact && 'space-y-3')}>
        {renderTermList(normalizedSynonyms, 'synonym')}
        {renderTermList(normalizedAntonyms, 'antonym')}
        {renderTermList(normalizedRelated, 'related')}
        
        {/* Copy all terms button */}
        {showCopyButton && hasContent && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allTerms = [
                  ...(normalizedSynonyms.length ? [`Đồng nghĩa: ${normalizedSynonyms.map(t => t.word).join(', ')}`] : []),
                  ...(normalizedAntonyms.length ? [`Trái nghĩa: ${normalizedAntonyms.map(t => t.word).join(', ')}`] : []),
                  ...(normalizedRelated.length ? [`Liên quan: ${normalizedRelated.map(t => t.word).join(', ')}`] : []),
                ].join('\n');
                
                handleCopy(allTerms, 'all-terms');
              }}
              className="w-full"
              aria-label="Sao chép tất cả từ liên quan"
            >
              {copiedSection === 'all-terms' ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Đã sao chép tất cả
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Sao chép tất cả từ liên quan
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WordSynonymsAntonymsRelatedTermsSection;