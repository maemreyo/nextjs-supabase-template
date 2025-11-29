import React, { useState } from 'react';
import { BookOpen, Copy, Check, ChevronDown, ChevronUp, Lightbulb, MessageCircle } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface PhraseContextualMeaningAnalysisSectionProps {
  naturalTranslation?: string;
  literalMeaning?: string;
  contextualMeaning?: string;
  vietnameseTranslation?: string;
  culturalNotes?: string;
  stylisticNotes?: string;
  memoryAid?: string;
  onCopy?: (text: string, type: string) => void;
  className?: string;
  showCopyButton?: boolean;
  defaultExpanded?: boolean;
}

/**
 * Phrase Contextual Meaning Analysis Section Component
 * Hiển thị phân tích chi tiết về nghĩa của cụm từ: nghĩa đen, nghĩa trong ngữ cảnh, bản dịch
 */
export const PhraseContextualMeaningAnalysisSection: React.FC<PhraseContextualMeaningAnalysisSectionProps> = ({
  naturalTranslation,
  literalMeaning,
  contextualMeaning,
  vietnameseTranslation,
  culturalNotes,
  stylisticNotes,
  memoryAid,
  onCopy,
  className,
  showCopyButton = true,
  defaultExpanded = true,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: defaultExpanded,
    cultural: false,
    stylistic: false,
    memory: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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

  const hasBasicContent = !!(naturalTranslation || literalMeaning || contextualMeaning || vietnameseTranslation);
  const hasAdditionalContent = !!(culturalNotes || stylisticNotes || memoryAid);

  if (!hasBasicContent && !hasAdditionalContent) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="contextual-meaning-section">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Phân tích nghĩa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Meaning Analysis */}
        {hasBasicContent && (
          <div className="space-y-3">
            {naturalTranslation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Bản dịch tự nhiên:</h4>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(naturalTranslation, 'natural')}
                      className="h-6 px-2"
                      aria-label="Sao chép bản dịch tự nhiên"
                    >
                      {copiedSection === 'natural' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed bg-blue-50 p-3 rounded-md border-l-4 border-blue-300">
                  {naturalTranslation}
                </p>
              </div>
            )}

            {literalMeaning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Nghĩa đen:</h4>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(literalMeaning, 'literal')}
                      className="h-6 px-2"
                      aria-label="Sao chép nghĩa đen"
                    >
                      {copiedSection === 'literal' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-md border-l-4 border-gray-300 italic">
                  {literalMeaning}
                </p>
              </div>
            )}

            {contextualMeaning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Nghĩa trong ngữ cảnh:</h4>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(contextualMeaning, 'contextual')}
                      className="h-6 px-2"
                      aria-label="Sao chép nghĩa trong ngữ cảnh"
                    >
                      {copiedSection === 'contextual' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed bg-green-50 p-3 rounded-md border-l-4 border-green-300">
                  {contextualMeaning}
                </p>
              </div>
            )}

            {vietnameseTranslation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Bản dịch tiếng Việt:</h4>
                  {showCopyButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(vietnameseTranslation, 'vietnamese')}
                      className="h-6 px-2"
                      aria-label="Sao chép bản dịch tiếng Việt"
                    >
                      {copiedSection === 'vietnamese' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm leading-relaxed bg-purple-50 p-3 rounded-md border-l-4 border-purple-300">
                  {vietnameseTranslation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Additional Information */}
        {hasAdditionalContent && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Thông tin bổ sung
              </Badge>
            </div>

            {memoryAid && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('memory')}
                  className="h-8 px-2 font-medium text-sm flex items-center gap-2"
                  aria-expanded={expandedSections.memory}
                  aria-controls="memory-aid-content"
                >
                  <Lightbulb className="h-4 w-4" />
                  Mẹo ghi nhớ
                  {expandedSections.memory ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
                {expandedSections.memory && (
                  <div 
                    id="memory-aid-content"
                    className="text-sm leading-relaxed bg-yellow-50 border-l-4 border-yellow-300 p-3 rounded"
                  >
                    {memoryAid}
                  </div>
                )}
              </div>
            )}

            {culturalNotes && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('cultural')}
                  className="h-8 px-2 font-medium text-sm flex items-center gap-2"
                  aria-expanded={expandedSections.cultural}
                  aria-controls="cultural-notes-content"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ghi chú văn hóa
                  {expandedSections.cultural ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
                {expandedSections.cultural && (
                  <div 
                    id="cultural-notes-content"
                    className="text-sm leading-relaxed bg-blue-50 border-l-4 border-blue-300 p-3 rounded"
                  >
                    {culturalNotes}
                  </div>
                )}
              </div>
            )}

            {stylisticNotes && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('stylistic')}
                  className="h-8 px-2 font-medium text-sm flex items-center gap-2"
                  aria-expanded={expandedSections.stylistic}
                  aria-controls="stylistic-notes-content"
                >
                  <BookOpen className="h-4 w-4" />
                  Ghi chú phong cách
                  {expandedSections.stylistic ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
                {expandedSections.stylistic && (
                  <div 
                    id="stylistic-notes-content"
                    className="text-sm leading-relaxed bg-purple-50 border-l-4 border-purple-300 p-3 rounded"
                  >
                    {stylisticNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhraseContextualMeaningAnalysisSection;