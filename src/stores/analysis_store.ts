import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types'
import { clientLogger } from '@/services/logger'

// Wrapper types that include database fields
export interface WordAnalysisWithId extends WordAnalysis {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface SentenceAnalysisWithId extends SentenceAnalysis {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface ParagraphAnalysisWithId extends ParagraphAnalysis {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface PhraseAnalysisWithId extends PhraseAnalysis {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Analysis state interface
export interface AnalysisState {
  // Current analysis data
  currentWordAnalysis: WordAnalysis | null
  currentSentenceAnalysis: SentenceAnalysis | null
  currentParagraphAnalysis: ParagraphAnalysis | null
  currentPhraseAnalysis: PhraseAnalysis | null
  
  // Saved analyses
  savedWordAnalyses: WordAnalysisWithId[]
  savedSentenceAnalyses: SentenceAnalysisWithId[]
  savedParagraphAnalyses: ParagraphAnalysisWithId[]
  savedPhraseAnalyses: PhraseAnalysisWithId[]
  
  // Loading states
  isAnalyzing: boolean
  isSaving: boolean
  isLoading: boolean
  
  // Error states
  analysisError: string | null
  saveError: string | null
  
  // UI state
  activeAnalysisType: 'word' | 'sentence' | 'paragraph' | 'phrase' | null
  analysisHistory: Array<{
    id: string
    type: 'word' | 'sentence' | 'paragraph' | 'phrase'
    content: string
    timestamp: Date
  }>
  
  // Filters and search
  wordFilter: string
  sentenceFilter: string
  paragraphFilter: string
  phraseFilter: string
  
  // Pagination
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

// Analysis actions interface
export interface AnalysisActions {
  // Current analysis setters
  setCurrentWordAnalysis: (analysis: WordAnalysis | null) => void
  setCurrentSentenceAnalysis: (analysis: SentenceAnalysis | null) => void
  setCurrentParagraphAnalysis: (analysis: ParagraphAnalysis | null) => void
  setCurrentPhraseAnalysis: (analysis: PhraseAnalysis | null) => void
  
  // Saved analyses management
  addWordAnalysis: (analysis: WordAnalysisWithId) => void
  addSentenceAnalysis: (analysis: SentenceAnalysisWithId) => void
  addParagraphAnalysis: (analysis: ParagraphAnalysisWithId) => void
  addPhraseAnalysis: (analysis: PhraseAnalysisWithId) => void
  
  updateWordAnalysis: (id: string, updates: Partial<WordAnalysisWithId>) => void
  updateSentenceAnalysis: (id: string, updates: Partial<SentenceAnalysisWithId>) => void
  updateParagraphAnalysis: (id: string, updates: Partial<ParagraphAnalysisWithId>) => void
  updatePhraseAnalysis: (id: string, updates: Partial<PhraseAnalysisWithId>) => void
  
  removeWordAnalysis: (id: string) => void
  removeSentenceAnalysis: (id: string) => void
  removeParagraphAnalysis: (id: string) => void
  removePhraseAnalysis: (id: string) => void
  
  clearAllAnalyses: () => void
  
  // Loading states
  setAnalyzing: (analyzing: boolean) => void
  setSaving: (saving: boolean) => void
  setLoading: (loading: boolean) => void
  
  // Error states
  setAnalysisError: (error: string | null) => void
  setSaveError: (error: string | null) => void
  clearErrors: () => void
  
  // UI state
  setActiveAnalysisType: (type: 'word' | 'sentence' | 'paragraph' | 'phrase' | null) => void
  addToHistory: (item: {
    id: string
    type: 'word' | 'sentence' | 'paragraph' | 'phrase'
    content: string
    timestamp: Date
  }) => void
  clearHistory: () => void
  
  // Filters and search
  setWordFilter: (filter: string) => void
  setSentenceFilter: (filter: string) => void
  setParagraphFilter: (filter: string) => void
  setPhraseFilter: (filter: string) => void
  clearAllFilters: () => void
  
  // Pagination
  setCurrentPage: (page: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
  setTotalItems: (total: number) => void
  resetPagination: () => void
  
  // Async actions
analyzeWord: (word: string) => Promise<WordAnalysisWithId | null>
analyzeSentence: (sentence: string) => Promise<SentenceAnalysisWithId | null>
analyzeParagraph: (paragraph: string) => Promise<ParagraphAnalysisWithId | null>
analyzePhrase: (phrase: string) => Promise<PhraseAnalysisWithId | null>

saveAnalysis: (type: 'word' | 'sentence' | 'paragraph' | 'phrase', analysis: any) => Promise<boolean>
  loadAnalyses: (type: 'word' | 'sentence' | 'paragraph' | 'phrase') => Promise<void>
  deleteAnalysis: (type: 'word' | 'sentence' | 'paragraph' | 'phrase', id: string) => Promise<boolean>
}

// Analysis store type
export type AnalysisStore = AnalysisState & AnalysisActions

// Initial state
const initialState: AnalysisState = {
  currentWordAnalysis: null,
  currentSentenceAnalysis: null,
  currentParagraphAnalysis: null,
  currentPhraseAnalysis: null,
  
  savedWordAnalyses: [],
  savedSentenceAnalyses: [],
  savedParagraphAnalyses: [],
  savedPhraseAnalyses: [],
  
  isAnalyzing: false,
  isSaving: false,
  isLoading: false,
  
  analysisError: null,
  saveError: null,
  
  activeAnalysisType: null,
  analysisHistory: [],
  
  wordFilter: '',
  sentenceFilter: '',
  paragraphFilter: '',
  phraseFilter: '',
  
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
}

// Analysis selectors
export const analysisSelectors = {
  // Current analyses
  currentWordAnalysis: (state: AnalysisStore) => state.currentWordAnalysis,
  currentSentenceAnalysis: (state: AnalysisStore) => state.currentSentenceAnalysis,
  currentParagraphAnalysis: (state: AnalysisStore) => state.currentParagraphAnalysis,
  currentPhraseAnalysis: (state: AnalysisStore) => state.currentPhraseAnalysis,
  
  // Saved analyses
  savedWordAnalyses: (state: AnalysisStore) => state.savedWordAnalyses,
  savedSentenceAnalyses: (state: AnalysisStore) => state.savedSentenceAnalyses,
  savedParagraphAnalyses: (state: AnalysisStore) => state.savedParagraphAnalyses,
  savedPhraseAnalyses: (state: AnalysisStore) => state.savedPhraseAnalyses,
  
  // Loading states
  isAnalyzing: (state: AnalysisStore) => state.isAnalyzing,
  isSaving: (state: AnalysisStore) => state.isSaving,
  isLoading: (state: AnalysisStore) => state.isLoading,
  
  // Error states
  analysisError: (state: AnalysisStore) => state.analysisError,
  saveError: (state: AnalysisStore) => state.saveError,
  
  // UI state
  activeAnalysisType: (state: AnalysisStore) => state.activeAnalysisType,
  analysisHistory: (state: AnalysisStore) => state.analysisHistory,
  
  // Filters
  wordFilter: (state: AnalysisStore) => state.wordFilter,
  sentenceFilter: (state: AnalysisStore) => state.sentenceFilter,
  paragraphFilter: (state: AnalysisStore) => state.paragraphFilter,
  phraseFilter: (state: AnalysisStore) => state.phraseFilter,
  
  // Pagination
  currentPage: (state: AnalysisStore) => state.currentPage,
  itemsPerPage: (state: AnalysisStore) => state.itemsPerPage,
  totalItems: (state: AnalysisStore) => state.totalItems,
  
  // Computed selectors
  hasCurrentAnalysis: (state: AnalysisStore) => 
    !!(state.currentWordAnalysis || state.currentSentenceAnalysis || 
        state.currentParagraphAnalysis || state.currentPhraseAnalysis),
  
  filteredWordAnalyses: (state: AnalysisStore) =>
state.savedWordAnalyses.filter(analysis =>
  analysis.meta.word.toLowerCase().includes(state.wordFilter.toLowerCase())
),

filteredSentenceAnalyses: (state: AnalysisStore) =>
state.savedSentenceAnalyses.filter(analysis =>
  analysis.meta.sentence.toLowerCase().includes(state.sentenceFilter.toLowerCase())
),

filteredParagraphAnalyses: (state: AnalysisStore) =>
state.savedParagraphAnalyses.filter(analysis =>
  // ParagraphAnalysis doesn't have a direct paragraph field, would need to be added
  true // Placeholder - would need to add paragraph field to ParagraphAnalysis type
),

filteredPhraseAnalyses: (state: AnalysisStore) =>
state.savedPhraseAnalyses.filter(analysis =>
  analysis.meta.phrase.toLowerCase().includes(state.phraseFilter.toLowerCase())
),
}

// Create analysis store
export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // Current analysis setters
      setCurrentWordAnalysis: (analysis) => set({ currentWordAnalysis: analysis }, false, 'setCurrentWordAnalysis'),
      setCurrentSentenceAnalysis: (analysis) => set({ currentSentenceAnalysis: analysis }, false, 'setCurrentSentenceAnalysis'),
      setCurrentParagraphAnalysis: (analysis) => set({ currentParagraphAnalysis: analysis }, false, 'setCurrentParagraphAnalysis'),
      setCurrentPhraseAnalysis: (analysis) => set({ currentPhraseAnalysis: analysis }, false, 'setCurrentPhraseAnalysis'),
      
      // Saved analyses management
      addWordAnalysis: (analysis) => set(
        (state) => ({ savedWordAnalyses: [...state.savedWordAnalyses, analysis] }),
        false,
        'addWordAnalysis'
      ),
      
      addSentenceAnalysis: (analysis) => set(
        (state) => ({ savedSentenceAnalyses: [...state.savedSentenceAnalyses, analysis] }),
        false,
        'addSentenceAnalysis'
      ),
      
      addParagraphAnalysis: (analysis) => set(
        (state) => ({ savedParagraphAnalyses: [...state.savedParagraphAnalyses, analysis] }),
        false,
        'addParagraphAnalysis'
      ),
      
      addPhraseAnalysis: (analysis) => set(
        (state) => ({ savedPhraseAnalyses: [...state.savedPhraseAnalyses, analysis] }),
        false,
        'addPhraseAnalysis'
      ),
      
      updateWordAnalysis: (id, updates) => set(
        (state) => ({
          savedWordAnalyses: state.savedWordAnalyses.map(analysis =>
            analysis.id === id ? { ...analysis, ...updates } : analysis
          )
        }),
        false,
        'updateWordAnalysis'
      ),
      
      updateSentenceAnalysis: (id, updates) => set(
        (state) => ({
          savedSentenceAnalyses: state.savedSentenceAnalyses.map(analysis =>
            analysis.id === id ? { ...analysis, ...updates } : analysis
          )
        }),
        false,
        'updateSentenceAnalysis'
      ),
      
      updateParagraphAnalysis: (id, updates) => set(
        (state) => ({
          savedParagraphAnalyses: state.savedParagraphAnalyses.map(analysis =>
            analysis.id === id ? { ...analysis, ...updates } : analysis
          )
        }),
        false,
        'updateParagraphAnalysis'
      ),
      
      updatePhraseAnalysis: (id, updates) => set(
        (state) => ({
          savedPhraseAnalyses: state.savedPhraseAnalyses.map(analysis =>
            analysis.id === id ? { ...analysis, ...updates } : analysis
          )
        }),
        false,
        'updatePhraseAnalysis'
      ),
      
      removeWordAnalysis: (id) => set(
        (state) => ({
          savedWordAnalyses: state.savedWordAnalyses.filter(analysis => analysis.id !== id)
        }),
        false,
        'removeWordAnalysis'
      ),
      
      removeSentenceAnalysis: (id) => set(
        (state) => ({
          savedSentenceAnalyses: state.savedSentenceAnalyses.filter(analysis => analysis.id !== id)
        }),
        false,
        'removeSentenceAnalysis'
      ),
      
      removeParagraphAnalysis: (id) => set(
        (state) => ({
          savedParagraphAnalyses: state.savedParagraphAnalyses.filter(analysis => analysis.id !== id)
        }),
        false,
        'removeParagraphAnalysis'
      ),
      
      removePhraseAnalysis: (id) => set(
        (state) => ({
          savedPhraseAnalyses: state.savedPhraseAnalyses.filter(analysis => analysis.id !== id)
        }),
        false,
        'removePhraseAnalysis'
      ),
      
      clearAllAnalyses: () => set({
        savedWordAnalyses: [],
        savedSentenceAnalyses: [],
        savedParagraphAnalyses: [],
        savedPhraseAnalyses: [],
      }, false, 'clearAllAnalyses'),
      
      // Loading states
      setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }, false, 'setAnalyzing'),
      setSaving: (saving) => set({ isSaving: saving }, false, 'setSaving'),
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      
      // Error states
      setAnalysisError: (error) => set({ analysisError: error }, false, 'setAnalysisError'),
      setSaveError: (error) => set({ saveError: error }, false, 'setSaveError'),
      clearErrors: () => set({ analysisError: null, saveError: null }, false, 'clearErrors'),
      
      // UI state
      setActiveAnalysisType: (type) => set({ activeAnalysisType: type }, false, 'setActiveAnalysisType'),
      
      addToHistory: (item) => set(
        (state) => ({ analysisHistory: [...state.analysisHistory, item] }),
        false,
        'addToHistory'
      ),
      
      clearHistory: () => set({ analysisHistory: [] }, false, 'clearHistory'),
      
      // Filters and search
      setWordFilter: (filter) => set({ wordFilter: filter }, false, 'setWordFilter'),
      setSentenceFilter: (filter) => set({ sentenceFilter: filter }, false, 'setSentenceFilter'),
      setParagraphFilter: (filter) => set({ paragraphFilter: filter }, false, 'setParagraphFilter'),
      setPhraseFilter: (filter) => set({ phraseFilter: filter }, false, 'setPhraseFilter'),
      
      clearAllFilters: () => set({
        wordFilter: '',
        sentenceFilter: '',
        paragraphFilter: '',
        phraseFilter: '',
      }, false, 'clearAllFilters'),
      
      // Pagination
      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),
      setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }, false, 'setItemsPerPage'),
      setTotalItems: (total) => set({ totalItems: total }, false, 'setTotalItems'),
      
      resetPagination: () => set({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
      }, false, 'resetPagination'),
      
      // Async actions (placeholder implementations)
      analyzeWord: async (word) => {
        set({ isAnalyzing: true, analysisError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Analyzing word', { word })
          const analysis: WordAnalysisWithId = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            meta: {
              word,
              ipa: 'placeholder',
              pos: 'noun',
              cefr: 'B1',
              tone: 'neutral',
            },
            definitions: {
              root_meaning: 'Placeholder definition',
              context_meaning: 'Placeholder context meaning',
              vietnamese_translation: 'Placeholder translation',
            },
            inference_strategy: {
              clues: 'Placeholder clues',
              reasoning: 'Placeholder reasoning',
            },
            relations: {
              synonyms: [],
              antonyms: [],
            },
            usage: {
              collocations: [],
              example_sentence: 'Placeholder example',
              example_translation: 'Placeholder translation',
            },
          }
          
          set({ currentWordAnalysis: analysis })
          return analysis
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Word analysis failed'
          set({ analysisError: errorMessage })
          return null
        } finally {
          set({ isAnalyzing: false })
        }
      },
      
      analyzeSentence: async (sentence) => {
        set({ isAnalyzing: true, analysisError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Analyzing sentence', { sentence })
          const analysis: SentenceAnalysisWithId = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            meta: {
              sentence,
              complexity_level: 'Basic',
              sentence_type: 'declarative',
            },
            semantics: {
              main_idea: 'Placeholder main idea',
              subtext: 'Placeholder subtext',
              sentiment: 'Neutral',
            },
            grammar_breakdown: {
              subject: 'Placeholder subject',
              main_verb: 'Placeholder verb',
              object: 'Placeholder object',
              clauses: [],
            },
            contextual_role: {
              function: 'Placeholder function',
              relation_to_previous: 'Placeholder relation',
            },
            key_components: [],
            rewrite_suggestions: [],
            translation: {
              literal: 'Placeholder literal translation',
              natural: 'Placeholder natural translation',
            },
          }
          
          set({ currentSentenceAnalysis: analysis })
          return analysis
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sentence analysis failed'
          set({ analysisError: errorMessage })
          return null
        } finally {
          set({ isAnalyzing: false })
        }
      },
      
      analyzeParagraph: async (paragraph) => {
        set({ isAnalyzing: true, analysisError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Analyzing paragraph', { paragraph })
          const analysis: ParagraphAnalysisWithId = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            meta: {
              type: 'descriptive',
              tone: 'neutral',
              target_audience: 'general',
            },
            content_analysis: {
              main_topic: 'Placeholder main topic',
              sentiment: {
                label: 'Neutral',
                intensity: 5,
                justification: 'Placeholder justification',
              },
              keywords: ['keyword1', 'keyword2'],
            },
            structure_breakdown: [],
            coherence_and_cohesion: {
              logic_score: 80,
              flow_score: 75,
              transition_words: [],
              gap_analysis: 'Placeholder gap analysis',
            },
            stylistic_evaluation: {
              vocabulary_level: 'intermediate',
              sentence_variety: 'mixed',
            },
            constructive_feedback: {
              critiques: [],
              better_version: 'Placeholder better version',
            },
          }
          
          set({ currentParagraphAnalysis: analysis })
          return analysis
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Paragraph analysis failed'
          set({ analysisError: errorMessage })
          return null
        } finally {
          set({ isAnalyzing: false })
        }
      },
      
      analyzePhrase: async (phrase) => {
        set({ isAnalyzing: true, analysisError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Analyzing phrase', { phrase })
          const analysis: PhraseAnalysisWithId = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            meta: {
              phrase,
              ipa: 'placeholder',
              pos: 'phrase',
              type: 'idiom',
              cefr: 'B2',
              tone: 'neutral',
              register: 'neutral',
            },
            definitions: {
              literal_meaning: 'Placeholder literal meaning',
              figurative_meaning: 'Placeholder figurative meaning',
              vietnamese_translation: 'Placeholder translation',
              usage_notes: 'Placeholder usage notes',
            },
            components: {
              words: [],
            },
            grammar_and_structure: {
              pattern: 'Placeholder pattern',
              variations: [],
            },
            usage: {
              collocations: [],
              example_sentences: [],
            },
            pragmatics_and_culture: {
              formality_level: 'neutral',
              register_appropriateness: 'Placeholder register appropriateness',
              cultural_notes: 'Placeholder cultural notes',
              common_mistakes: [],
            },
            learning_aids: {
              memory_tips: 'Placeholder memory tips',
              pronunciation_tips: 'Placeholder pronunciation tips',
              practice_suggestions: [],
            },
          }
          
          set({ currentPhraseAnalysis: analysis })
          return analysis
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Phrase analysis failed'
          set({ analysisError: errorMessage })
          return null
        } finally {
          set({ isAnalyzing: false })
        }
      },
      
      saveAnalysis: async (type, analysis) => {
        set({ isSaving: true, saveError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Saving analysis', { type, analysisId: analysis?.id })
          
          switch (type) {
            case 'word':
              get().addWordAnalysis(analysis as WordAnalysisWithId)
              break
            case 'sentence':
              get().addSentenceAnalysis(analysis as SentenceAnalysisWithId)
              break
            case 'paragraph':
              get().addParagraphAnalysis(analysis as ParagraphAnalysisWithId)
              break
            case 'phrase':
              get().addPhraseAnalysis(analysis as PhraseAnalysisWithId)
              break
          }
          
          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Save analysis failed'
          set({ saveError: errorMessage })
          return false
        } finally {
          set({ isSaving: false })
        }
      },
      
      loadAnalyses: async (type) => {
        set({ isLoading: true, analysisError: null })
        try {
          // Placeholder implementation
          clientLogger.info('Loading analyses for type', { type })
          // Would load from database
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Load analyses failed'
          set({ analysisError: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },
      
      deleteAnalysis: async (type, id) => {
        try {
          // Placeholder implementation
          clientLogger.info('Deleting analysis', { type, id })
          
          switch (type) {
            case 'word':
              get().removeWordAnalysis(id)
              break
            case 'sentence':
              get().removeSentenceAnalysis(id)
              break
            case 'paragraph':
              get().removeParagraphAnalysis(id)
              break
            case 'phrase':
              get().removePhraseAnalysis(id)
              break
          }
          
          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Delete analysis failed'
          set({ analysisError: errorMessage })
          return false
        }
      },
    })),
    {
      name: 'analysis-store',
    }
  )
)

// Convenience hooks for specific analysis types
export const useAnalysisSelectors = () => analysisSelectors
export const useAnalysisActions = () => {
  const store = useAnalysisStore()
  return {
    setCurrentWordAnalysis: store.setCurrentWordAnalysis,
    setCurrentSentenceAnalysis: store.setCurrentSentenceAnalysis,
    setCurrentParagraphAnalysis: store.setCurrentParagraphAnalysis,
    setCurrentPhraseAnalysis: store.setCurrentPhraseAnalysis,
    addWordAnalysis: store.addWordAnalysis,
    addSentenceAnalysis: store.addSentenceAnalysis,
    addParagraphAnalysis: store.addParagraphAnalysis,
    addPhraseAnalysis: store.addPhraseAnalysis,
    updateWordAnalysis: store.updateWordAnalysis,
    updateSentenceAnalysis: store.updateSentenceAnalysis,
    updateParagraphAnalysis: store.updateParagraphAnalysis,
    updatePhraseAnalysis: store.updatePhraseAnalysis,
    removeWordAnalysis: store.removeWordAnalysis,
    removeSentenceAnalysis: store.removeSentenceAnalysis,
    removeParagraphAnalysis: store.removeParagraphAnalysis,
    removePhraseAnalysis: store.removePhraseAnalysis,
    clearAllAnalyses: store.clearAllAnalyses,
    setAnalyzing: store.setAnalyzing,
    setSaving: store.setSaving,
    setLoading: store.setLoading,
    setAnalysisError: store.setAnalysisError,
    setSaveError: store.setSaveError,
    clearErrors: store.clearErrors,
    setActiveAnalysisType: store.setActiveAnalysisType,
    addToHistory: store.addToHistory,
    clearHistory: store.clearHistory,
    setWordFilter: store.setWordFilter,
    setSentenceFilter: store.setSentenceFilter,
    setParagraphFilter: store.setParagraphFilter,
    setPhraseFilter: store.setPhraseFilter,
    clearAllFilters: store.clearAllFilters,
    setCurrentPage: store.setCurrentPage,
    setItemsPerPage: store.setItemsPerPage,
    setTotalItems: store.setTotalItems,
    resetPagination: store.resetPagination,
    analyzeWord: store.analyzeWord,
    analyzeSentence: store.analyzeSentence,
    analyzeParagraph: store.analyzeParagraph,
    analyzePhrase: store.analyzePhrase,
    saveAnalysis: store.saveAnalysis,
    loadAnalyses: store.loadAnalyses,
    deleteAnalysis: store.deleteAnalysis,
  }
}