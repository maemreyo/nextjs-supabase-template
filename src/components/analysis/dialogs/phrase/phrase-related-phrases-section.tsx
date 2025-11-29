import React, { useState } from 'react';
import { Link, Copy, Check, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface RelatedPhrase {
  text: string;
  translation?: string;
  frequency?: number;
  register?: 'formal' | 'informal' | 'slang';
  context?: string;
}

interface PhraseRelatedPhrasesSectionProps {
  synonyms?: string[] | RelatedPhrase[];
  antonyms?: string[] | RelatedPhrase[];
  variations?: string[] | RelatedPhrase[];
  collocations?: string[] | RelatedPhrase[];
  onPhraseClick?: (phrase: string | RelatedPhrase) => void;
  onCopy?: (text: string, type: string) => void;
  className?: string;
  showCopyButton?: boolean;
  maxItems?: number;
  defaultExpanded?: boolean;
  showFrequency?: boolean;
  showRegister?: boolean;
}

/**
 * Phrase Related Phrases Section Component
 * Hiển thị các cụm từ liên quan: đồng nghĩa, trái nghĩa, biến thể và collocations
 */
export const PhraseRelatedPhrasesSection: React.FC<PhraseRelatedPhrasesSectionProps> = ({
  synonyms,
  antonyms,
  variations,
  collocations,
  onPhraseClick,
  onCopy,
  className,
  showCopyButton = true,
  maxItems,
  defaultExpanded = true,
  showFrequency = true,
  showRegister = true,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    synonyms: defaultExpanded,
    antonyms: false,
    variations: false,
    collocations: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [hoveredPhrase, setHoveredPhrase] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'formal' | 'informal'>('all');

  // Normalize phrases to RelatedPhrase format
  const normalizePhrases = (phrases?: string[] | RelatedPhrase[]): RelatedPhrase[] => {
    if (!phrases) return [];
    return phrases.map(phrase => {
      if (typeof phrase === 'string') {
        return { text: phrase };
      }
      return phrase;
    });
  };

  const normalizedSynonyms = normalizePhrases(synonyms);
  const normalizedAntonyms = normalizePhrases(antonyms);
  const normalizedVariations = normalizePhrases(variations);
  const normalizedCollocations = normalizePhrases(collocations);

  // Apply filters and limits
  const filterAndLimit = (phrases: RelatedPhrase[]) => {
    let filtered = phrases;
    
    if (filterMode !== 'all') {
      filtered = phrases.filter(phrase => 
        !phrase.register || phrase.register === filterMode
      );
    }
    
    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }
    
    return filtered;
  };

  const displaySynonyms = filterAndLimit(normalizedSynonyms);
  const displayAntonyms = filterAndLimit(normalizedAntonyms);
  const displayVariations = filterAndLimit(normalizedVariations);
  const displayCollocations = filterAndLimit(normalizedCollocations);

  const hasMoreSynonyms = maxItems && normalizedSynonyms.length > maxItems;
  const hasMoreAntonyms = maxItems && normalizedAntonyms.length > maxItems;
  const hasMoreVariations = maxItems && normalizedVariations.length > maxItems;
  const hasMoreCollocations = maxItems && normalizedCollocations.length > maxItems;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(type);
      onCopy?.(text, type);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
    }
  };

  const handlePhraseClick = (phrase: RelatedPhrase) => {
    onPhraseClick?.(phrase);
  };

  const getRegisterColor = (register?: string) => {
    switch (register) {
      case 'formal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'informal': return 'bg-green-100 text-green-800 border-green-200';
      case 'slang': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRegisterLabel = (register?: string) => {
    switch (register) {
      case 'formal': return 'Trang trọng';
      case 'informal': return 'Thân mật';
      case 'slang': return 'Tiếng lóng';
      default: return '';
    }
  };

  const getFrequencyColor = (frequency?: number) => {
    if (!frequency) return '';
    if (frequency >= 80) return 'bg-red-100 text-red-800';
    if (frequency >= 60) return 'bg-orange-100 text-orange-800';
    if (frequency >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const renderPhraseBadge = (phrase: RelatedPhrase, type: string, index: number) => (
    <div className="flex items-center gap-2">
      <Badge
        variant={type === 'antonyms' ? 'outline' : 'secondary'}
        className={cn(
          "cursor-pointer hover:bg-opacity-80 transition-all duration-200",
          hoveredPhrase === phrase.text && "ring-2 ring-primary ring-offset-2",
          type === 'synonyms' && "bg-blue-50 text-blue-800 border-blue-200",
          type === 'variations' && "bg-green-50 text-green-800 border-green-200",
          type === 'collocations' && "bg-purple-50 text-purple-800 border-purple-200"
        )}
        onClick={() => handlePhraseClick(phrase)}
        onMouseEnter={() => setHoveredPhrase(phrase.text)}
        onMouseLeave={() => setHoveredPhrase(null)}
        data-testid={`${type}-badge-${index}`}
      >
        {phrase.text}
        
        {/* Show frequency indicator */}
        {showFrequency && phrase.frequency && (
          <span 
            className={cn(
              "ml-1 px-1 py-0.5 rounded text-xs",
              getFrequencyColor(phrase.frequency)
            )}
          >
            {phrase.frequency}%
          </span>
        )}
        
        {/* Show register indicator */}
        {showRegister && phrase.register && (
          <span 
            className={cn(
              "ml-1 px-1 py-0.5 rounded text-xs border",
              getRegisterColor(phrase.register)
            )}
          >
            {getRegisterLabel(phrase.register)}
          </span>
        )}
      </Badge>
      
      {/* Show translation on hover */}
      {hoveredPhrase === phrase.text && phrase.translation && (
        <div className="absolute z-10 p-2 bg-background border rounded-md shadow-lg text-sm max-w-xs">
          <div className="font-medium">{phrase.text}</div>
          <div className="text-muted-foreground text-xs">{phrase.translation}</div>
          {phrase.context && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              Ngữ cảnh: {phrase.context}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const hasContent = !!(synonyms?.length || antonyms?.length || variations?.length || collocations?.length);

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="related-phrases-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="h-5 w-5" />
            Cụm từ liên quan
          </CardTitle>
          
          {(showRegister || showFrequency) && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterMode(filterMode === 'all' ? 'formal' : filterMode === 'formal' ? 'informal' : 'all')}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                {filterMode === 'all' ? 'Tất cả' : getRegisterLabel(filterMode)}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Synonyms */}
        {displaySynonyms.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('synonyms')}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedSections.synonyms}
              aria-controls="synonyms-content"
            >
              <span>Đồng nghĩa ({normalizedSynonyms.length})</span>
              {expandedSections.synonyms ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedSections.synonyms && (
              <div 
                id="synonyms-content"
                className="flex flex-wrap gap-2 relative"
              >
                {displaySynonyms.map((synonym, index) => (
                  <div key={index} className="relative">
                    {renderPhraseBadge(synonym, 'synonyms', index)}
                  </div>
                ))}
                
                {hasMoreSynonyms && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // This would typically show more synonyms
                    }}
                  >
                    +{normalizedSynonyms.length - maxItems!} nữa
                  </Button>
                )}
                
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(displaySynonyms.map(s => s.text).join(', '), 'synonyms')}
                    className="h-6 px-2 text-xs ml-auto"
                    aria-label="Sao chép tất cả đồng nghĩa"
                  >
                    {copiedSection === 'synonyms' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Antonyms */}
        {displayAntonyms.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('antonyms')}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedSections.antonyms}
              aria-controls="antonyms-content"
            >
              <span>Trái nghĩa ({normalizedAntonyms.length})</span>
              {expandedSections.antonyms ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedSections.antonyms && (
              <div 
                id="antonyms-content"
                className="flex flex-wrap gap-2 relative"
              >
                {displayAntonyms.map((antonym, index) => (
                  <div key={index} className="relative">
                    {renderPhraseBadge(antonym, 'antonyms', index)}
                  </div>
                ))}
                
                {hasMoreAntonyms && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // This would typically show more antonyms
                    }}
                  >
                    +{normalizedAntonyms.length - maxItems!} nữa
                  </Button>
                )}
                
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(displayAntonyms.map(a => a.text).join(', '), 'antonyms')}
                    className="h-6 px-2 text-xs ml-auto"
                    aria-label="Sao chép tất cả trái nghĩa"
                  >
                    {copiedSection === 'antonyms' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Variations */}
        {displayVariations.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('variations')}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedSections.variations}
              aria-controls="variations-content"
            >
              <span>Biến thể ({normalizedVariations.length})</span>
              {expandedSections.variations ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedSections.variations && (
              <div 
                id="variations-content"
                className="flex flex-wrap gap-2 relative"
              >
                {displayVariations.map((variation, index) => (
                  <div key={index} className="relative">
                    {renderPhraseBadge(variation, 'variations', index)}
                  </div>
                ))}
                
                {hasMoreVariations && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // This would typically show more variations
                    }}
                  >
                    +{normalizedVariations.length - maxItems!} nữa
                  </Button>
                )}
                
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(displayVariations.map(v => v.text).join(', '), 'variations')}
                    className="h-6 px-2 text-xs ml-auto"
                    aria-label="Sao chép tất cả biến thể"
                  >
                    {copiedSection === 'variations' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collocations */}
        {displayCollocations.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('collocations')}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedSections.collocations}
              aria-controls="collocations-content"
            >
              <span>Cụm từ đi kèm ({normalizedCollocations.length})</span>
              {expandedSections.collocations ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedSections.collocations && (
              <div 
                id="collocations-content"
                className="flex flex-wrap gap-2 relative"
              >
                {displayCollocations.map((collocation, index) => (
                  <div key={index} className="relative">
                    {renderPhraseBadge(collocation, 'collocations', index)}
                  </div>
                ))}
                
                {hasMoreCollocations && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      // This would typically show more collocations
                    }}
                  >
                    +{normalizedCollocations.length - maxItems!} nữa
                  </Button>
                )}
                
                {showCopyButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(displayCollocations.map(c => c.text).join(', '), 'collocations')}
                    className="h-6 px-2 text-xs ml-auto"
                    aria-label="Sao chép tất cả cụm từ đi kèm"
                  >
                    {copiedSection === 'collocations' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhraseRelatedPhrasesSection;