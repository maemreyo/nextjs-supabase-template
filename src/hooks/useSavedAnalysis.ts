import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client-client';
import type { WordAnalysis } from '@/lib/ai/types';

// Query keys cho saved analysis
export const savedAnalysisKeys = {
  all: ['saved-analysis'] as const,
  detail: (wordId: string, sessionId?: string) => 
    ['saved-analysis', 'detail', wordId, sessionId] as const,
  word: (word: string, sessionId?: string) => 
    ['saved-analysis', 'word', word, sessionId] as const,
};

interface SavedAnalysisResponse {
  success: boolean;
  data?: WordAnalysis;
  error?: string;
}

interface UseSavedAnalysisOptions {
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook để fetch saved analysis từ database dựa trên wordId và sessionId
 */
export function useSavedAnalysis(
  wordId?: string,
  sessionId?: string,
  options: UseSavedAnalysisOptions = {}
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options;

  return useQuery({
    queryKey: savedAnalysisKeys.detail(wordId || '', sessionId),
    queryFn: async (): Promise<WordAnalysis | null> => {
      if (!wordId) {
        return null;
      }

      console.log('🔍 [DEBUG] useSavedAnalysis - Fetching analysis', { wordId, sessionId });
      
      try {
        // Use API client with built-in authentication
        const result = await api.analyses.get(wordId);
        
        if (!result.success || !result.data) {
          console.log('🔍 [DEBUG] useSavedAnalysis - Invalid response', result);
          return null;
        }

        // Transform database format to WordAnalysis format
        const dbAnalysis = result.data as any; // Cast to any to access DB fields
        const wordAnalysis: WordAnalysis = {
          meta: {
            word: dbAnalysis.word,
            ipa: dbAnalysis.ipa || '',
            pos: dbAnalysis.pos || '',
            cefr: dbAnalysis.cefr || '',
            tone: dbAnalysis.tone || '',
          },
          definitions: {
            root_meaning: dbAnalysis.root_meaning || '',
            context_meaning: dbAnalysis.context_meaning || '',
            vietnamese_translation: dbAnalysis.vietnamese_translation || '',
          },
          usage: {
            example_sentence: dbAnalysis.example_sentence || '',
            example_translation: dbAnalysis.example_translation || '',
            collocations: dbAnalysis.word_collocations?.map((col: any) => ({
              phrase: col.phrase,
              meaning: col.meaning || '',
              usage_example: col.usage_example || '',
              frequency_level: col.frequency_level || 'common'
            })) || [],
          },
          inference_strategy: dbAnalysis.inference_clues ? {
            clues: dbAnalysis.inference_clues,
            reasoning: dbAnalysis.inference_reasoning || '',
          } : {
            clues: '',
            reasoning: ''
          },
          relations: {
            synonyms: dbAnalysis.word_synonyms?.map((syn: any) => ({
              word: syn.synonym_word,
              ipa: syn.ipa || '',
              meaning_en: syn.meaning_en || '',
              meaning_vi: syn.meaning_vi || ''
            })) || [],
            antonyms: dbAnalysis.word_antonyms?.map((ant: any) => ({
              word: ant.antonym_word,
              ipa: ant.ipa || '',
              meaning_en: ant.meaning_en || '',
              meaning_vi: ant.meaning_vi || ''
            })) || [],
          }
        };

        console.log('🔍 [DEBUG] useSavedAnalysis - Successfully fetched and transformed analysis', {
          word: wordAnalysis.meta.word,
          hasSynonyms: wordAnalysis.relations.synonyms.length > 0,
          hasAntonyms: wordAnalysis.relations.antonyms.length > 0
        });

        return wordAnalysis;
      } catch (error) {
        console.error('🔍 [DEBUG] useSavedAnalysis - Fetch failed', error);
        return null;
      }
    },
    enabled: enabled && !!wordId,
    staleTime,
    retry: 1, // Only retry once for saved analyses
    retryDelay: 1000,
  });
}

/**
 * Hook để fetch saved analysis dựa trên từ và sessionId
 * Sử dụng khi không có wordId nhưng có từ và sessionId
 */
export function useSavedAnalysisByWord(
  word?: string,
  sessionId?: string,
  options: UseSavedAnalysisOptions = {}
) {
  const { enabled = true, staleTime = 1000 * 60 * 30 } = options;

  return useQuery({
    queryKey: savedAnalysisKeys.word(word || '', sessionId),
    queryFn: async (): Promise<WordAnalysis | null> => {
      if (!word || !sessionId) {
        return null;
      }

      console.log('🔍 [DEBUG] useSavedAnalysisByWord - Fetching analysis', { word, sessionId });
      
      try {
        // Use API client with built-in authentication
        const queryParams = {
          type: 'word',
          session_id: sessionId,
          search: word,
          per_page: '1' // We only need the most recent one
        };

        const result = await api.analyses.list(queryParams);
        
        if (!result.success || !result.data?.analyses?.length) {
          console.log('🔍 [DEBUG] useSavedAnalysisByWord - No analysis found', { word, sessionId });
          return null;
        }

        // Get the first (most recent) analysis
        const dbAnalysis = result.data.analyses[0] as any; // Cast to any to access DB fields
        const wordAnalysis: WordAnalysis = {
          meta: {
            word: dbAnalysis.word,
            ipa: dbAnalysis.ipa || '',
            pos: dbAnalysis.pos || '',
            cefr: dbAnalysis.cefr || '',
            tone: dbAnalysis.tone || '',
          },
          definitions: {
            root_meaning: dbAnalysis.root_meaning || '',
            context_meaning: dbAnalysis.context_meaning || '',
            vietnamese_translation: dbAnalysis.vietnamese_translation || '',
          },
          usage: {
            example_sentence: dbAnalysis.example_sentence || '',
            example_translation: dbAnalysis.example_translation || '',
            collocations: dbAnalysis.word_collocations?.map((col: any) => ({
              phrase: col.phrase,
              meaning: col.meaning || '',
              usage_example: col.usage_example || '',
              frequency_level: col.frequency_level || 'common'
            })) || [],
          },
          inference_strategy: dbAnalysis.inference_clues ? {
            clues: dbAnalysis.inference_clues,
            reasoning: dbAnalysis.inference_reasoning || '',
          } : {
            clues: '',
            reasoning: ''
          },
          relations: {
            synonyms: dbAnalysis.word_synonyms?.map((syn: any) => ({
              word: syn.synonym_word,
              ipa: syn.ipa || '',
              meaning_en: syn.meaning_en || '',
              meaning_vi: syn.meaning_vi || ''
            })) || [],
            antonyms: dbAnalysis.word_antonyms?.map((ant: any) => ({
              word: ant.antonym_word,
              ipa: ant.ipa || '',
              meaning_en: ant.meaning_en || '',
              meaning_vi: ant.meaning_vi || ''
            })) || [],
          }
        };

        console.log('🔍 [DEBUG] useSavedAnalysisByWord - Successfully fetched and transformed analysis', {
          word: wordAnalysis.meta.word,
          hasSynonyms: wordAnalysis.relations.synonyms.length > 0,
          hasAntonyms: wordAnalysis.relations.antonyms.length > 0
        });

        return wordAnalysis;
      } catch (error) {
        console.error('🔍 [DEBUG] useSavedAnalysisByWord - Fetch failed', error);
        return null;
      }
    },
    enabled: enabled && !!word && !!sessionId,
    staleTime,
    retry: 1, // Only retry once for saved analyses
    retryDelay: 1000,
  });
}

/**
 * Hook để invalidate saved analysis cache
 */
export function useInvalidateSavedAnalysis() {
  const queryClient = useQueryClient();

  return () => {
    console.log('🔍 [DEBUG] useInvalidateSavedAnalysis - Invalidating cache');
    queryClient.invalidateQueries({ queryKey: savedAnalysisKeys.all });
  };
}

export default useSavedAnalysis;