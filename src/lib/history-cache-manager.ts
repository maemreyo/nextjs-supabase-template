import { createClient } from './supabase/client';

// Types for cache management
export interface AnalysisHistoryItem {
  id: string;
  type: 'word' | 'sentence' | 'paragraph';
  input: string;
  result: any;  // WordAnalysis | SentenceAnalysis | ParagraphAnalysis
  timestamp: number;
  session_id?: string;
  session_title?: string;
  analysis_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CacheConfig {
  memoryMaxSize: number;
  localStorageExpiry: number;  // in milliseconds
  databaseCacheTTL: number;   // in milliseconds
  enableCompression: boolean;
}

export interface CacheStats {
  memorySize: number;
  localStorageSize: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

/**
 * Multi-level cache manager for analysis history
 * L1: Memory cache (fastest, session lifetime)
 * L2: LocalStorage (medium, 24h TTL)
 * L3: Database (slowest but persistent)
 */
export class HistoryCacheManager {
  private memoryCache: Map<string, {
    data: AnalysisHistoryItem;
    timestamp: number;
    hits: number;
  }> = new Map();
  
  private readonly localStorageKey = 'analysis_history_cache_v2';
  private readonly config: CacheConfig;
  private stats: CacheStats = {
    memorySize: 0,
    localStorageSize: 0,
    hitRate: 0,
    missRate: 0,
    lastCleanup: Date.now()
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memoryMaxSize: 50,
      localStorageExpiry: 24 * 60 * 60 * 1000, // 24 hours
      databaseCacheTTL: 5 * 60 * 1000, // 5 minutes
      enableCompression: true,
      ...config
    };

    // Initialize cache from localStorage
    this.initializeFromLocalStorage();
    
    // Setup periodic cleanup
    this.setupPeriodicCleanup();
  }

  // L1: Memory cache operations
  getFromMemory(id: string): AnalysisHistoryItem | null {
    const cached = this.memoryCache.get(id);
    if (cached) {
      cached.hits++;
      this.updateStats('hit');
      return cached.data;
    }
    
    this.updateStats('miss');
    return null;
  }

  setInMemory(id: string, item: AnalysisHistoryItem): void {
    // Check if we need to evict items
    if (this.memoryCache.size >= this.config.memoryMaxSize) {
      this.evictLeastUsed();
    }

    this.memoryCache.set(id, {
      data: item,
      timestamp: Date.now(),
      hits: 0
    });

    this.stats.memorySize = this.memoryCache.size;
  }

  private evictLeastUsed(): void {
    let leastUsed: [string, any] | null = null;
    let minHits = Infinity;

    for (const [id, entry] of this.memoryCache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        leastUsed = [id, entry];
      }
    }

    if (leastUsed) {
      this.memoryCache.delete(leastUsed[0]);
    }
  }

  // L2: LocalStorage operations
  async getFromLocalStorage(limit?: number): Promise<AnalysisHistoryItem[]> {
    try {
      if (typeof window === 'undefined') return [];
      
      const cached = localStorage.getItem(this.localStorageKey);
      if (!cached) return [];
      
      const { data, timestamp, compressed } = JSON.parse(cached);
      
      // Check expiry
      if (Date.now() - timestamp > this.config.localStorageExpiry) {
        this.clearLocalStorage();
        return [];
      }

      let items = data;
      
      // Decompress if needed
      if (compressed && this.config.enableCompression) {
        items = await this.decompressData(items);
      }

      // Apply limit if specified
      return limit ? items.slice(0, limit) : items;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return [];
    }
  }

  async saveToLocalStorage(item: AnalysisHistoryItem): Promise<void> {
    try {
      const existing = await this.getFromLocalStorage();
      const updated = [item, ...existing.filter(i => i.id !== item.id)];
      
      await this.writeToLocalStorage(updated);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  async updateLocalStorage(items: AnalysisHistoryItem[]): Promise<void> {
    try {
      await this.writeToLocalStorage(items);
    } catch (error) {
      console.warn('Failed to update localStorage:', error);
    }
  }

  private async writeToLocalStorage(items: AnalysisHistoryItem[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const data = this.config.enableCompression
      ? await this.compressData(items)
      : items;

    const cacheData = {
      data,
      timestamp: Date.now(),
      compressed: this.config.enableCompression,
      version: '2.0'
    };

    localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
    this.stats.localStorageSize = items.length;
  }

  clearLocalStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.localStorageKey);
    this.stats.localStorageSize = 0;
  }

  // L3: Database operations
  async getFromDatabase(params: {
    limit?: number;
    offset?: number;
    type?: 'word' | 'sentence' | 'paragraph' | 'all';
    userId: string;
  }): Promise<AnalysisHistoryItem[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('recent_analyses')
        .select(`
          id,
          analysis_type,
          analysis_id,
          analysis_title,
          analysis_summary,
          analysis_data,
          created_at,
          updated_at,
          session_id,
          session_title,
          session_type,
          session_status,
          user_id,
          position
        `)
        .eq('user_id', params.userId);

      // Apply filters
      if (params.type && params.type !== 'all') {
        query = query.eq('analysis_type', params.type);
      }

      // Apply sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match AnalysisHistoryItem interface
      return (data || []).map(item => {
        let inputText = '';
        let analysisData = null;

        if (item.analysis_data && typeof item.analysis_data === 'object') {
          analysisData = item.analysis_data;
          const analysisObj = analysisData as any;
          
          if (item.analysis_type === 'word' && analysisObj.meta?.word) {
            inputText = analysisObj.meta.word;
          } else if (item.analysis_type === 'sentence' && analysisObj.meta?.sentence) {
            inputText = analysisObj.meta.sentence;
          } else if (item.analysis_type === 'paragraph' && analysisObj.meta?.paragraph) {
            inputText = analysisObj.meta.paragraph;
          }
        }

        return {
          id: item.id || '',
          type: item.analysis_type as 'word' | 'sentence' | 'paragraph',
          input: inputText || item.analysis_title || '',
          result: analysisData,
          timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          session_id: item.session_id || undefined,
          session_title: item.session_title || undefined,
          analysis_id: item.analysis_id || undefined,
          created_at: item.created_at || undefined,
          updated_at: item.updated_at || undefined
        };
      });
    } catch (error) {
      console.error('Failed to fetch from database:', error);
      return [];
    }
  }

  async saveToDatabase(item: AnalysisHistoryItem, userId: string): Promise<void> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('session_analyses')
        .insert({
          user_id: userId,
          analysis_type: item.type,
          analysis_id: item.id,
          analysis_title: item.input.substring(0, 100),
          analysis_summary: this.generateSummary(item),
          analysis_data: item.result,
          position: 0 // Will be updated later if needed
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to save to database:', error);
      throw error;
    }
  }

  async removeFromDatabase(itemId: string, userId: string): Promise<void> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('session_analyses')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to remove from database:', error);
      throw error;
    }
  }

  // Write-through cache strategy
  async addItem(item: AnalysisHistoryItem, userId: string): Promise<void> {
    // Add to all cache levels
    this.setInMemory(item.id, item);
    await this.saveToLocalStorage(item);
    await this.saveToDatabase(item, userId);
  }

  async removeItem(itemId: string, userId: string): Promise<void> {
    // Remove from all cache levels
    this.memoryCache.delete(itemId);
    
    // Update localStorage
    const existing = await this.getFromLocalStorage();
    const filtered = existing.filter(item => item.id !== itemId);
    await this.updateLocalStorage(filtered);
    
    // Remove from database
    await this.removeFromDatabase(itemId, userId);
  }

  async updateCache(items: AnalysisHistoryItem[]): Promise<void> {
    // Update memory cache
    items.forEach(item => this.setInMemory(item.id, item));
    
    // Update localStorage
    await this.updateLocalStorage(items);
  }

  async clearAll(userId?: string): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.stats.memorySize = 0;
    
    // Clear localStorage
    this.clearLocalStorage();
    
    // Clear database if userId provided
    if (userId) {
      try {
        const supabase = createClient();
        await supabase
          .from('session_analyses')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.error('Failed to clear database:', error);
      }
    }
  }

  // Utility methods
  private generateSummary(item: AnalysisHistoryItem): string {
    try {
      if (item.type === 'word' && item.result?.definitions?.root_meaning) {
        return `Word: ${item.input} - ${item.result.definitions.root_meaning}`;
      } else if (item.type === 'sentence' && item.result?.semantics?.main_idea) {
        return `Sentence analysis: ${item.result.semantics.main_idea}`;
      } else if (item.type === 'paragraph' && item.result?.content_analysis?.main_topic) {
        return `Paragraph: ${item.result.content_analysis.main_topic}`;
      }
      return `${item.type} analysis of: ${item.input.substring(0, 50)}`;
    } catch (error) {
      return `${item.type} analysis`;
    }
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression simulation - in real implementation, use compression library
    return JSON.stringify(data);
  }

  private async decompressData(data: any): Promise<any> {
    // Simple decompression simulation - in real implementation, use compression library
    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  private updateStats(type: 'hit' | 'miss'): void {
    const total = this.stats.hitRate + this.stats.missRate + 1;
    
    if (type === 'hit') {
      this.stats.hitRate = (this.stats.hitRate * total + 1) / total;
    } else {
      this.stats.missRate = (this.stats.missRate * total + 1) / total;
    }
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Cleanup expired memory cache entries (older than 1 hour)
    for (const [id, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > 60 * 60 * 1000) {
        this.memoryCache.delete(id);
      }
    }
    
    // Cleanup expired localStorage
    this.getFromLocalStorage().then(items => {
      if (items.length === 0) {
        this.clearLocalStorage();
      }
    });
    
    this.stats.lastCleanup = now;
    this.stats.memorySize = this.memoryCache.size;
  }

  private async initializeFromLocalStorage(): Promise<void> {
    try {
      const items = await this.getFromLocalStorage();
      items.forEach(item => this.setInMemory(item.id, item));
    } catch (error) {
      console.warn('Failed to initialize cache from localStorage:', error);
    }
  }

  // Public methods for stats and monitoring
  getStats(): CacheStats {
    return { ...this.stats };
  }

  getMemoryCache(): Map<string, AnalysisHistoryItem> {
    const result = new Map<string, AnalysisHistoryItem>();
    for (const [id, entry] of this.memoryCache.entries()) {
      result.set(id, entry.data);
    }
    return result;
  }

  async preloadCache(userId: string, limit = 10): Promise<void> {
    try {
      // Check if we have recent data in localStorage
      const localData = await this.getFromLocalStorage(limit);
      
      if (localData.length >= limit) {
        // We have enough recent data locally
        return;
      }

      // Fetch from database
      const dbData = await this.getFromDatabase({
        limit,
        userId,
        type: 'all'
      });

      // Update cache
      await this.updateCache(dbData);
    } catch (error) {
      console.error('Failed to preload cache:', error);
    }
  }
}

// Singleton instance
export const historyCacheManager = new HistoryCacheManager();