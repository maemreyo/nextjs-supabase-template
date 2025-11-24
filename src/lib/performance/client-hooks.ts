/**
 * Client-Side React Performance Hooks
 * Contains only React hooks for client-side performance optimization
 * Must be used with "use client" directive in React components
 */

'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { memoize } from './server-utils';

/**
 * React hook for memoized function
 * @param fn - Function to memoize
 * @param deps - Dependency array
 * @param options - Memoization options
 * @returns Memoized function
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList,
  options: {
    cacheName?: string;
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const memoizedFn = useMemo(() => memoize(fn, options), deps);
  return useCallback(memoizedFn, deps);
}

/**
 * React hook for memoized value with custom comparison
 * @param factory - Function to create value
 * @param deps - Dependency array
 * @param isEqual - Custom comparison function
 * @returns Memoized value
 */
export function useMemoDeepCompare<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual: (prev: T, next: T) => boolean = (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>({ deps: [], value: null as T });

  if (!ref.current || !isEqual(ref.current.value, factory()) || deps.some((dep, i) => dep !== ref.current!.deps[i])) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * React hook for memoized async function
 * @param fn - Async function to memoize
 * @param deps - Dependency array
 * @param options - Memoization options
 * @returns Memoized async function
 */
export function useAsyncMemo<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  deps: React.DependencyList,
  options: {
    cacheName?: string;
    maxSize?: number;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const cache = useRef<any>(null);
  
  if (!cache.current) {
    // Import LRUCache dynamically to avoid server-side import issues
    import('./server-utils').then(({ CACHE_CONFIG }) => {
      class LRUCache<V> {
        private cache = new Map<string, { value: V; timestamp: number }>();
        private maxSize: number;
        private ttl: number;

        constructor(maxSize: number = 100, ttl: number = 300000) {
          this.maxSize = maxSize;
          this.ttl = ttl;
        }

        get(key: string): V | undefined {
          const entry = this.cache.get(key);
          if (!entry) return undefined;
          
          if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
          }
          
          return entry.value;
        }

        set(key: string, value: V): void {
          if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
              this.cache.delete(firstKey);
            }
          }
          
          this.cache.set(key, { value, timestamp: Date.now() });
        }
      }
      
      cache.current = new LRUCache<Promise<ReturnType<T>>>(
        options.maxSize,
        options.ttl
      );
    });
  }

  return useCallback((...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!cache.current) return fn(...args);
    
    const key = options.keyGenerator ? options.keyGenerator(...args) : JSON.stringify(args);
    
    let promise = cache.current.get(key);
    if (!promise) {
      promise = fn(...args);
      cache.current.set(key, promise);
    }
    
    return promise;
  }, deps) as T;
}

/**
 * Debounced memoization hook
 * @param fn - Function to debounce and memoize
 * @param delay - Debounce delay in milliseconds
 * @param deps - Dependency array
 * @returns Debounced function
 */
export function useDebouncedMemo<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const memoizedFn = useRef<T | null>(null);

  useEffect(() => {
    memoizedFn.current = fn;
  }, deps);

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise<ReturnType<T>>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        if (memoizedFn.current) {
          resolve(memoizedFn.current(...args));
        }
      }, delay);
    }) as ReturnType<T>;
  }, [delay]) as T;
}

/**
 * Throttled memoization hook
 * @param fn - Function to throttle and memoize
 * @param limit - Throttle limit in milliseconds
 * @param deps - Dependency array
 * @returns Throttled function
 */
export function useThrottledMemo<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
  deps: React.DependencyList
): T {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const memoizedFn = useRef<T | null>(null);
  const pendingArgs = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    memoizedFn.current = fn;
  }, deps);

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();
    
    if (now - lastRun.current >= limit) {
      lastRun.current = now;
      if (memoizedFn.current) {
        return memoizedFn.current(...args);
      }
    }

    pendingArgs.current = args;

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        if (memoizedFn.current && pendingArgs.current) {
          memoizedFn.current(...pendingArgs.current);
        }
        timeoutRef.current = null;
      }, limit - (now - lastRun.current));
    }

    return undefined as ReturnType<T>;
  }, [limit]) as T;
}

/**
 * Memoized selector hook for complex data transformations
 * @param selector - Selector function
 * @param data - Data to select from
 * @param deps - Dependency array
 * @returns Selected data
 */
export function useMemoizedSelector<T, R>(
  selector: (data: T) => R,
  data: T,
  deps: React.DependencyList = []
): R {
  return useMemo(() => selector(data), [data, ...deps]);
}

/**
 * Memoized comparator hook for complex comparisons
 * @param a - First value
 * @param b - Second value
 * @param comparator - Comparison function
 * @returns Comparison result
 */
export function useMemoizedCompare<T>(
  a: T,
  b: T,
  comparator: (a: T, b: T) => boolean
): boolean {
  return useMemo(() => comparator(a, b), [a, b, comparator]);
}

/**
 * Creates a memoized key generator for complex objects
 * @param keys - Keys to include in the key
 * @returns Key generator function
 */
export function createKeyGenerator<T extends Record<string, any>>(
  keys: (keyof T)[]
): (obj: T) => string {
  return (obj: T): string => {
    return keys.map(key => {
      try {
        return JSON.stringify(obj[key]);
      } catch {
        return String(obj[key]);
      }
    }).join('|');
  };
}