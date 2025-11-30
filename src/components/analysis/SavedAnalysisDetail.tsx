import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  Trash2, 
  Calendar,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { useSavedAnalysisDetail } from '@/hooks/useSavedAnalysisDetail';
import { useDeleteAnalysis } from '@/hooks/useDeleteAnalysis';
import { WordAnalysisDisplay } from './WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from './SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from './ParagraphAnalysisDisplay';
import { PhraseAnalysisView } from './PhraseAnalysisView';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

interface SavedAnalysisDetailProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string | null;
  analysisType?: 'word' | 'sentence' | 'paragraph' | 'phrase';
  onDeleteSuccess?: () => void;
}

/**
 * Component hiển thị chi tiết đầy đủ của một phân tích đã lưu
 * Tùy chỉnh hiển thị theo từng type (word/sentence/paragraph)
 */
export function SavedAnalysisDetail({ 
  isOpen, 
  onClose, 
  analysisId, 
  onDeleteSuccess 
}: SavedAnalysisDetailProps) {
  // Extract analysis type from ID if it has a prefix
  let analysisType: 'word' | 'sentence' | 'paragraph' | 'phrase' | undefined;
  if (analysisId) {
    if (analysisId.startsWith('phrase_')) {
      analysisType = 'phrase';
    } else if (analysisId.startsWith('sentence_')) {
      analysisType = 'sentence';
    } else if (analysisId.startsWith('paragraph_')) {
      analysisType = 'paragraph';
    } else {
      analysisType = 'word';
    }
  }

  const { analysis, isLoading, isError, error } = useSavedAnalysisDetail(
    analysisId,
    {
      enabled: isOpen && !!analysisId,
      analysisType
    }
  );
  
  const { deleteAnalysis, isLoading: isDeleting } = useDeleteAnalysis({
    onSuccess: () => {
      onClose();
      onDeleteSuccess?.();
    }
  });

  const handleDelete = () => {
    if (analysisId) {
      deleteAnalysis(analysisId);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'word':
        return <BookOpen className="h-4 w-4" />;
      case 'sentence':
        return <FileText className="h-4 w-4" />;
      case 'paragraph':
        return <FilePlus className="h-4 w-4" />;
      case 'phrase':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'word':
        return 'Phân tích từ';
      case 'sentence':
        return 'Phân tích câu';
      case 'paragraph':
        return 'Phân tích đoạn văn';
      case 'phrase':
        return 'Phân tích cụm từ';
      default:
        return 'Phân tích';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'word':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'sentence':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'paragraph':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'phrase':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Transform database data to display format
  const transformAnalysisData = () => {
    if (!analysis) return null;

    // Transform word analysis
    if (analysis.analysis_type === 'word') {
      const wordAnalysis: WordAnalysis = {
        meta: {
          word: analysis.word,
          pos: analysis.part_of_speech,
          cefr: analysis.cefr_level,
          tone: analysis.tone,
          ipa: analysis.ipa_pronunciation
        },
        definitions: {
          root_meaning: analysis.root_meaning,
          context_meaning: analysis.context_meaning,
          vietnamese_translation: analysis.vietnamese_translation
        },
        inference_strategy: {
          clues: analysis.inference_clues,
          reasoning: analysis.inference_reasoning
        },
        relations: {
          synonyms: analysis.word_synonyms?.map((s: any) => s.synonym_word) || [],
          antonyms: analysis.word_antonyms?.map((a: any) => a.antonym_word) || []
        },
        usage: {
          example_sentence: analysis.example_sentence || '',
          example_translation: analysis.example_translation || '',
          collocations: analysis.word_collocations?.map((c: any) => ({
            phrase: c.collocation_phrase,
            meaning: c.meaning,
            frequency_level: c.frequency_level
          })) || []
        }
      };
      return wordAnalysis;
    }

    // Transform phrase analysis
    if (analysis.analysis_type === 'phrase') {
      const phraseAnalysis: PhraseAnalysis = {
        meta: {
          phrase: analysis.phrase,
          ipa: analysis.ipa_pronunciation,
          pos: analysis.part_of_speech,
          type: analysis.phrase_type,
          cefr: analysis.cefr_level,
          tone: analysis.tone,
          register: analysis.register
        },
        definitions: {
          literal_meaning: analysis.literal_meaning,
          figurative_meaning: analysis.figurative_meaning,
          vietnamese_translation: analysis.vietnamese_translation,
          usage_notes: analysis.usage_notes
        },
        components: {
          words: analysis.phrase_components?.map((c: any) => ({
            word: c.word,
            ipa: c.ipa_pronunciation,
            meaning: c.meaning,
            role: c.role
          })) || []
        },
        grammar_and_structure: {
          pattern: analysis.grammar_pattern,
          variations: analysis.phrase_variations?.map((v: any) => ({
            phrase: v.variation_phrase,
            meaning: v.meaning,
            usage_example: v.usage_example
          })) || []
        },
        usage: {
          collocations: analysis.phrase_collocations?.map((c: any) => ({
            phrase: c.collocation_phrase,
            meaning: c.meaning,
            usage_example: c.usage_example,
            frequency_level: c.frequency_level
          })) || [],
          example_sentences: analysis.phrase_examples?.map((e: any) => ({
            sentence: e.example_sentence,
            translation: e.translation,
            context: e.context
          })) || []
        },
        pragmatics_and_culture: {
          formality_level: analysis.formality_level,
          register_appropriateness: analysis.register_appropriateness,
          cultural_notes: analysis.cultural_notes,
          common_mistakes: analysis.common_mistakes?.map((m: any) => ({
            mistake: m.mistake,
            correction: m.correction,
            explanation: m.explanation
          })) || []
        },
        learning_aids: {
          memory_tips: analysis.memory_tips,
          pronunciation_tips: analysis.pronunciation_tips,
          practice_suggestions: analysis.practice_suggestions?.map((s: any) => ({
            exercise: s.exercise,
            instruction: s.instruction
          })) || []
        }
      };
      return phraseAnalysis;
    }

    // Transform sentence analysis
    if (analysis.analysis_type === 'sentence') {
      const sentenceAnalysis: SentenceAnalysis = {
        meta: {
          sentence: analysis.sentence,
          complexity_level: analysis.complexity_level,
          sentence_type: analysis.sentence_type
        },
        semantics: {
          main_idea: analysis.main_idea,
          subtext: analysis.subtext,
          sentiment: analysis.sentiment
        },
        grammar_breakdown: {
          subject: analysis.subject,
          main_verb: analysis.main_verb,
          object: analysis.object,
          clauses: analysis.clauses || []
        },
        contextual_role: {
          function: analysis.contextual_function,
          relation_to_previous: analysis.relation_to_previous
        },
        key_components: analysis.sentence_key_components?.map((k: any) => ({
          phrase: k.phrase,
          type: k.component_type,
          meaning: k.meaning,
          significance: k.significance
        })) || [],
        rewrite_suggestions: analysis.sentence_rewrite_suggestions?.map((r: any) => ({
          original: r.original_phrase,
          suggestion: r.suggested_phrase,
          reason: r.reason,
          improvement_type: r.improvement_type
        })) || [],
        translation: {
          literal: analysis.literal_translation,
          natural: analysis.natural_translation
        }
      };
      return sentenceAnalysis;
    }

    // Transform paragraph analysis
    if (analysis.analysis_type === 'paragraph') {
      const paragraphAnalysis: ParagraphAnalysis = {
        meta: {
          type: analysis.paragraph_type,
          tone: analysis.tone,
          target_audience: analysis.target_audience
        },
        content_analysis: {
          main_topic: analysis.main_topic,
          sentiment: {
            label: analysis.sentiment_label,
            intensity: analysis.sentiment_intensity,
            justification: analysis.sentiment_justification
          },
          keywords: analysis.keywords || []
        },
        structure_breakdown: analysis.paragraph_structure_breakdown?.map((s: any) => ({
          sentence_index: s.sentence_index,
          snippet: s.snippet,
          role: s.role,
          analysis: s.analysis
        })) || [],
        coherence_and_cohesion: {
          logic_score: analysis.logic_score,
          flow_score: analysis.flow_score,
          transition_words: analysis.transition_words || [],
          gap_analysis: analysis.gap_analysis
        },
        stylistic_evaluation: {
          vocabulary_level: analysis.vocabulary_level,
          sentence_variety: analysis.sentence_variety
        },
        constructive_feedback: {
          critiques: analysis.paragraph_constructive_feedback?.map((f: any) => ({
            issue_type: f.issue_type,
            description: f.description,
            suggestion: f.suggestion
          })) || [],
          better_version: analysis.better_version || ''
        }
      };
      return paragraphAnalysis;
    }

    return null;
  };

  const transformedData = transformAnalysisData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" size="large">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-semibold">
                {analysis ? getTypeLabel(analysis.analysis_type) : 'Đang tải...'}
              </DialogTitle>
              {analysis && (
                <Badge 
                  variant="outline" 
                  className={`${getTypeColor(analysis.analysis_type)} flex items-center gap-1`}
                >
                  {getIconForType(analysis.analysis_type)}
                  {analysis.analysis_type}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {analysis && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(analysis.created_at)}
              </div>
              
              {analysis.session_id && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Session: {analysis.session_id.substring(0, 8)}...
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
          
          {isError && (
            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error ? error.message : 'Lỗi khi tải chi tiết phân tích'}
              </AlertDescription>
            </Alert>
          )}
          
          {analysis && transformedData && (
            <div className="space-y-6">
              {analysis.analysis_type === 'word' && (
                <WordAnalysisDisplay analysis={transformedData as WordAnalysis} />
              )}
              
              {analysis.analysis_type === 'phrase' && (
                <PhraseAnalysisView data={transformedData as PhraseAnalysis} />
              )}
              
              {analysis.analysis_type === 'sentence' && (
                <SentenceAnalysisDisplay analysis={transformedData as SentenceAnalysis} />
              )}
              
              {analysis.analysis_type === 'paragraph' && (
                <ParagraphAnalysisDisplay analysis={transformedData as ParagraphAnalysis} />
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SavedAnalysisDetail;