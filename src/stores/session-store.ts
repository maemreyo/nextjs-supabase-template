import { create } from 'zustand';
import type { 
  AnalysisSession, 
  AnalysisSessionInsert, 
  AnalysisSessionUpdate,
  SessionAnalysis,
  SessionAnalysisInsert,
  SessionSettings,
  SessionSettingsInsert,
  SessionTag,
  SessionTagInsert,
  SessionFilters,
  SessionState,
  SessionActions
} from '@/types/sessions';

// Tạo session store với Zustand
export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  sessionAnalyses: [],
  sessionSettings: null,
  sessionTags: [],
  isLoading: false,
  error: null,
  
  // Pagination
  sessionsPage: 1,
  sessionsPerPage: 20,
  totalSessions: 0,
  
  // Filters
  statusFilter: 'all',
  typeFilter: 'all',
  searchQuery: '',

  // Session CRUD actions
  createSession: async (sessionData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
      }

      const newSession = result.data;
      
      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSession: newSession,
        isLoading: false,
      }));

      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateSession: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update session');
      }

      const updatedSession = result.data;
      
      set((state) => ({
        sessions: state.sessions.map(session => 
          session.id === id ? updatedSession : session
        ),
        currentSession: state.currentSession?.id === id ? updatedSession : state.currentSession,
        isLoading: false,
      }));

      return updatedSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteSession: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete session');
      }

      set((state) => ({
        sessions: state.sessions.filter(session => session.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
        sessionAnalyses: state.currentSession?.id === id ? [] : state.sessionAnalyses,
        sessionSettings: state.currentSession?.id === id ? null : state.sessionSettings,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  archiveSession: async (id) => {
    await get().updateSession(id, { status: 'archived' });
  },

  restoreSession: async (id) => {
    await get().updateSession(id, { status: 'active' });
  },

  // Session management actions
  setCurrentSession: (session) => {
    set({ currentSession: session });
    
    // Load analyses and settings for the selected session
    if (session) {
      get().loadSessionAnalyses(session.id);
      get().loadSessionSettings(session.id);
    } else {
      set({ sessionAnalyses: [], sessionSettings: null });
    }
  },

  loadSessions: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters.dateRange) {
        params.append('date_from', filters.dateRange.start.toISOString());
        params.append('date_to', filters.dateRange.end.toISOString());
      }
      
      // Add pagination
      params.append('page', get().sessionsPage.toString());
      params.append('per_page', get().sessionsPerPage.toString());

      const response = await fetch(`/api/sessions?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load sessions');
      }

      set({
        sessions: result.data.sessions,
        totalSessions: result.data.pagination.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadSession: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load session');
      }

      const session = result.data;
      
      set((state) => ({
        sessions: state.sessions.some(s => s.id === id) 
          ? state.sessions 
          : [...state.sessions, session],
        currentSession: session,
        isLoading: false,
      }));

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  refreshCurrentSession: async () => {
    const { currentSession } = get();
    if (currentSession) {
      await get().loadSession(currentSession.id);
    }
  },

  // Session analyses actions
  addAnalysisToSession: async (sessionId, analysis) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });

      if (!response.ok) {
        throw new Error(`Failed to add analysis to session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add analysis to session');
      }

      const newAnalysis = result.data;
      
      set((state) => ({
        sessionAnalyses: [...state.sessionAnalyses, newAnalysis],
        isLoading: false,
      }));

      return newAnalysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeAnalysisFromSession: async (sessionId, analysisId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyses/${analysisId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove analysis from session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove analysis from session');
      }

      set((state) => ({
        sessionAnalyses: state.sessionAnalyses.filter(analysis => analysis.id !== analysisId),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  reorderSessionAnalyses: async (sessionId, analysisIds) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyses/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_ids: analysisIds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reorder session analyses: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder session analyses');
      }

      // Update local state with new order
      set((state) => {
        const analysesMap = new Map(state.sessionAnalyses.map(a => [a.id, a]));
        const reorderedAnalyses = analysisIds.map((id, index) => {
          const analysis = analysesMap.get(id);
          return analysis ? { ...analysis, position: index } : null;
        }).filter(Boolean) as SessionAnalysis[];

        return {
          sessionAnalyses: reorderedAnalyses,
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadSessionAnalyses: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/analyses`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session analyses: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load session analyses');
      }

      set({
        sessionAnalyses: result.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Session settings actions
  updateSessionSettings: async (sessionId, settings) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update session settings: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update session settings');
      }

      const updatedSettings = result.data;
      
      set({
        sessionSettings: updatedSettings,
        isLoading: false,
      });

      return updatedSettings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadSessionSettings: async (sessionId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/settings`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session settings: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load session settings');
      }

      set({
        sessionSettings: result.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Session tags actions
  createTag: async (tag) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/sessions/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create tag');
      }

      const newTag = result.data;
      
      set((state) => ({
        sessionTags: [...state.sessionTags, newTag],
        isLoading: false,
      }));

      return newTag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update tag: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update tag');
      }

      const updatedTag = result.data;
      
      set((state) => ({
        sessionTags: state.sessionTags.map(tag => 
          tag.id === id ? updatedTag : tag
        ),
        isLoading: false,
      }));

      return updatedTag;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteTag: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/tags/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete tag: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tag');
      }

      set((state) => ({
        sessionTags: state.sessionTags.filter(tag => tag.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  addTagToSession: async (sessionId, tagId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add tag to session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add tag to session');
      }

      // Update current session with new tag
      set((state) => {
        if (!state.currentSession || state.currentSession.id !== sessionId) {
          return { isLoading: false };
        }

        return { isLoading: false };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeTagFromSession: async (sessionId, tagId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to remove tag from session: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove tag from session');
      }

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadSessionTags: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/sessions/tags');
      
      if (!response.ok) {
        throw new Error(`Failed to load session tags: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load session tags');
      }

      set({
        sessionTags: result.data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // UI state actions
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setTypeFilter: (filter) => set({ typeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSessionsPage: (page) => set({ sessionsPage: page }),
  clearError: () => set({ error: null }),
  reset: () => set({
    sessions: [],
    currentSession: null,
    sessionAnalyses: [],
    sessionSettings: null,
    sessionTags: [],
    isLoading: false,
    error: null,
    sessionsPage: 1,
    totalSessions: 0,
    statusFilter: 'all',
    typeFilter: 'all',
    searchQuery: '',
  }),
}));

// Selectors cho dễ dàng truy cập
export const useSessionSelectors = () => {
  const store = useSessionStore();
  
  return {
    // Computed selectors
    filteredSessions: () => {
      let filtered = store.sessions;
      
      // Apply status filter
      if (store.statusFilter !== 'all') {
        filtered = filtered.filter(session => session.status === store.statusFilter);
      }
      
      // Apply type filter
      if (store.typeFilter !== 'all') {
        filtered = filtered.filter(session => session.session_type === store.typeFilter);
      }
      
      // Apply search filter
      if (store.searchQuery.trim()) {
        const query = store.searchQuery.toLowerCase();
        filtered = filtered.filter(session => 
          session.title.toLowerCase().includes(query) ||
          session.description?.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    },
    
    // Session statistics
    getSessionStats: () => {
      const sessions = store.sessions;
      return {
        total: sessions.length,
        active: sessions.filter(s => s.status === 'active').length,
        archived: sessions.filter(s => s.status === 'archived').length,
        wordSessions: sessions.filter(s => s.session_type === 'word').length,
        sentenceSessions: sessions.filter(s => s.session_type === 'sentence').length,
        paragraphSessions: sessions.filter(s => s.session_type === 'paragraph').length,
        mixedSessions: sessions.filter(s => s.session_type === 'mixed').length,
      };
    },
    
    // Current session info
    currentSessionAnalysesCount: () => store.sessionAnalyses.length,
    hasCurrentSession: () => store.currentSession !== null,
    
    // Pagination helpers
    totalPages: () => Math.ceil(store.totalSessions / store.sessionsPerPage),
    hasNextPage: () => store.sessionsPage < Math.ceil(store.totalSessions / store.sessionsPerPage),
    hasPrevPage: () => store.sessionsPage > 1,
  };
};

export default useSessionStore;