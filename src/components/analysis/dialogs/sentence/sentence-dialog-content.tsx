import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Copy,
  Info
} from 'lucide-react';
import { SentenceAnalysis } from '../../types/analysis-types';
import {
  SentenceDialogContentProps,
  SentenceContextSectionProps,
} from './sentence-dialog-types';
import { SentencePrimaryInformationDisplayCard } from './sentence-primary-information-display-card';
import { SentencePronunciationAudioPlayer } from './sentence-pronunciation-audio-player';
import { SentenceGrammarAnalysisSection } from './sentence-grammar-analysis-section';
import { SentenceMainIdeaBreakdownSection } from './sentence-main-idea-breakdown-section';
import { SentenceUsageExamplesSection } from './sentence-usage-examples-section';
import { SentenceRelatedSentencesSection } from './sentence-related-sentences-section';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';

/**
 * Main Sentence Dialog Content Component
 */
export const SentenceDialogContent: React.FC<SentenceDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedSentence,
  onBreakdownClause,
  showPronunciation = true,
  showContext = true,
  compact = false,
  className,
}) => {
  const { state, actions } = useDialogState('sentence');
  const loading = state.dialogState.loading;

  // Clear loading state when data is available
  useEffect(() => {
    try {
      if (analysis && loading) {
        actions.setLoading(false);
      }
    } catch (error) {
      console.error('Error clearing loading state in SentenceDialogContent:', error);
      // Fallback: try to clear loading state after a short delay
      setTimeout(() => {
        try {
          actions.setLoading(false);
        } catch (fallbackError) {
          console.error('Fallback error clearing loading state:', fallbackError);
        }
      }, 100);
    }
  }, [analysis, loading, actions]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    context: false,
    structure: true,
    grammar: false,
    examples: false,
  });
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [hoveredClause, setHoveredClause] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleCopy = useCallback(async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const hasContent = useMemo(() => ({
    hasContext: !!(analysis.paragraphContext || analysis.relationToPrevious),
    hasStructure: !!(analysis.subject || analysis.mainVerb || analysis.object || analysis.clauses),
    hasGrammar: !!(analysis.function || analysis.complexityLevel || analysis.sentiment || analysis.subtext),
    hasExamples: !!(analysis.clauses && Object.keys(analysis.clauses).length > 0),
  }), [analysis]);

  return (
    <div className={cn('space-y-4', className)}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        
        .clause-highlight {
          transition: all 0.2s ease-in-out;
        }
        
        .clause-highlight:hover {
          background-color: hsl(var(--primary) / 0.1);
          border-radius: 4px;
          padding: 2px 4px;
          cursor: pointer;
        }
      `}</style>

      {/* Main Sentence Information */}
      <div className="space-y-3">
        <SentencePrimaryInformationDisplayCard
          analysis={analysis}
          className="w-full"
        />
        {showPronunciation && (
          <div className="flex justify-end">
            <SentencePronunciationAudioPlayer
              sentence={analysis.sentence}
              onPronounce={onPronounce}
            />
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="translation" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="translation">Bản dịch</TabsTrigger>
          <TabsTrigger value="structure">Cấu trúc</TabsTrigger>
          <TabsTrigger value="grammar">Ngữ pháp</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="examples">Ví dụ</TabsTrigger>
        </TabsList>

        <TabsContent value="translation" className="space-y-4 mt-4 animate-fadeIn">
          <SentenceMainIdeaBreakdownSection
            naturalTranslation={analysis.naturalTranslation}
            literalTranslation={analysis.literalTranslation}
            mainIdea={analysis.mainIdea}
            onCopy={(text) => handleCopy(text, 'translation')}
            copied={copiedSection === 'translation'}
          />
        </TabsContent>

        <TabsContent value="structure" className="mt-4 animate-fadeIn">
          <SentenceRelatedSentencesSection
            subject={analysis.subject}
            mainVerb={analysis.mainVerb}
            object={analysis.object}
            clauses={analysis.clauses}
            sentenceType={analysis.sentenceType}
            onClauseClick={onBreakdownClause}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-4 animate-fadeIn">
          <SentenceGrammarAnalysisSection
            function={analysis.function}
            complexityLevel={analysis.complexityLevel}
            sentiment={analysis.sentiment}
            subtext={analysis.subtext}
            sentence={analysis.sentence}
            onAnalyzeGrammar={() => onAnalyzeRelatedSentence?.(analysis.sentence)}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <SentenceContextSection
            paragraphContext={analysis.paragraphContext}
            relationToPrevious={analysis.relationToPrevious}
            onCopy={(text) => handleCopy(text, 'context')}
            copied={copiedSection === 'context'}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <SentenceUsageExamplesSection
            examples={analysis.clauses ? Object.values(analysis.clauses) : []}
            onAnalyzeExample={onAnalyzeRelatedSentence}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Context Section Component
 */
export const SentenceContextSection: React.FC<SentenceContextSectionProps> = ({
  paragraphContext,
  relationToPrevious,
  onCopy,
  copied,
  className,
}) => {
  const [showFullParagraph, setShowFullParagraph] = useState(false);

  if (!paragraphContext && !relationToPrevious) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Ngữ cảnh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {relationToPrevious && (
          <div>
            <h4 className="font-medium text-sm mb-2">Liên kết với câu trước:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{relationToPrevious}</p>
            </div>
          </div>
        )}
        
        {paragraphContext && (
          <div>
            <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">
                {showFullParagraph
                  ? paragraphContext
                  : `${paragraphContext.substring(0, 200)}${paragraphContext.length > 200 ? '...' : ''}`
                }
              </p>
              {paragraphContext.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullParagraph(!showFullParagraph)}
                  className="mt-2 h-8 px-2"
                >
                  {showFullParagraph ? 'Thu gọn' : 'Xem thêm'}
                </Button>
              )}
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(paragraphContext)}
                  className="mt-2 h-8 px-2 ml-2"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceDialogContent;