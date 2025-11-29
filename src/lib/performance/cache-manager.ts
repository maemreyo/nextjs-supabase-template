/**
 * Cache Manager Utility
 * Provides comprehensive caching strategies for API responses, computed values, and data optimization
 */

import { cacheLogger } from '@/services/logger';

// Cache configuration
const CACHE_CONFIG = {
  // API cache settings
  API_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  API_CACHE_MAX_SIZE: 1000,
  
  // Analysis cache settings
  ANALYSIS_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  ANALYSIS_CACHE_MAX_SIZE: 500,
  
  // User data cache settings
  USER_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  USER_CACHE_MAX_SIZE: 200,
  
  // Session cache settings
  SESSION_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  SESSION_CACHE_MAX_SIZE: 100,
  
  // Vocabulary cache settings
  VOCABULARY_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  VOCABULARY_CACHE_MAX_SIZE: 1000,
  
  // Cleanup interval
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Cache statistics
interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalAccesses: number;
  averageAccessTime: number;
  memoryUsage: number;
}

// Cache event types
type CacheEventType = 'get' | 'set' | 'delete' | 'clear' | 'expire' | 'evict';

interface CacheEvent {
  type: CacheEventType;
  key: string;
  timestamp: number;
  data?: any;
  metadata?: Record<string, any>;
}

// Advanced cache implementation with tagging and events
class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private tagIndex = new Map<string, Set<string>>();
  private stats: CacheStats;
  private eventLog: CacheEvent[] = [];
  private maxEventLogSize = 1000;
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize: number, defaultTtl: number) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
    this.stats = {
      size: 0,
      maxSize,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      totalAccesses: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    };

    // Setup cleanup interval
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), CACHE_CONFIG.CLEANUP_INTERVAL);
    }
  }

  get(key: string): T | undefined {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missCount++;
      this.stats.totalAccesses++;
      this.updateHitRate();
      this.logEvent('get', key);
      return undefined;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.missCount++;
      this.stats.totalAccesses++;
      this.updateHitRate();
      this.logEvent('expire', key);
      return undefined;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hitCount++;
    this.stats.totalAccesses++;
    this.updateHitRate();
    
    const accessTime = performance.now() - startTime;
    this.updateAverageAccessTime(accessTime);
    
    this.logEvent('get', key, entry.data);

    return entry.data;
  }

  set(key: string, data: T, options: {
    ttl?: number;
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}): void {
    const { ttl = this.defaultTtl, tags = [], metadata } = options;

    // Remove existing entry if present
    this.delete(key);

    // Remove oldest entries if cache is full
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.deleteInternal(oldestKey);
        this.logEvent('evict', oldestKey);
      }
    }

    // Create new entry
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      tags,
      metadata
    };

    this.cache.set(key, entry);

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });

    this.stats.size = this.cache.size;
    this.updateMemoryUsage();
    
    this.logEvent('set', key, data, { tags, metadata });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.deleteInternal(key);
    if (result) {
      this.logEvent('delete', key);
    }
    return result;
  }

  private deleteInternal(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remove from tag index
    if (entry.tags) {
      entry.tags.forEach(tag => {
        const tagKeys = this.tagIndex.get(tag);
        if (tagKeys) {
          tagKeys.delete(key);
          if (tagKeys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    this.cache.delete(key);
    this.stats.size = this.cache.size;
    this.updateMemoryUsage();
    
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats.size = 0;
    this.updateMemoryUsage();
    this.logEvent('clear', '');
  }

  deleteByTag(tag: string): number {
    const tagKeys = this.tagIndex.get(tag);
    if (!tagKeys) return 0;

    const deletedCount = tagKeys.size;
    tagKeys.forEach(key => this.deleteInternal(key));
    this.tagIndex.delete(tag);

    return deletedCount;
  }

  deleteByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      if (this.deleteInternal(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.deleteInternal(key);
      this.logEvent('expire', key);
    });

    return keysToDelete.length;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getEventLog(limit?: number): CacheEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  getKeysByTag(tag: string): string[] {
    const tagKeys = this.tagIndex.get(tag);
    return tagKeys ? Array.from(tagKeys) : [];
  }

  getAllTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  getEntry(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return undefined;
    }

    return entry;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalAccesses > 0 
      ? this.stats.hitCount / this.stats.totalAccesses 
      : 0;
  }

  private updateAverageAccessTime(accessTime: number): void {
    if (this.stats.totalAccesses === 1) {
      this.stats.averageAccessTime = accessTime;
    } else {
      this.stats.averageAccessTime = 
        (this.stats.averageAccessTime * (this.stats.totalAccesses - 1) + accessTime) / 
        this.stats.totalAccesses;
    }
  }

  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // String size estimation
      totalSize += JSON.stringify(entry.data).length * 2; // Data size estimation
      totalSize += 100; // Metadata overhead estimation
    }
    this.stats.memoryUsage = totalSize;
  }

  private logEvent(type: CacheEventType, key: string, data?: any, metadata?: Record<string, any>): void {
    const event: CacheEvent = {
      type,
      key,
      timestamp: Date.now(),
      data,
      metadata
    };

    this.eventLog.push(event);

    // Limit event log size
    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxEventLogSize);
    }
  }
}

// Cache manager instance
class CacheManager {
  private caches = new Map<string, AdvancedCache<any>>();
  private globalStats = {
    totalCaches: 0,
    totalMemoryUsage: 0,
    globalHitRate: 0,
    totalAccesses: 0,
    totalHits: 0
  };

  constructor() {
    // Initialize default caches
    this.createCache('api', CACHE_CONFIG.API_CACHE_MAX_SIZE, CACHE_CONFIG.API_CACHE_TTL);
    this.createCache('analysis', CACHE_CONFIG.ANALYSIS_CACHE_MAX_SIZE, CACHE_CONFIG.ANALYSIS_CACHE_TTL);
    this.createCache('user', CACHE_CONFIG.USER_CACHE_MAX_SIZE, CACHE_CONFIG.USER_CACHE_TTL);
    this.createCache('session', CACHE_CONFIG.SESSION_CACHE_MAX_SIZE, CACHE_CONFIG.SESSION_CACHE_TTL);
    this.createCache('vocabulary', CACHE_CONFIG.VOCABULARY_CACHE_MAX_SIZE, CACHE_CONFIG.VOCABULARY_CACHE_TTL);
  }

  createCache<T>(name: string, maxSize: number, defaultTtl: number): AdvancedCache<T> {
    const cache = new AdvancedCache<T>(maxSize, defaultTtl);
    this.caches.set(name, cache);
    this.updateGlobalStats();
    return cache;
  }

  getCache<T>(name: string): AdvancedCache<T> | undefined {
    return this.caches.get(name) as AdvancedCache<T>;
  }

  deleteCache(name: string): boolean {
    const result = this.caches.delete(name);
    this.updateGlobalStats();
    return result;
  }

  getAllCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  getCacheStats(name: string): CacheStats | undefined {
    const cache = this.caches.get(name);
    return cache ? cache.getStats() : undefined;
  }

  getAllCacheStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }

  getGlobalStats(): typeof this.globalStats {
    this.updateGlobalStats();
    return { ...this.globalStats };
  }

  clearCache(name: string): boolean {
    const cache = this.caches.get(name);
    if (cache) {
      cache.clear();
      this.updateGlobalStats();
      return true;
    }
    return false;
  }

  clearAllCaches(): void {
    this.caches.forEach(cache => cache.clear());
    this.updateGlobalStats();
  }

  cleanupAllCaches(): number {
    let totalCleaned = 0;
    this.caches.forEach(cache => {
      totalCleaned += cache.cleanup();
    });
    this.updateGlobalStats();
    return totalCleaned;
  }

  private updateGlobalStats(): void {
    this.globalStats.totalCaches = this.caches.size;
    
    let totalMemoryUsage = 0;
    let totalAccesses = 0;
    let totalHits = 0;

    this.caches.forEach(cache => {
      const stats = cache.getStats();
      totalMemoryUsage += stats.memoryUsage;
      totalAccesses += stats.totalAccesses;
      totalHits += stats.hitCount;
    });

    this.globalStats.totalMemoryUsage = totalMemoryUsage;
    this.globalStats.totalAccesses = totalAccesses;
    this.globalStats.totalHits = totalHits;
    this.globalStats.globalHitRate = totalAccesses > 0 ? totalHits / totalAccesses : 0;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Convenience functions for common cache operations
export const apiCache = {
  get: <T>(key: string) => cacheManager.getCache<T>('api')?.get(key),
  set: <T>(key: string, data: T, ttl?: number) => 
    cacheManager.getCache<T>('api')?.set(key, data, { ttl }),
  has: (key: string) => cacheManager.getCache('api')?.has(key) || false,
  delete: (key: string) => cacheManager.getCache('api')?.delete(key) || false,
  clear: () => cacheManager.clearCache('api'),
  getStats: () => cacheManager.getCacheStats('api')
};

export const analysisCache = {
  get: <T>(key: string) => cacheManager.getCache<T>('analysis')?.get(key),
  set: <T>(key: string, data: T, ttl?: number) => 
    cacheManager.getCache<T>('analysis')?.set(key, data, { ttl }),
  has: (key: string) => cacheManager.getCache('analysis')?.has(key) || false,
  delete: (key: string) => cacheManager.getCache('analysis')?.delete(key) || false,
  clear: () => cacheManager.clearCache('analysis'),
  deleteByTag: (tag: string) => cacheManager.getCache('analysis')?.deleteByTag(tag) || 0,
  getStats: () => cacheManager.getCacheStats('analysis')
};

export const userCache = {
  get: <T>(key: string) => cacheManager.getCache<T>('user')?.get(key),
  set: <T>(key: string, data: T, ttl?: number) => 
    cacheManager.getCache<T>('user')?.set(key, data, { ttl }),
  has: (key: string) => cacheManager.getCache('user')?.has(key) || false,
  delete: (key: string) => cacheManager.getCache('user')?.delete(key) || false,
  clear: () => cacheManager.clearCache('user'),
  getStats: () => cacheManager.getCacheStats('user')
};

export const sessionCache = {
  get: <T>(key: string) => cacheManager.getCache<T>('session')?.get(key),
  set: <T>(key: string, data: T, ttl?: number) => 
    cacheManager.getCache<T>('session')?.set(key, data, { ttl }),
  has: (key: string) => cacheManager.getCache('session')?.has(key) || false,
  delete: (key: string) => cacheManager.getCache('session')?.delete(key) || false,
  clear: () => cacheManager.clearCache('session'),
  getStats: () => cacheManager.getCacheStats('session')
};

export const vocabularyCache = {
  get: <T>(key: string) => cacheManager.getCache<T>('vocabulary')?.get(key),
  set: <T>(key: string, data: T, ttl?: number) => 
    cacheManager.getCache<T>('vocabulary')?.set(key, data, { ttl }),
  has: (key: string) => cacheManager.getCache('vocabulary')?.has(key) || false,
  delete: (key: string) => cacheManager.getCache('vocabulary')?.delete(key) || false,
  clear: () => cacheManager.clearCache('vocabulary'),
  getStats: () => cacheManager.getCacheStats('vocabulary')
};

// Cache key generators for common use cases
export const cacheKeys = {
  api: {
    wordAnalysis: (word: string, context: string) => `word-analysis:${word}:${context}`,
    paragraphAnalysis: (paragraph: string) => `paragraph-analysis:${paragraph}`,
    sentenceAnalysis: (sentence: string) => `sentence-analysis:${sentence}`,
    vocabulary: (word: string) => `vocabulary:${word}`,
    synonyms: (word: string) => `synonyms:${word}`,
    antonyms: (word: string) => `antonyms:${word}`,
    collocations: (word: string) => `collocations:${word}`
  },
  user: {
    profile: (userId: string) => `user-profile:${userId}`,
    preferences: (userId: string) => `user-preferences:${userId}`,
    sessions: (userId: string) => `user-sessions:${userId}`,
    statistics: (userId: string) => `user-stats:${userId}`
  },
  session: {
    data: (sessionId: string) => `session-data:${sessionId}`,
    metadata: (sessionId: string) => `session-metadata:${sessionId}`,
    analyses: (sessionId: string) => `session-analyses:${sessionId}`
  },
  analysis: {
    result: (analysisId: string) => `analysis-result:${analysisId}`,
    cache: (text: string, type: string) => `analysis-cache:${type}:${text}`,
    batch: (batchId: string) => `analysis-batch:${batchId}`
  }
};

// Export configuration and classes for external use
export { CACHE_CONFIG, AdvancedCache, CacheManager };