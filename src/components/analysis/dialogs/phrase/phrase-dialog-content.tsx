import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Volume2, BookOpen, Copy, ChevronDown, ChevronUp, Languages, Lightbulb, Link, Book, MessageCircle } from 'lucide-react';
import { PhraseAnalysis } from '../../types/analysis-types';
import {
  PhraseDialogContentProps,
  PhraseInfoSectionProps,
  PhrasePronunciationSectionProps,
  PhraseMeaningSectionProps,
  PhraseExamplesSectionProps,
  PhraseRelatedWordsSectionProps,
  PhraseContextSectionProps,
  PhraseAdditionalInfoSectionProps
} from './phrase-dialog-types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { cn } from '@/lib/utils';
import { useDialogState } from '../hooks/use-dialog-state';

// Import new modular components
import { PhrasePrimaryInformationDisplayCard } from './phrase-primary-information-display-card';
import { PhrasePronunciationAudioPlayer } from './phrase-pronunciation-audio-player';
import { PhraseContextualMeaningAnalysisSection } from './phrase-contextual-meaning-analysis-section';
import { PhraseUsageExamplesSection } from './phrase-usage-examples-section';
import { PhraseRelatedPhrasesSection } from './phrase-related-phrases-section';
import { PhraseGrammarPatternsSection } from './phrase-grammar-patterns-section';

/**
 * Main Phrase Dialog Content Component
 */
export const PhraseDialogContent: React.FC<PhraseDialogContentProps> = ({
  analysis,
  onPronounce,
  onAnalyzeRelatedPhrase,
  showPronunciation = true,
  showContext = true,
  className,
}) => {
  const { state, actions } = useDialogState('phrase');
  const loading = state.dialogState.loading;

  // Clear loading state when data is available
  useEffect(() => {
    try {
      if (analysis && loading) {
        actions.setLoading(false);
      }
    } catch (error) {
      console.error('Error clearing loading state in PhraseDialogContent:', error);
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
    examples: true,
    related: false,
  });
  const [hoveredPhrase, setHoveredPhrase] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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
    hasContext: !!(analysis.sentenceContext || analysis.paragraphContext),
    hasExamples: !!(analysis.usageExamples && analysis.usageExamples.length > 0),
    hasRelated: !!(analysis.synonyms || analysis.antonyms || analysis.variations),
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
        
        @keyframes bounce {
          0%, 20%, 53%, 80% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
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
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
      {/* Main Phrase Information */}
      <PhrasePrimaryInformationDisplayCard
        analysis={analysis}
        onPronounce={onPronounce}
        showPronunciation={showPronunciation}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="meaning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meaning">Nghĩa</TabsTrigger>
          <TabsTrigger value="examples">Ví dụ</TabsTrigger>
          <TabsTrigger value="context">Ngữ cảnh</TabsTrigger>
          <TabsTrigger value="related">Liên quan</TabsTrigger>
        </TabsList>

        <TabsContent value="meaning" className="space-y-4 mt-4 animate-fadeIn">
          <PhraseContextualMeaningAnalysisSection
            naturalTranslation={analysis.naturalTranslation}
            literalMeaning={analysis.literalMeaning}
            contextualMeaning={analysis.contextualMeaning}
            vietnameseTranslation={analysis.vietnameseTranslation}
            culturalNotes={analysis.culturalNotes}
            stylisticNotes={analysis.stylisticNotes}
            memoryAid={analysis.memoryAid}
            onCopy={(text: string, type: string) => handleCopy(text, type)}
          />
        </TabsContent>

        <TabsContent value="examples" className="mt-4 animate-fadeIn">
          <PhraseUsageExamplesSection
            usageExamples={analysis.usageExamples}
            usageTips={analysis.usageTips}
            onAnalyzeExample={(example: string | any) => onAnalyzeRelatedPhrase?.(typeof example === 'string' ? example : example.text)}
            onCopy={(text: string, type: string) => handleCopy(text, type)}
          />
        </TabsContent>

        <TabsContent value="context" className="mt-4 animate-fadeIn">
          <Card className={cn('border-none shadow-sm')}>
            <CardHeader>
              <CardTitle className="text-lg">Ngữ cảnh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.sentenceContext && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh câu:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">{analysis.sentenceContext}</p>
                  </div>
                </div>
              )}
              {analysis.paragraphContext && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Ngữ cảnh đoạn văn:</h4>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {analysis.paragraphContext}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="mt-4 animate-fadeIn">
          <div className="space-y-4">
            <PhraseRelatedPhrasesSection
              synonyms={analysis.synonyms}
              antonyms={analysis.antonyms}
              variations={analysis.variations}
              onPhraseClick={(phrase: string | any) => onAnalyzeRelatedPhrase?.(typeof phrase === 'string' ? phrase : phrase.text)}
              onCopy={(text: string, type: string) => handleCopy(text, type)}
            />
            
            <PhraseGrammarPatternsSection
              grammaticalPattern={analysis.grammaticalPattern}
              partOfSpeech={analysis.partOfSpeech}
              phraseType={analysis.phraseType}
              complexityLevel={analysis.complexityLevel}
              frequencyLevel={analysis.frequencyLevel}
              onCopy={(text: string, type: string) => handleCopy(text, type)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhraseDialogContent;