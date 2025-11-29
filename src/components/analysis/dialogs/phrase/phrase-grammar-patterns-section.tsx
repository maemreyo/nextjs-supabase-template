import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, BookOpen, Code, Lightbulb } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { cn } from '@/lib/utils';

interface GrammarPattern {
  id: string;
  pattern: string;
  description: string;
  examples?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  frequency?: number;
  tags?: string[];
}

interface GrammarRule {
  id: string;
  title: string;
  description: string;
  examples?: string[];
  exceptions?: string[];
  relatedPatterns?: string[];
}

interface PhraseGrammarPatternsSectionProps {
  grammaticalPattern?: string;
  grammarPatterns?: GrammarPattern[];
  grammarRules?: GrammarRule[];
  partOfSpeech?: string;
  phraseType?: string;
  complexityLevel?: string;
  frequencyLevel?: string;
  onCopy?: (text: string, type: string) => void;
  onPatternClick?: (pattern: GrammarPattern) => void;
  className?: string;
  showCopyButton?: boolean;
  defaultExpanded?: boolean;
  showDifficulty?: boolean;
  showFrequency?: boolean;
}

/**
 * Phrase Grammar Patterns Section Component
 * Hiển thị các mẫu ngữ pháp, quy tắc ngữ pháp và thông tin liên quan
 */
export const PhraseGrammarPatternsSection: React.FC<PhraseGrammarPatternsSectionProps> = ({
  grammaticalPattern,
  grammarPatterns,
  grammarRules,
  partOfSpeech,
  phraseType,
  complexityLevel,
  frequencyLevel,
  onCopy,
  onPatternClick,
  className,
  showCopyButton = true,
  defaultExpanded = true,
  showDifficulty = true,
  showFrequency = true,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: defaultExpanded,
    patterns: false,
    rules: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('patterns');

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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung bình';
      case 'advanced': return 'Nâng cao';
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

  const hasBasicInfo = !!(grammaticalPattern || partOfSpeech || phraseType || complexityLevel || frequencyLevel);
  const hasPatterns = !!(grammarPatterns && grammarPatterns.length > 0);
  const hasRules = !!(grammarRules && grammarRules.length > 0);

  if (!hasBasicInfo && !hasPatterns && !hasRules) {
    return null;
  }

  return (
    <Card className={cn('border-none shadow-sm', className)} data-testid="grammar-patterns-section">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="h-5 w-5" />
          Mẫu ngữ pháp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Grammar Information */}
        {hasBasicInfo && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('basic')}
              className="h-8 px-2 font-medium text-sm flex items-center gap-2 w-full justify-start"
              aria-expanded={expandedSections.basic}
              aria-controls="basic-grammar-content"
            >
              <BookOpen className="h-4 w-4" />
              Thông tin ngữ pháp cơ bản
              {expandedSections.basic ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            
            {expandedSections.basic && (
              <div id="basic-grammar-content" className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partOfSpeech && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Loại từ:</h4>
                      <Badge variant="secondary">{partOfSpeech}</Badge>
                    </div>
                  )}
                  
                  {phraseType && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Loại cụm từ:</h4>
                      <Badge variant="outline">{phraseType}</Badge>
                    </div>
                  )}
                  
                  {complexityLevel && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Mức độ phức tạp:</h4>
                      <Badge variant="outline">{complexityLevel}</Badge>
                    </div>
                  )}
                  
                  {frequencyLevel && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Mức độ tần suất:</h4>
                      <Badge variant="outline">{frequencyLevel}</Badge>
                    </div>
                  )}
                </div>
                
                {grammaticalPattern && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Mẫu ngữ pháp:</h4>
                      {showCopyButton && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(grammaticalPattern, 'pattern')}
                          className="h-6 px-2"
                          aria-label="Sao chép mẫu ngữ pháp"
                        >
                          {copiedSection === 'pattern' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg font-mono text-sm border-l-4 border-blue-300">
                      {grammaticalPattern}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grammar Patterns and Rules */}
        {(hasPatterns || hasRules) && (
          <div className="space-y-3 border-t pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patterns" disabled={!hasPatterns}>
                  Mẫu ngữ pháp {hasPatterns && `(${grammarPatterns?.length})`}
                </TabsTrigger>
                <TabsTrigger value="rules" disabled={!hasRules}>
                  Quy tắc ngữ pháp {hasRules && `(${grammarRules?.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="patterns" className="space-y-3 mt-4">
                {grammarPatterns?.map((pattern, index) => (
                  <div 
                    key={pattern.id}
                    className="p-4 bg-muted/30 rounded-lg border border-muted/50"
                    data-testid={`grammar-pattern-${index}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">{pattern.pattern}</h4>
                            
                            {showDifficulty && pattern.difficulty && (
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', getDifficultyColor(pattern.difficulty))}
                              >
                                {getDifficultyLabel(pattern.difficulty)}
                              </Badge>
                            )}
                            
                            {showFrequency && pattern.frequency && (
                              <span 
                                className={cn(
                                  "px-1 py-0.5 rounded text-xs",
                                  getFrequencyColor(pattern.frequency)
                                )}
                              >
                                {pattern.frequency}%
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{pattern.description}</p>
                        </div>
                        
                        {showCopyButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(`${pattern.pattern}: ${pattern.description}`, `pattern-${index}`)}
                            className="h-7 px-2 shrink-0"
                            aria-label="Sao chép mẫu ngữ pháp"
                          >
                            {copiedSection === `pattern-${index}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {pattern.tags && pattern.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pattern.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {pattern.examples && pattern.examples.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Ví dụ:</h5>
                          <div className="space-y-1">
                            {pattern.examples.map((example, exampleIndex) => (
                              <div 
                                key={exampleIndex}
                                className="text-xs bg-background p-2 rounded border-l-2 border-muted"
                              >
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {onPatternClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPatternClick(pattern)}
                          className="h-7 px-2 text-xs"
                        >
                          <Code className="h-3 w-3 mr-1" />
                          Xem chi tiết
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="rules" className="space-y-3 mt-4">
                {grammarRules?.map((rule, index) => (
                  <div 
                    key={rule.id}
                    className="p-4 bg-muted/30 rounded-lg border border-muted/50"
                    data-testid={`grammar-rule-${index}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-2">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                        
                        {showCopyButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(`${rule.title}: ${rule.description}`, `rule-${index}`)}
                            className="h-7 px-2 shrink-0"
                            aria-label="Sao chép quy tắc ngữ pháp"
                          >
                            {copiedSection === `rule-${index}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {rule.examples && rule.examples.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Ví dụ:</h5>
                          <div className="space-y-1">
                            {rule.examples.map((example, exampleIndex) => (
                              <div 
                                key={exampleIndex}
                                className="text-xs bg-background p-2 rounded border-l-2 border-blue-300"
                              >
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rule.exceptions && rule.exceptions.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            Ngoại lệ:
                          </h5>
                          <div className="space-y-1">
                            {rule.exceptions.map((exception, exceptionIndex) => (
                              <div 
                                key={exceptionIndex}
                                className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-300"
                              >
                                {exception}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rule.relatedPatterns && rule.relatedPatterns.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Mẫu liên quan:</h5>
                          <div className="flex flex-wrap gap-1">
                            {rule.relatedPatterns.map((relatedPattern, patternIndex) => (
                              <Badge key={patternIndex} variant="outline" className="text-xs">
                                {relatedPattern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhraseGrammarPatternsSection;