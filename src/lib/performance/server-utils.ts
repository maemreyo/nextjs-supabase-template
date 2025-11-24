/**
 * Server-Safe Performance Utilities
 * Contains only server-safe performance monitoring functions
 * No React hooks - safe for use in API routes and server components
 */

/**
 * Safe stringification function that handles circular references
 * @param obj - Object to stringify
 * @returns String representation or fallback for circular references
 */
function safeStringify(obj: any): string {
  try {
    // Handle different types of objects that might cause issues in Next.js 16
    if (obj == null) {
      return 'null';
    }
    
    // Check for Promise objects that need to be unwrapped with React.use()
    if (obj instanceof Promise || (obj && typeof obj.then === 'function')) {
      console.warn('[DEBUG] safeStringify - Detected Promise object, returning [Promise] placeholder');
      return '[Promise]';
    }
    
    // Check for URLSearchParams objects that might be wrapped in Promise
    if (obj.constructor?.name === 'URLSearchParams' ||
        (obj && typeof obj.get === 'function' && typeof obj.getAll === 'function')) {
      try {
        // Convert URLSearchParams to plain object for safe stringification
        const paramsObj: Record<string, string> = {};
        obj.forEach((value: string, key: string) => {
          paramsObj[key] = value;
        });
        return JSON.stringify(paramsObj);
      } catch (e) {
        console.warn('[DEBUG] safeStringify - Failed to convert URLSearchParams, returning placeholder');
        return '[URLSearchParams]';
      }
    }
    
    // Check for objects that might be React.use() wrapped
    if (obj.constructor?.name?.includes('Usable') ||
        (obj && typeof obj.unwrapped === 'function')) {
      console.warn('[DEBUG] safeStringify - Detected React.use() wrapped object, returning placeholder');
      return '[ReactUsable]';
    }
    
    return JSON.stringify(obj);
  } catch (error) {
    if (error instanceof Error && error.message.includes('cyclic')) {
      // Handle circular reference by creating a safe representation
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, val) => {
        if (val != null && typeof val === 'object') {
          if (seen.has(val)) {
            return '[Circular]';
          }
          
          // Check for Promise objects in circular reference
          if (val instanceof Promise || (val && typeof val.then === 'function')) {
            return '[Promise]';
          }
          
          // Check for URLSearchParams in circular reference
          if (val.constructor?.name === 'URLSearchParams' ||
              (val && typeof val.get === 'function' && typeof val.getAll === 'function')) {
            return '[URLSearchParams]';
          }
          
          // Check for React.use() wrapped objects in circular reference
          if (val.constructor?.name?.includes('Usable') ||
              (val && typeof val.unwrapped === 'function')) {
            return '[ReactUsable]';
          }
          
          seen.add(val);
        }
        return val;
      });
    }
    // Fallback for other errors
    return String(obj || '[Object]');
  }
}

/**
 * Generates a safe cache key from arguments
 * @param args - Arguments to generate key from
 * @returns Safe cache key string
 */
function generateSafeKey(args: any[]): string {
  try {
    // Try to create a meaningful key from arguments
    return args.map((arg, index) => {
      // Handle different types of arguments
      if (arg === null || arg === undefined) {
        return `${index}:null`;
      }
      if (typeof arg === 'string') {
        return `${index}:${arg}`;
      }
      if (typeof arg === 'number') {
        return `${index}:${arg}`;
      }
      if (typeof arg === 'boolean') {
        return `${index}:${arg}`;
      }
      if (typeof arg === 'function') {
        // For functions, use their string representation or name
        return `${index}:[Function:${arg.name || 'anonymous'}]`;
      }
      if (typeof arg === 'object') {
        // For objects, try safe stringify
        return `${index}:${safeStringify(arg)}`;
      }
      // Fallback for other types
      return `${index}:${String(arg)}`;
    }).join('|');
  } catch (error) {
    // Ultimate fallback
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_MAX_SIZE: 100,
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  CLEANUP_INTERVAL: 60 * 1000, // 1 minute
};

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// LRU Cache implementation
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = CACHE_CONFIG.DEFAULT_MAX_SIZE, ttl: number = CACHE_CONFIG.DEFAULT_TTL) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    
    // Setup cleanup interval
    if (typeof window === 'undefined') {
      setInterval(() => this.cleanup(), CACHE_CONFIG.CLEANUP_INTERVAL);
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    // Add new entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAccessCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccessCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const averageAccessCount = entries.length > 0 ? totalAccessCount / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track misses to calculate this
      averageAccessCount
    };
  }
}

// Global cache instances
const globalCaches = new Map<string, LRUCache<any>>();

/**
 * Gets or creates a cache instance
 * @param name - Cache name
 * @param maxSize - Maximum cache size
 * @param ttl - Time to live in milliseconds
 * @returns Cache instance
 */
function getCache<T>(name: string, maxSize?: number, ttl?: number): LRUCache<T> {
  if (!globalCaches.has(name)) {
    globalCaches.set(name, new LRUCache<T>(maxSize, ttl));
  }
  return globalCaches.get(name) as LRUCache<T>;
}

/**
 * Creates a memoized function with LRU cache
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    cacheName?: string;
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const {
    cacheName = fn.name || 'anonymous',
    maxSize,
    ttl,
    keyGenerator
  } = options;

  const cache = getCache<ReturnType<T>>(cacheName, maxSize, ttl);

  const memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : generateSafeKey(args);
    
    let result = cache.get(key);
    if (result === undefined) {
      const computedResult = fn(...args);
      cache.set(key, computedResult);
      return computedResult;
    }
    
    return result;
  };

  return memoizedFn as T;
}

/**
 * Performance monitoring utilities (server-safe)
 */
export const performanceMonitor = {
  measure: <T>(fn: () => T, name: string): T => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${end - start}ms`);
    return result;
  },

  measureAsync: async <T>(fn: () => Promise<T>, name: string): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.debug(`[Performance] ${name}: ${end - start}ms`);
    return result;
  },

  startTimer: (name: string) => {
    const start = performance.now();
    return {
      end: () => {
        const end = performance.now();
        console.debug(`[Performance] ${name}: ${end - start}ms`);
        return end - start;
      }
    };
  }
};

/**
 * Cache management utilities
 */
export const cacheManager = {
  clearCache: (name: string) => {
    const cache = globalCaches.get(name);
    if (cache) {
      cache.clear();
    }
  },

  clearAllCaches: () => {
    globalCaches.forEach(cache => cache.clear());
  },

  getCacheStats: (name: string) => {
    const cache = globalCaches.get(name);
    return cache ? cache.getStats() : null;
  },

  getAllCacheStats: () => {
    const stats: Record<string, any> = {};
    globalCaches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }
};

// Export cache configuration for external use
export { CACHE_CONFIG };