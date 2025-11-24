/**
 * Memoization Helpers Utility (Legacy - DEPRECATED)
 * 
 * ⚠️  DEPRECATED: This file has been split for better architecture:
 * - Use server-utils.ts for API routes and server components
 * - Use client-hooks.ts for React components (requires "use client")
 * 
 * This file now only re-exports server-safe utilities for backward compatibility
 */

// Re-export server-safe utilities
export {
  memoize,
  performanceMonitor,
  cacheManager,
  CACHE_CONFIG
} from './server-utils';

// Import memoize for use in this file
import { memoize as memoizeFn } from './server-utils';

// Memoized array operations (server-safe)
export const memoizedArrayOps = {
  filter: memoizeFn(<T>(array: T[], predicate: (item: T) => boolean) =>
    array.filter(predicate), {
    cacheName: 'array-filter',
    keyGenerator: (array: any[], predicate: any) => `${array.length}-${predicate.toString()}`
  }),

  map: memoizeFn(<T, R>(array: T[], mapper: (item: T) => R) =>
    array.map(mapper), {
    cacheName: 'array-map',
    keyGenerator: (array: any[], mapper: any) => `${array.length}-${mapper.toString()}`
  }),

  sort: memoizeFn(<T>(array: T[], compareFn?: (a: T, b: T) => number) =>
    [...array].sort(compareFn), {
    cacheName: 'array-sort',
    keyGenerator: (array: any[], compareFn: any) => `${array.length}-${compareFn?.toString() || 'default'}`
  }),

  reduce: memoizeFn(<T, R>(array: T[], reducer: (acc: R, item: T) => R, initialValue: R) =>
    array.reduce(reducer, initialValue), {
    cacheName: 'array-reduce',
    keyGenerator: (array: any[], reducer: any, initialValue: any) => `${array.length}-${reducer.toString()}-${JSON.stringify(initialValue)}`
  })
};

// Memoized string operations (server-safe)
export const memoizedStringOps = {
  split: memoizeFn((str: string, separator: string | RegExp) =>
    str.split(separator), {
    cacheName: 'string-split',
    keyGenerator: (str: any, separator: any) => `${str}-${separator.toString()}`
  }),

  join: memoizeFn((array: string[], separator: string) =>
    array.join(separator), {
    cacheName: 'string-join',
    keyGenerator: (array: any[], separator: any) => `${array.join(',')}-${separator}`
  }),

  replace: memoizeFn((str: string, pattern: string | RegExp, replacement: string) =>
    str.replace(pattern, replacement), {
    cacheName: 'string-replace',
    keyGenerator: (str: any, pattern: any, replacement: any) => `${str}-${pattern.toString()}-${replacement}`
  }),

  match: memoizeFn((str: string, pattern: string | RegExp) =>
    str.match(pattern), {
    cacheName: 'string-match',
    keyGenerator: (str: any, pattern: any) => `${str}-${pattern.toString()}`
  })
};