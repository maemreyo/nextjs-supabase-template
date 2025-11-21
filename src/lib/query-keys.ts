import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type TableNames = keyof Tables

/**
 * Query Keys Structure cho TanStack Query
 * 
 * Cấu trúc này giúp:
 * - Type safety cho query keys
 * - Dễ dàng invalidation các queries liên quan
 * - Consistent naming convention
 * - Hierarchical cache organization
 */

// Base query keys
export const queryKeys = {
  // Auth related queries
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },

  // Database table queries
  tables: {
    all: ['tables'] as const,
    table: <T extends TableNames>(table: T) => [...queryKeys.tables.all, table] as const,
    list: <T extends TableNames>(table: T) => [...queryKeys.tables.table(table), 'list'] as const,
    detail: <T extends TableNames>(table: T, id: string) => 
      [...queryKeys.tables.table(table), 'detail', id] as const,
    filtered: <T extends TableNames>(table: T, filters: Record<string, any>) => 
      [...queryKeys.tables.table(table), 'filtered', filters] as const,
    paginated: <T extends TableNames>(table: T, page: number, limit: number) => 
      [...queryKeys.tables.table(table), 'paginated', page, limit] as const,
  },

  // Document specific queries
  documents: {
    all: () => [...queryKeys.tables.table('documents')] as const,
    list: (filters?: Record<string, any>) =>
      filters
        ? [...queryKeys.documents.all(), 'list', filters] as const
        : [...queryKeys.documents.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.documents.all(), 'detail', id] as const,
    current: () => [...queryKeys.documents.all(), 'current'] as const,
  },

  // Custom business logic queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    userStats: (userId: string) => [...queryKeys.analytics.all, 'user-stats', userId] as const,
    activity: (userId: string, period: string) => 
      [...queryKeys.analytics.all, 'activity', userId, period] as const,
  },

  // File/Storage queries
  storage: {
    all: ['storage'] as const,
    bucket: (bucket: string) => [...queryKeys.storage.all, bucket] as const,
    file: (bucket: string, path: string) => [...queryKeys.storage.bucket(bucket), path] as const,
    list: (bucket: string, folder?: string) => 
      folder 
        ? [...queryKeys.storage.bucket(bucket), 'list', folder] as const
        : [...queryKeys.storage.bucket(bucket), 'list'] as const,
  },

  // API/External service queries
  api: {
    all: ['api'] as const,
    endpoint: (endpoint: string) => [...queryKeys.api.all, endpoint] as const,
    withParams: (endpoint: string, params: Record<string, any>) => 
      [...queryKeys.api.endpoint(endpoint), params] as const,
  },
} as const

/**
 * Query Key Factory Functions
 * Helper functions để tạo query keys động với type safety
 */
export const createQueryKeys = {
  // Dynamic table query keys
  table: <T extends TableNames>(table: T) => ({
    all: () => queryKeys.tables.table(table),
    list: (filters?: Record<string, any>) => 
      filters 
        ? queryKeys.tables.filtered(table, filters)
        : queryKeys.tables.list(table),
    detail: (id: string) => queryKeys.tables.detail(table, id),
    paginated: (page: number, limit: number) => queryKeys.tables.paginated(table, page, limit),
  }),

  // Custom query keys với prefix
  withPrefix: <T extends readonly unknown[]>(prefix: T) => ({
    all: () => prefix,
    list: (filters?: Record<string, any>) => 
      filters 
        ? [...prefix, 'list', filters] as const
        : [...prefix, 'list'] as const,
    detail: (id: string) => [...prefix, 'detail', id] as const,
    custom: (...args: any[]) => [...prefix, ...args] as const,
  }),
}

/**
 * Query Key Utilities
 * Helper functions để làm việc với query keys
 */
export const queryKeyUtils = {
  // Lấy base key từ một query key (loại bỏ các parameters cụ thể)
  getBaseKey: (queryKey: readonly unknown[]): readonly unknown[] => {
    // Ví dụ: ['tables', 'profiles', 'detail', '123'] -> ['tables', 'profiles', 'detail']
    const detailIndex = queryKey.findIndex(item => item === 'detail')
    if (detailIndex > 0) {
      return queryKey.slice(0, detailIndex + 1) as readonly unknown[]
    }
    
    const listIndex = queryKey.findIndex(item => item === 'list')
    if (listIndex > 0) {
      return queryKey.slice(0, listIndex + 1) as readonly unknown[]
    }
    
    return queryKey as readonly unknown[]
  },

  // Kiểm tra xem query key có match với một pattern không
  matches: (queryKey: readonly unknown[], pattern: readonly unknown[]): boolean => {
    return JSON.stringify(queryKey.slice(0, pattern.length)) === JSON.stringify(pattern)
  },

  // Lấy table name từ query key
  getTableName: (queryKey: readonly unknown[]): TableNames | null => {
    const tablesIndex = queryKey.findIndex(item => item === 'tables')
    if (tablesIndex >= 0 && tablesIndex + 1 < queryKey.length) {
      return queryKey[tablesIndex + 1] as TableNames
    }
    return null
  },

  // Lấy ID từ detail query key
  getId: (queryKey: readonly unknown[]): string | null => {
    const detailIndex = queryKey.findIndex(item => item === 'detail')
    if (detailIndex >= 0 && detailIndex + 1 < queryKey.length) {
      return queryKey[detailIndex + 1] as string
    }
    return null
  },
}

/**
 * Type definitions cho query keys
 */
export type QueryKey = typeof queryKeys[keyof typeof queryKeys]
export type TableQueryKey<T extends TableNames> = ReturnType<typeof createQueryKeys.table<T>>
export type AuthQueryKey = typeof queryKeys.auth

/**
 * Export types để sử dụng trong components
 */
export type {
  Tables,
  TableNames,
}