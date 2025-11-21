import { create } from 'zustand';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

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
  
  // History states
  analysisHistory: Array<{
    id: string;
    type: 'word' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  
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
  
  // History actions
  addToHistory: (item: AnalysisHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  
  // Error actions
  setLastError: (error: string | null) => void;
  
  // Utility actions
  clearSelection: () => void;
  clearCache: () => void;
  reset: () => void;
}

// History item interface
interface AnalysisHistoryItem {
  id: string;
  type: 'word' | 'sentence' | 'paragraph';
  input: string;
  result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  timestamp: number;
}

// Tạo store
export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
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
  
  // History states
  analysisHistory: [],
  
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
  
  // History actions
  addToHistory: (item) => set((state) => ({
    analysisHistory: [item, ...state.analysisHistory].slice(0, 49) // Giữ 50 items gần nhất
  })),
  removeFromHistory: (id) => set((state) => ({
    analysisHistory: state.analysisHistory.filter(item => item.id !== id)
  })),
  clearHistory: () => set({ analysisHistory: [] }),
  
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
    lastError: null
  })
}));

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
      const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      store.setIsAnalyzing(true);
      store.addToQueue({
        id,
        type,
        data: { text },
        timestamp: Date.now()
      });
      
      try {
        // Gọi API tương ứng
        const endpoint = `/api/ai/analyze-${type}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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