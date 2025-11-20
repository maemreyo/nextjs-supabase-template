import { QueryClient } from '@tanstack/react-query'

/**
 * Configuration cho QueryClient với proper defaults
 * - Retry logic cho network errors
 * - Cache strategies
 * - Error handling và logging
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Thời gian data được coi là fresh (5 phút)
        staleTime: 5 * 60 * 1000,
        
        // Thời gian data được giữ trong cache (10 phút)
        gcTime: 10 * 60 * 1000,
        
        // Retry logic: retry 3 lần cho network errors, không retry cho 4xx errors
        retry: (failureCount, error) => {
          // Không retry cho 4xx errors (client errors)
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number
            if (status >= 400 && status < 500) {
              return false
            }
          }
          
          // Retry tối đa 3 lần cho các lỗi khác
          return failureCount < 3
        },
        
        // Retry delay với exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus (chỉ khi data stale)
        refetchOnWindowFocus: false,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Error handling
        throwOnError: false,
      },
      mutations: {
        // Retry logic cho mutations
        retry: (failureCount, error) => {
          // Không retry cho 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number
            if (status >= 400 && status < 500) {
              return false
            }
          }
          
          // Retry tối đa 2 lần cho mutations
          return failureCount < 2
        },
        
        // Retry delay cho mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        
        // Error handling cho mutations
        throwOnError: false,
        
        // Logging cho development
        onMutate: (variables) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Mutation Started:', {
              variables,
              timestamp: new Date().toISOString(),
            })
          }
          return { variables }
        },
        
        onError: (error, variables, context) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Mutation Error:', {
              error,
              variables,
              context,
              timestamp: new Date().toISOString(),
            })
          }
        },
        
        onSuccess: (data, variables, context) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Mutation Success:', {
              data,
              variables,
              context,
              timestamp: new Date().toISOString(),
            })
          }
        },
      },
    },
  })
}

// Singleton instance cho QueryClient
let queryClient: QueryClient | null = null

export function getQueryClient() {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

// Reset QueryClient (useful cho testing)
export function resetQueryClient() {
  queryClient = null
}