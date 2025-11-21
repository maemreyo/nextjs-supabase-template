import { create } from 'zustand';
import type {
  VocabularyWord,
  VocabularyWordInsert,
  VocabularyWordUpdate,
  VocabularyCollection,
  VocabularyCollectionInsert,
  VocabularyCollectionUpdate,
  VocabularyContext,
  VocabularyContextInsert,
  VocabularySynonym,
  VocabularySynonymInsert,
  VocabularySynonymUpdate,
  VocabularyAntonym,
  VocabularyAntonymInsert,
  VocabularyAntonymUpdate,
  VocabularyCollocation,
  VocabularyCollocationInsert,
  VocabularyCollocationUpdate,
  VocabularyPracticeSession,
  VocabularyPracticeSessionInsert,
  VocabularyPracticeResult,
  VocabularyPracticeResultInsert,
  VocabularyState,
  VocabularyActions,
  VocabularyFilters,
  PracticeSessionRequest
} from '@/types/vocabulary';

// Tạo vocabulary store với Zustand
export const useVocabularyStore = create<VocabularyState & VocabularyActions>((set, get) => ({
  // Initial state
  words: [],
  collections: [],
  currentWord: null,
  currentCollection: null,
  practiceSessions: [],
  practiceResults: [],
  
  // UI state
  isLoading: false,
  error: null,
  
  // Pagination
  wordsPage: 1,
  wordsPerPage: 20,
  totalWords: 0,
  collectionsPage: 1,
  collectionsPerPage: 20,
  totalCollections: 0,
  
  // Filters
  statusFilter: 'all',
  cefrFilter: 'all',
  masteryFilter: 'all',
  searchQuery: '',
  collectionFilter: null,
  
  // Practice state
  currentPracticeSession: null,
  practiceMode: null,
  isPracticing: false,

  // Word CRUD actions
  createWord: async (wordData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/vocabulary/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create word: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create word');
      }

      const newWord = result.data;
      
      set((state) => ({
        words: [newWord, ...state.words],
        isLoading: false,
      }));

      return newWord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateWord: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update word: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update word');
      }

      const updatedWord = result.data;
      
      set((state) => ({
        words: state.words.map(word => 
          word.id === id ? updatedWord : word
        ),
        currentWord: state.currentWord?.id === id ? updatedWord : state.currentWord,
        isLoading: false,
      }));

      return updatedWord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteWord: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete word: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete word');
      }

      set((state) => ({
        words: state.words.filter(word => word.id !== id),
        currentWord: state.currentWord?.id === id ? null : state.currentWord,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  archiveWord: async (id) => {
    await get().updateWord(id, { status: 'archived' });
  },

  restoreWord: async (id) => {
    await get().updateWord(id, { status: 'active' });
  },

  // Word management actions
  setCurrentWord: (word) => {
    set({ currentWord: word });
  },

  loadWords: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.cefr && filters.cefr !== 'all') {
        params.append('cefr', filters.cefr);
      }
      if (filters.mastery && filters.mastery !== 'all') {
        params.append('mastery', filters.mastery);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.collection) {
        params.append('collection', filters.collection);
      }
      if (filters.difficulty) {
        params.append('difficulty_min', filters.difficulty.min.toString());
        params.append('difficulty_max', filters.difficulty.max.toString());
      }
      
      // Add pagination
      params.append('page', get().wordsPage.toString());
      params.append('per_page', get().wordsPerPage.toString());

      const response = await fetch(`/api/vocabulary/words?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load words: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load words');
      }

      set({
        words: result.data.words,
        totalWords: result.data.pagination.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadWord: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load word: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load word');
      }

      const word = result.data;
      
      set((state) => ({
        words: state.words.some(w => w.id === id) 
          ? state.words 
          : [...state.words, word],
        currentWord: word,
        isLoading: false,
      }));

      return word;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshWords: () => {
    const { statusFilter, cefrFilter, masteryFilter, searchQuery, collectionFilter } = get();
    return get().loadWords({
      status: statusFilter,
      cefr: cefrFilter,
      mastery: masteryFilter,
      search: searchQuery,
      collection: collectionFilter,
    });
  },

  searchWords: async (query) => {
    set({ searchQuery: query });
    return get().loadWords({ search: query });
  },

  // Collection CRUD actions
  createCollection: async (collectionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/vocabulary/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create collection');
      }

      const newCollection = result.data;
      
      set((state) => ({
        collections: [newCollection, ...state.collections],
        isLoading: false,
      }));

      return newCollection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCollection: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update collection');
      }

      const updatedCollection = result.data;
      
      set((state) => ({
        collections: state.collections.map(collection => 
          collection.id === id ? updatedCollection : collection
        ),
        currentCollection: state.currentCollection?.id === id ? updatedCollection : state.currentCollection,
        isLoading: false,
      }));

      return updatedCollection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteCollection: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete collection');
      }

      set((state) => ({
        collections: state.collections.filter(collection => collection.id !== id),
        currentCollection: state.currentCollection?.id === id ? null : state.currentCollection,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  archiveCollection: async (id) => {
    await get().updateCollection(id, { status: 'archived' });
  },

  restoreCollection: async (id) => {
    await get().updateCollection(id, { status: 'active' });
  },

  // Collection management actions
  setCurrentCollection: (collection) => {
    set({ currentCollection: collection });
  },

  loadCollections: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      params.append('page', get().collectionsPage.toString());
      params.append('per_page', get().collectionsPerPage.toString());

      const response = await fetch(`/api/vocabulary/collections?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load collections: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load collections');
      }

      set({
        collections: result.data.collections,
        totalCollections: result.data.pagination.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadCollection: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collections/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load collection');
      }

      const collection = result.data;
      
      set((state) => ({
        collections: state.collections.some(c => c.id === id) 
          ? state.collections 
          : [...state.collections, collection],
        currentCollection: collection,
        isLoading: false,
      }));

      return collection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshCollections: () => {
    return get().loadCollections();
  },

  // Word-Collection relationships
  addWordToCollection: async (wordId, collectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collections/${collectionId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: wordId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add word to collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add word to collection');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeWordFromCollection: async (wordId, collectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collections/${collectionId}/words/${wordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove word from collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove word from collection');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  moveWordBetweenCollections: async (wordId, fromCollectionId, toCollectionId) => {
    await get().removeWordFromCollection(wordId, fromCollectionId);
    await get().addWordToCollection(wordId, toCollectionId);
  },

  // Word details actions
  addContext: async (wordId, context) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${wordId}/contexts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`Failed to add context: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add context');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateContext: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/contexts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update context: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update context');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteContext: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/contexts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete context: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete context');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addSynonym: async (wordId, synonym) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${wordId}/synonyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(synonym),
      });

      if (!response.ok) {
        throw new Error(`Failed to add synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add synonym');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateSynonym: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/synonyms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update synonym');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteSynonym: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/synonyms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete synonym');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addAntonym: async (wordId, antonym) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${wordId}/antonyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(antonym),
      });

      if (!response.ok) {
        throw new Error(`Failed to add antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add antonym');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateAntonym: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/antonyms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update antonym');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteAntonym: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/antonyms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete antonym');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addCollocation: async (wordId, collocation) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${wordId}/collocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collocation),
      });

      if (!response.ok) {
        throw new Error(`Failed to add collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add collocation');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCollocation: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collocations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update collocation');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteCollocation: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/collocations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete collocation');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Practice actions
  startPracticeSession: async (collectionId, sessionType) => {
    set({ isLoading: true, error: null });
    
    try {
      const requestData: PracticeSessionRequest = {
        session_type: sessionType || 'flashcard',
        collection_id: collectionId,
        word_count: 10,
      };

      const response = await fetch('/api/vocabulary/practice/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to start practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start practice session');
      }

      const practiceSession = result.data;
      
      set({
        currentPracticeSession: practiceSession,
        practiceMode: sessionType,
        isPracticing: true,
        isLoading: false,
      });

      return practiceSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  completePracticeSession: async (sessionId, results) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete practice session');
      }

      set({
        currentPracticeSession: null,
        practiceMode: null,
        isPracticing: false,
        practiceResults: [...get().practiceResults, ...result.data],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  abandonPracticeSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/abandon`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to abandon practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to abandon practice session');
      }

      set({
        currentPracticeSession: null,
        practiceMode: null,
        isPracticing: false,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadPracticeSessions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/vocabulary/practice/sessions');
      
      if (!response.ok) {
        throw new Error(`Failed to load practice sessions: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load practice sessions');
      }

      set({
        practiceSessions: result.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadPracticeResults: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/results`);
      
      if (!response.ok) {
        throw new Error(`Failed to load practice results: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load practice results');
      }

      set({
        practiceResults: result.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Review actions
  markWordAsReviewed: async (wordId, isCorrect) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/${wordId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_correct: isCorrect }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark word as reviewed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark word as reviewed');
      }

      // Update word in local state
      set((state) => ({
        words: state.words.map(word => 
          word.id === wordId ? result.data : word
        ),
        currentWord: state.currentWord?.id === wordId ? result.data : state.currentWord,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  getWordsForReview: async (limit = 10) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/vocabulary/words/review?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get words for review: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get words for review');
      }

      set({
        isLoading: false,
      });

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // UI state actions
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setCefrFilter: (filter) => set({ cefrFilter: filter }),
  setMasteryFilter: (filter) => set({ masteryFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCollectionFilter: (collectionId) => set({ collectionFilter: collectionId }),
  setWordsPage: (page) => set({ wordsPage: page }),
  setCollectionsPage: (page) => set({ collectionsPage: page }),
  clearError: () => set({ error: null }),
  reset: () => set({
    words: [],
    collections: [],
    currentWord: null,
    currentCollection: null,
    practiceSessions: [],
    practiceResults: [],
    isLoading: false,
    error: null,
    wordsPage: 1,
    totalWords: 0,
    collectionsPage: 1,
    totalCollections: 0,
    statusFilter: 'all',
    cefrFilter: 'all',
    masteryFilter: 'all',
    searchQuery: '',
    collectionFilter: null,
    currentPracticeSession: null,
    practiceMode: null,
    isPracticing: false,
  }),
}));

// Selectors cho dễ dàng truy cập
export const useVocabularySelectors = () => {
  const store = useVocabularyStore();
  
  return {
    // Computed selectors
    filteredWords: () => {
      let filtered = store.words;
      
      // Apply status filter
      if (store.statusFilter !== 'all') {
        filtered = filtered.filter(word => word.status === store.statusFilter);
      }
      
      // Apply CEFR filter
      if (store.cefrFilter !== 'all') {
        filtered = filtered.filter(word => word.cefr_level === store.cefrFilter);
      }
      
      // Apply mastery filter
      if (store.masteryFilter !== 'all') {
        filtered = filtered.filter(word => {
          switch (store.masteryFilter) {
            case 'new':
              return word.mastery_level <= 1;
            case 'learning':
              return word.mastery_level >= 2 && word.mastery_level <= 3;
            case 'mastered':
              return word.mastery_level >= 4;
            default:
              return true;
          }
        });
      }
      
      // Apply collection filter
      if (store.collectionFilter) {
        // This would need to be implemented based on word-collection relationships
        // For now, we'll skip this filter
      }
      
      // Apply search filter
      if (store.searchQuery.trim()) {
        const query = store.searchQuery.toLowerCase();
        filtered = filtered.filter(word => 
          word.word.toLowerCase().includes(query) ||
          word.definition_en?.toLowerCase().includes(query) ||
          word.definition_vi?.toLowerCase().includes(query) ||
          word.vietnamese_translation?.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    },
    
    // Statistics
    getVocabularyStats: () => {
      const words = store.words.filter(w => w.status === 'active');
      return {
        totalWords: words.length,
        activeWords: words.length,
        archivedWords: store.words.filter(w => w.status === 'archived').length,
        totalCollections: store.collections.length,
        publicCollections: store.collections.filter(c => c.is_public).length,
        privateCollections: store.collections.filter(c => !c.is_public).length,
        averageMasteryLevel: words.length > 0 ? words.reduce((sum, word) => sum + word.mastery_level, 0) / words.length : 0,
        wordsForReview: words.filter(w => w.next_review_at && new Date(w.next_review_at) <= new Date()).length,
        masteredWords: words.filter(w => w.mastery_level >= 4).length,
        learningWords: words.filter(w => w.mastery_level >= 2 && w.mastery_level <= 3).length,
        newWords: words.filter(w => w.mastery_level <= 1).length,
        mostRecentWord: words.length > 0 ? words.reduce((mostRecent, word) => 
          new Date(word.created_at) > new Date(mostRecent.created_at) ? word : mostRecent
        ) : undefined,
        mostPracticedCollection: store.collections.length > 0 ? store.collections.reduce((mostPracticed, collection) => 
          collection.word_count > mostPracticed.word_count ? collection : mostPracticed
        ) : undefined,
        practiceSessionsCompleted: store.practiceSessions.filter(s => s.status === 'completed').length,
        averageAccuracy: store.practiceResults.length > 0 
          ? store.practiceResults.reduce((sum, result) => sum + (result.is_correct ? 1 : 0), 0) / store.practiceResults.length * 100 
          : 0,
      };
    },
    
    // Current state helpers
    hasCurrentWord: () => store.currentWord !== null,
    hasCurrentCollection: () => store.currentCollection !== null,
    isPracticing: () => store.isPracticing,
    
    // Pagination helpers
    wordsTotalPages: () => Math.ceil(store.totalWords / store.wordsPerPage),
    wordsHasNextPage: () => store.wordsPage < Math.ceil(store.totalWords / store.wordsPerPage),
    wordsHasPrevPage: () => store.wordsPage > 1,
    collectionsTotalPages: () => Math.ceil(store.totalCollections / store.collectionsPerPage),
    collectionsHasNextPage: () => store.collectionsPage < Math.ceil(store.totalCollections / store.collectionsPerPage),
    collectionsHasPrevPage: () => store.collectionsPage > 1,
  };
};

export default useVocabularyStore;