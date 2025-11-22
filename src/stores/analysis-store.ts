import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import { historyCacheManager, AnalysisHistoryItem } from '@/lib/history-cache-manager';
import { offlineHistoryManager } from '@/lib/offline-history-manager';
import { generateUUID, generateUUIDWithPrefix } from '@/lib/uuid';

// Queue item cho analysis
interface AnalysisQueueItem {
  id: string;
  type: 'word' | 'sentence' | 'paragraph';
  data: any;
  timestamp: number;
}

// Analysis state interface
interface AnalysisStore {
  // Cache states
  wordAnalyses: Map<string, WordAnalysis>;
  sentenceAnalyses: Map<string, SentenceAnalysis>;
  paragraphAnalyses: Map<string, ParagraphAnalysis>;
  
  // UI states
  selectedText: string;
  selectedType: 'word' | 'sentence' | 'paragraph';
  activeTab: 'word' | 'sentence' | 'paragraph';
  
  // Loading states
  isAnalyzing: boolean;
  analysisQueue: AnalysisQueueItem[];
  
  // Enhanced history states
  analysisHistory: AnalysisHistoryItem[];        // Local cache
  databaseHistory: AnalysisHistoryItem[];       // Database data
  isHistoryLoading: boolean;
  historyError: string | null;
  lastHistorySync: number | null;
  historyPagination: {
    hasMore: boolean;
    offset: number;
    limit: number;
    total: number;
  };
  
  // Sync states
  isSyncing: boolean;
  syncError: string | null;
  pendingSyncItems: AnalysisHistoryItem[];
  
  // Error states
  lastError: string | null;
  
  // Actions
  // Cache actions
  setWordAnalysis: (id: string, analysis: WordAnalysis) => void;
  setSentenceAnalysis: (id: string, analysis: SentenceAnalysis) => void;
  setParagraphAnalysis: (id: string, analysis: ParagraphAnalysis) => void;
  
  // Selection actions
  setSelectedText: (text: string) => void;
  setSelectedType: (type: 'word' | 'sentence' | 'paragraph') => void;
  setActiveTab: (tab: 'word' | 'sentence' | 'paragraph') => void;
  
  // Loading actions
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  addToQueue: (item: AnalysisQueueItem) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  
  // Enhanced history actions
  addToHistory: (item: AnalysisHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadHistoryFromDatabase: (params?: any) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  syncHistoryWithDatabase: () => Promise<void>;
  
  // Cache management
  preloadHistory: (limit?: number) => Promise<void>;
  clearHistoryCache: () => void;
  
  // Offline support
  addToPendingSync: (item: AnalysisHistoryItem) => void;
  processPendingSync: () => Promise<void>;
  
  // Database actions
  addToDatabase: (item: {
    id: string;
    type: 'word' | 'sentence' | 'paragraph';
    input_text: string;
    result: any;
    timestamp: number;
  }) => Promise<void>;
  
  // Error actions
  setLastError: (error: string | null) => void;
  
  // Utility actions
  clearSelection: () => void;
  clearCache: () => void;
  reset: () => void;
}


// Tạo store với hybrid approach
export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      // Cache states
      wordAnalyses: new Map(),
      sentenceAnalyses: new Map(),
      paragraphAnalyses: new Map(),
      
      // UI states
      selectedText: '',
      selectedType: 'word',
      activeTab: 'word',
      
      // Loading states
      isAnalyzing: false,
      analysisQueue: [],
      
      // Enhanced history states
      analysisHistory: [],
      databaseHistory: [],
      isHistoryLoading: false,
      historyError: null,
      lastHistorySync: null,
      historyPagination: {
        hasMore: false,
        offset: 0,
        limit: 20,
        total: 0
      },
      
      // Sync states
      isSyncing: false,
      syncError: null,
      pendingSyncItems: [],
      
      // Error states
      lastError: null,
  
  // Cache actions
  setWordAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.wordAnalyses);
    newMap.set(id, analysis);
    return { wordAnalyses: newMap };
  }),
  
  setSentenceAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.sentenceAnalyses);
    newMap.set(id, analysis);
    return { sentenceAnalyses: newMap };
  }),
  
  setParagraphAnalysis: (id, analysis) => set((state) => {
    const newMap = new Map(state.paragraphAnalyses);
    newMap.set(id, analysis);
    return { paragraphAnalyses: newMap };
  }),
  
  // Selection actions
  setSelectedText: (text) => set({ selectedText: text }),
  setSelectedType: (type) => set({ selectedType: type }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Loading actions
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  addToQueue: (item) => set((state) => ({
    analysisQueue: [...state.analysisQueue, item]
  })),
  removeFromQueue: (id) => set((state) => ({
    analysisQueue: state.analysisQueue.filter(item => item.id !== id)
  })),
  clearQueue: () => set({ analysisQueue: [] }),
  
  // Enhanced history actions
  addToHistory: async (item) => {
    const state = get();
    
    // Add to local cache immediately for responsiveness
    set((prevState) => ({
      analysisHistory: [item, ...prevState.analysisHistory].slice(0, 49)
    }));
    
    // Use cache manager for persistent storage
    try {
      await historyCacheManager.addItem(item, 'current-user-id'); // TODO: Get actual user ID
      
      // Update database history if this is most recent
      set((prevState) => ({
        databaseHistory: [item, ...prevState.databaseHistory].slice(0, 49)
      }));
    } catch (error) {
      console.error('Failed to save history item:', error);
      
      // Add to pending sync for offline support
      offlineHistoryManager.addToHistory(item);
    }
  },
  
  removeFromHistory: async (id) => {
    const state = get();
    
    // Remove from local cache
    set((prevState) => ({
      analysisHistory: prevState.analysisHistory.filter(item => item.id !== id),
      databaseHistory: prevState.databaseHistory.filter(item => item.id !== id)
    }));
    
    // Remove from persistent storage
    try {
      await historyCacheManager.removeItem(id, 'current-user-id'); // TODO: Get actual user ID
    } catch (error) {
      console.error('Failed to remove history item:', error);
    }
  },
  
  clearHistory: async () => {
    const state = get();
    
    // Clear local cache
    set({
      analysisHistory: [],
      databaseHistory: [],
      historyPagination: {
        hasMore: false,
        offset: 0,
        limit: 20,
        total: 0
      }
    });
    
    // Clear persistent storage
    try {
      await historyCacheManager.clearAll('current-user-id'); // TODO: Get actual user ID
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },
  
  loadHistoryFromDatabase: async (params = {}) => {
    const state = get();
    
    // Prevent multiple simultaneous calls
    if (state.isHistoryLoading) {
      console.log('loadHistoryFromDatabase: Already loading, skipping duplicate call');
      return;
    }
    
    set({ isHistoryLoading: true, historyError: null });
    
    try {
      // Get auth token from Supabase session with retry logic
      const { supabase } = await import('@/lib/supabase/client');
      let session: any = null;
      let retries = 2;
      
      while (retries > 0 && !session?.access_token) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!error && currentSession?.access_token) {
          session = currentSession;
          break;
        }
        
        // Wait a bit before retrying
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        retries--;
      }
      
      if (!session?.access_token) {
        throw new Error('Authentication required: No valid session available. Please sign in again.');
      }
      
      const token = session.access_token;
      
      const response = await fetch('/api/analyses/recent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          limit: params.limit || 20,
          offset: params.offset || 0,
          type: params.type || 'all',
          sort_by: 'created_at',
          sort_order: 'desc'
        })
      });
      
      // Handle 401 Unauthorized specifically - don't retry
      if (response.status === 401) {
        throw new Error('Authentication failed: Please sign in again to continue.');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set((prevState) => ({
          databaseHistory: params.offset > 0
            ? [...prevState.databaseHistory, ...result.data.analyses]
            : result.data.analyses,
          historyPagination: {
            hasMore: result.data.pagination.has_more,
            offset: params.offset || 0,
            limit: params.limit || 20,
            total: result.data.pagination.total
          },
          lastHistorySync: Date.now()
        }));
        
        // Update cache
        await historyCacheManager.updateCache(result.data.analyses);
      } else {
        throw new Error(result.error || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history from database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // For 401 errors, don't set the error state permanently
      if (errorMessage.includes('Authentication failed')) {
        set({ historyError: errorMessage });
      } else {
        set({ historyError: errorMessage });
      }
    } finally {
      set({ isHistoryLoading: false });
    }
  },
  
  loadMoreHistory: async () => {
    const state = get();
    if (state.historyPagination.hasMore && !state.isHistoryLoading) {
      await state.loadHistoryFromDatabase({
        offset: state.historyPagination.offset + state.historyPagination.limit,
        limit: state.historyPagination.limit
      });
    }
  },
  
  refreshHistory: async () => {
    const state = get();
    await state.loadHistoryFromDatabase({
      offset: 0,
      limit: state.historyPagination.offset + state.historyPagination.limit
    });
  },
  
  syncHistoryWithDatabase: async () => {
    const state = get();
    
    // Prevent multiple simultaneous syncs
    if (state.isSyncing) {
      console.log('syncHistoryWithDatabase: Already syncing, skipping duplicate call');
      return;
    }
    
    set({ isSyncing: true, syncError: null });
    
    try {
      // Get auth token from Supabase session with retry logic
      const { supabase } = await import('@/lib/supabase/client');
      let session: any = null;
      let retries = 2;
      
      while (retries > 0 && !session?.access_token) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!error && currentSession?.access_token) {
          session = currentSession;
          break;
        }
        
        // Wait a bit before retrying
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        retries--;
      }
      
      if (!session?.access_token) {
        throw new Error('Authentication required: No valid session available. Please sign in again.');
      }
      
      const token = session.access_token;
      
      const localHistory = state.analysisHistory;
      const response = await fetch('/api/analyses/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          local_history: localHistory,
          last_sync_timestamp: state.lastHistorySync
        })
      });
      
      // Handle 401 Unauthorized specifically - don't retry
      if (response.status === 401) {
        throw new Error('Authentication failed: Please sign in again to continue.');
      }
      
      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Handle conflicts if any
        if (result.data.conflicts.length > 0) {
          // Show conflict resolution UI
          // For now, use remote data
          console.warn('Sync conflicts detected:', result.data.conflicts);
        }
        
        // Update with merged history
        set({
          analysisHistory: result.data.merged_history,
          databaseHistory: result.data.merged_history,
          lastHistorySync: Date.now(),
          pendingSyncItems: []
        });
        
        // Update cache
        await historyCacheManager.updateCache(result.data.merged_history);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // For 401 errors, don't set error state permanently
      if (errorMessage.includes('Authentication failed')) {
        set({ syncError: errorMessage });
      } else {
        set({ syncError: errorMessage });
      }
    } finally {
      set({ isSyncing: false });
    }
  },
  
  // Cache management
  preloadHistory: async (limit = 10) => {
    const state = get();
    
    // Prevent multiple preload calls
    if (state.isHistoryLoading) {
      console.log('preloadHistory: Already loading history, skipping duplicate call');
      return;
    }
    
    try {
      const cached = await historyCacheManager.getFromLocalStorage(limit);
      if (cached.length > 0) {
        set({ databaseHistory: cached });
      } else {
        await state.loadHistoryFromDatabase({ limit });
      }
    } catch (error) {
      console.error('Error preloading history:', error);
    }
  },
  
  clearHistoryCache: async () => {
    const state = get();
    try {
      await historyCacheManager.clearAll('current-user-id'); // TODO: Get actual user ID
      set({
        analysisHistory: [],
        databaseHistory: [],
        lastHistorySync: null
      });
    } catch (error) {
      console.error('Error clearing history cache:', error);
    }
  },
  
  // Offline support
  addToPendingSync: (item) => {
    set((prevState) => ({
      pendingSyncItems: [...prevState.pendingSyncItems, item]
    }));
  },
  
  processPendingSync: async () => {
    const state = get();
    if (state.pendingSyncItems.length === 0) return;
    
    try {
      await offlineHistoryManager.processPendingOperations();
      set({ pendingSyncItems: [] });
    } catch (error) {
      console.error('Error processing pending sync:', error);
    }
  },
  
  // Database actions
  addToDatabase: async (item) => {
    try {
      // Get auth token from Supabase session
      const { supabase } = await import('@/lib/supabase/client');
      let session: any = null;
      let retries = 2;
      
      while (retries > 0 && !session?.access_token) {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!error && currentSession?.access_token) {
          session = currentSession;
          break;
        }
        
        // Wait a bit before retrying
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        retries--;
      }
      
      if (!session?.access_token) {
        throw new Error('Authentication required: No valid session available. Please sign in again.');
      }
      
      const token = session.access_token;
      
      // Get current session ID - you might need to get this from auth store or context
      const sessionId = session.user?.id || generateUUID();
      
      // Prepare data for API
      const apiData = {
        id: item.id,
        session_id: sessionId,
        type: item.type,
        input_text: item.input_text,
        result: item.result,
        timestamp: item.timestamp
      };
      
      const response = await fetch('/api/analyses/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add analysis: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Analysis added to database successfully:', result);
      
    } catch (error) {
      console.error('Error adding analysis to database:', error);
      // Add to pending sync for offline support
      offlineHistoryManager.addToHistory({
        id: item.id,
        type: item.type,
        input: item.input_text,
        result: item.result,
        timestamp: item.timestamp
      });
      
      // Set error state
      set((state) => ({
        lastError: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  },
  
  // Error actions
  setLastError: (error) => set({ lastError: error }),
  
  // Utility actions
  clearSelection: () => set({ 
    selectedText: '', 
    selectedType: 'word' 
  }),
  
  clearCache: () => set({
    wordAnalyses: new Map(),
    sentenceAnalyses: new Map(),
    paragraphAnalyses: new Map()
  }),
  
  reset: () => set({
    wordAnalyses: new Map(),
    sentenceAnalyses: new Map(),
    paragraphAnalyses: new Map(),
    selectedText: '',
    selectedType: 'word',
    activeTab: 'word',
    isAnalyzing: false,
    analysisQueue: [],
    analysisHistory: [],
    databaseHistory: [],
    isHistoryLoading: false,
    historyError: null,
    lastHistorySync: null,
    historyPagination: {
      hasMore: false,
      offset: 0,
      limit: 20,
      total: 0
    },
    isSyncing: false,
    syncError: null,
    pendingSyncItems: [],
    lastError: null
  })
}),
    {
      name: 'analysis-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        analysisHistory: state.analysisHistory,
        databaseHistory: state.databaseHistory,
        lastHistorySync: state.lastHistorySync,
        pendingSyncItems: state.pendingSyncItems,
        historyPagination: state.historyPagination
      })
    }
  )
);

// Selectors cho dễ dàng truy cập
export const useAnalysisSelectors = () => {
  const store = useAnalysisStore();
  
  return {
    // Cache selectors
    getWordAnalysis: (id: string) => store.wordAnalyses.get(id),
    getSentenceAnalysis: (id: string) => store.sentenceAnalyses.get(id),
    getParagraphAnalysis: (id: string) => store.paragraphAnalyses.get(id),
    
    // Computed selectors
    hasCachedAnalysis: (type: 'word' | 'sentence' | 'paragraph', id: string) => {
      switch (type) {
        case 'word':
          return store.wordAnalyses.has(id);
        case 'sentence':
          return store.sentenceAnalyses.has(id);
        case 'paragraph':
          return store.paragraphAnalyses.has(id);
        default:
          return false;
      }
    },
    
    getRecentHistory: (limit = 10) => 
      store.analysisHistory.slice(0, limit),
    
    getHistoryByType: (type: 'word' | 'sentence' | 'paragraph') =>
      store.analysisHistory.filter(item => item.type === type),
    
    // Queue selectors
    getQueueLength: () => store.analysisQueue.length,
    getQueueByType: (type: 'word' | 'sentence' | 'paragraph') =>
      store.analysisQueue.filter(item => item.type === type),
  };
};

// Actions cho dễ dàng sử dụng
export const useAnalysisActions = () => {
  const store = useAnalysisStore();
  
  return {
    // Batch actions
    analyzeText: async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
      const id = generateUUIDWithPrefix(type);
      
      store.setIsAnalyzing(true);
      store.addToQueue({
        id,
        type,
        data: { text },
        timestamp: Date.now()
      });
      
      try {
        // Get auth token from Supabase session with retry logic
        const { supabase } = await import('@/lib/supabase/client');
        let session: any = null;
        let retries = 2;
        
        while (retries > 0 && !session?.access_token) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (!error && currentSession?.access_token) {
            session = currentSession;
            break;
          }
          
          // Wait a bit before retrying
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          retries--;
        }
        
        if (!session?.access_token) {
          throw new Error('Authentication required: No valid session available. Please sign in again.');
        }
        
        const token = session.access_token;
        
        // Gọi API tương ứng
        const endpoint = `/api/ai/analyze-${type}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(
            type === 'word'
              ? { word: text, sentenceContext: '', paragraphContext: '' }
              : type === 'sentence'
              ? { sentence: text }
              : { paragraph: text }
          ),
        });
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Analysis failed');
        }
        
        // Cache kết quả
        switch (type) {
          case 'word':
            store.setWordAnalysis(id, result.data);
            break;
          case 'sentence':
            store.setSentenceAnalysis(id, result.data);
            break;
          case 'paragraph':
            store.setParagraphAnalysis(id, result.data);
            break;
        }
        
        // Thêm vào history
        store.addToHistory({
          id,
          type,
          input: text,
          result: result.data,
          timestamp: Date.now()
        });
        
        // Thêm vào database với đúng format
        await store.addToDatabase({
          id,
          type,
          input_text: text,
          result: result.data,
          timestamp: Date.now()
        });
        
      } catch (error) {
        store.setLastError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        store.setIsAnalyzing(false);
        store.removeFromQueue(id);
      }
    },
    
    // Utility actions
    clearAll: () => {
      store.clearCache();
      store.clearHistory();
      store.clearQueue();
      store.clearSelection();
      store.setLastError(null);
    }
  };
};

export default useAnalysisStore;