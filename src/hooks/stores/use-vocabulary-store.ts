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
import { createClient } from '@/lib/supabase/client';

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
  
  // Collection word actions
  addWordToCollection: async (wordId, collectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/collections/${collectionId}/words/${wordId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to add word to collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add word to collection');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  removeWordFromCollection: async (wordId, collectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/collections/${collectionId}/words/${wordId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to remove word from collection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove word from collection');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  moveWordBetweenCollections: async (wordId, fromCollectionId, toCollectionId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/collections/${fromCollectionId}/words/${wordId}/move`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to_collection_id: toCollectionId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to move word between collections: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to move word between collections');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  // Synonym actions
  addSynonym: async (wordId: string, synonym: VocabularySynonymInsert): Promise<VocabularySynonym> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${wordId}/synonyms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(synonym),
      });

      if (!response.ok) {
        throw new Error(`Failed to add synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add synonym');
      }

      const newSynonym = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return newSynonym;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateSynonym: async (id: string, updates: VocabularySynonymUpdate): Promise<VocabularySynonym> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/synonyms/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update synonym');
      }

      const updatedSynonym = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return updatedSynonym;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  deleteSynonym: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/synonyms/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete synonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete synonym');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  // Antonym actions
  addAntonym: async (wordId: string, antonym: VocabularyAntonymInsert): Promise<VocabularyAntonym> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${wordId}/antonyms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(antonym),
      });

      if (!response.ok) {
        throw new Error(`Failed to add antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add antonym');
      }

      const newAntonym = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return newAntonym;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateAntonym: async (id: string, updates: VocabularyAntonymUpdate): Promise<VocabularyAntonym> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/antonyms/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update antonym');
      }

      const updatedAntonym = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return updatedAntonym;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  deleteAntonym: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/antonyms/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete antonym: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete antonym');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  // Collocation actions
  addCollocation: async (wordId: string, collocation: VocabularyCollocationInsert): Promise<VocabularyCollocation> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${wordId}/collocations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collocation),
      });

      if (!response.ok) {
        throw new Error(`Failed to add collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add collocation');
      }

      const newCollocation = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return newCollocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateCollocation: async (id: string, updates: VocabularyCollocationUpdate): Promise<VocabularyCollocation> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/collocations/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update collocation');
      }

      const updatedCollocation = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return updatedCollocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  deleteCollocation: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/collocations/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete collocation: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete collocation');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  // Practice session actions
  loadPracticeSessions: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/vocabulary/practice/sessions', {
        method: 'GET',
        headers,
      });

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
  
  loadPracticeResults: async (sessionId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/results`, {
        method: 'GET',
        headers,
      });

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
  
  abandonPracticeSession: async (sessionId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/abandon`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to abandon practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to abandon practice session');
      }

      set((state) => ({
        currentPracticeSession: null,
        practiceMode: null,
        isPracticing: false,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  getWordsForReview: async (limit?: number): Promise<VocabularyWord[]> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams();
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await fetch(`/api/vocabulary/words/review?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get words for review: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get words for review');
      }

      set({ isLoading: false });
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  addContext: async (wordId: string, context: VocabularyContextInsert): Promise<VocabularyContext> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${wordId}/contexts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`Failed to add context to word: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add context to word');
      }

      const newContext = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return newContext;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateContext: async (id: string, updates: Partial<VocabularyContext>): Promise<VocabularyContext> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/contexts/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update context: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update context');
      }

      const updatedContext = result.data;
      
      set((state) => ({
        isLoading: false,
      }));
      
      return updatedContext;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  deleteContext: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/contexts/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete context: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete context');
      }

      set((state) => ({
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  createPracticeSession: async (sessionRequest: PracticeSessionRequest): Promise<VocabularyPracticeSession> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/vocabulary/practice/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to create practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create practice session');
      }

      const newPracticeSession = result.data;
      
      set((state) => ({
        practiceSessions: [...state.practiceSessions, newPracticeSession],
        currentPracticeSession: newPracticeSession,
        isLoading: false,
      }));

      return newPracticeSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  endPracticeSession: async (sessionId: string, results: VocabularyPracticeResultInsert[]): Promise<VocabularyPracticeResult> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/end`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to end practice session');
      }

      const practiceResults = result.data;
      
      set((state) => ({
        practiceResults: [...state.practiceResults, practiceResults],
        currentPracticeSession: null,
        practiceMode: null,
        isPracticing: false,
        isLoading: false,
      }));

      return practiceResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  startPracticeSession: async (collectionId?: string, sessionType?: VocabularyPracticeSessionInsert['session_type']): Promise<VocabularyPracticeSession> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Create session request from parameters
      const sessionRequest: PracticeSessionRequest = {
        session_type: sessionType || 'flashcard',
        collection_id: collectionId,
      };

      const response = await fetch('/api/vocabulary/practice/sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionRequest),
      });

      if (!response.ok) {
        throw new Error(`Failed to start practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start practice session');
      }

      const newPracticeSession = result.data;
      
      set((state) => ({
        practiceSessions: [...state.practiceSessions, newPracticeSession],
        currentPracticeSession: newPracticeSession,
        isLoading: false,
      }));

      return newPracticeSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  completePracticeSession: async (sessionId: string, results: VocabularyPracticeResultInsert[]): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/practice/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete practice session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete practice session');
      }

      const practiceResults = result.data;
      
      set((state) => ({
        practiceResults: [...state.practiceResults, practiceResults],
        currentPracticeSession: null,
        practiceMode: null,
        isPracticing: false,
        isLoading: false,
      }));

      return practiceResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  startPracticeMode: (mode: 'flashcard' | 'quiz' | 'spelling' | 'matching' | 'writing'): void => {
    set({
      practiceMode: mode,
      isPracticing: true,
    });
  },
  
  endPracticeMode: () => {
    set({
      practiceMode: null,
      isPracticing: false,
    });
  },

  // Word CRUD actions
  createWord: async (wordData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/vocabulary/words', {
        method: 'POST',
        headers,
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
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${id}`, {
        method: 'PATCH',
        headers,
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
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/vocabulary/words/${id}`, {
        method: 'DELETE',
        headers,
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
    return get().loadWords({ search: query }) as unknown as Promise<VocabularyWord[]>;
  },

  // Collection CRUD actions
  createCollection: async (collectionData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get auth token
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token is available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/vocabulary/collections', {
        method: 'POST',
        headers,
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

export default useVocabularyStore;