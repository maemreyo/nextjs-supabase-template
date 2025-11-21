import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys, createQueryKeys } from '@/lib/query-keys'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type TableNames = keyof Tables
type TableRow<T extends TableNames> = Tables[T]['Row']
type TableInsert<T extends TableNames> = Tables[T]['Insert']
type TableUpdate<T extends TableNames> = Tables[T]['Update']

// Enhanced query options
interface UseSupabaseQueryOptions<TData = unknown>
  extends Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'> {
  select?: string
  filters?: Record<string, any>
  orderBy?: {
    column: string
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

// Enhanced mutation options
interface UseSupabaseMutationOptions<TData = unknown, TError = Error, TVariables = void>
  extends UseMutationOptions<TData, TError, TVariables> {
  invalidateQueries?: boolean
  optimisticUpdate?: boolean
}

/**
 * Generic hook cho Supabase queries
 */
export function useSupabaseQuery<T extends TableNames>(
  table: T,
  options: UseSupabaseQueryOptions<TableRow<T>[]> = {}
) {
  const { 
    select = '*', 
    filters, 
    orderBy, 
    limit, 
    offset,
    ...queryOptions 
  } = options

  return useQuery({
    queryKey: createQueryKeys.table(table).list(filters),
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from(table).select(select)
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }
      
      // Apply pagination
      if (limit) {
        query = query.limit(limit)
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    ...queryOptions,
  })
}

/**
 * Hook cho single record query
 */
export function useSupabaseDetailQuery<T extends TableNames>(
  table: T,
  id: string,
  options: UseSupabaseQueryOptions<TableRow<T>> = {}
) {
  const { select = '*', ...queryOptions } = options

  return useQuery({
    queryKey: createQueryKeys.table(table).detail(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()
        
      if (error) throw error
      return data
    },
    enabled: !!id && (queryOptions.enabled !== false),
    ...queryOptions,
  })
}

/**
 * Generic hook cho Supabase insert mutations
 */
export function useSupabaseMutation<T extends TableNames>(
  table: T,
  options: UseSupabaseMutationOptions<TableRow<T>, Error, TableInsert<T>> = {}
) {
  const queryClient = useQueryClient()
  const { invalidateQueries = true, optimisticUpdate = false, ...mutationOptions } = options
  
  return useMutation({
    mutationFn: async (data: TableInsert<T>) => {
      const supabase = createClient()
      const { data: result, error } = await supabase
        .from(table)
        .insert(data as any)
        .select()
        .single()
        
      if (error) throw error
      return result
    },
    
    onMutate: async (newData) => {
      if (!optimisticUpdate) return { previousData: undefined }
      
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: createQueryKeys.table(table).all() })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        createQueryKeys.table(table).list()
      )
      
      // Optimistic update
      if (previousData) {
        const tempId = `temp-${Date.now()}`
        const optimisticData = { ...newData, id: tempId } as any
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          (old: any[] = []) => [...old, optimisticData]
        )
      }
      
      return { previousData }
    },
    
    onError: (error, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          context.previousData
        )
      }
    },
    
    onSuccess: (data, variables, context: any) => {
      // Update cache with real data
      if (optimisticUpdate) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          (old: any[] = []) => 
            old.map((item: any) => 
              typeof item.id === 'string' && item.id.startsWith('temp-') 
                ? data 
                : item
            )
        )
      }
      
      // Invalidate related queries
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    onSettled: () => {
      // Always invalidate to ensure consistency
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    ...mutationOptions,
  })
}

/**
 * Hook cho Supabase update mutations
 */
export function useSupabaseUpdate<T extends TableNames>(
  table: T,
  options: UseSupabaseMutationOptions<TableRow<T>, Error, { id: string } & TableUpdate<T>> = {}
) {
  const queryClient = useQueryClient()
  const { invalidateQueries = true, optimisticUpdate = false, ...mutationOptions } = options
  
  return useMutation({
    mutationFn: async (params: { id: string } & TableUpdate<T>) => {
      const { id, ...data } = params
      const supabase = createClient()
      const { data: result, error } = await supabase
        .from(table)
        .update(data as any)
        .eq('id', id as any)
        .select()
        .single()
        
      if (error) throw error
      return result as unknown as TableRow<T>
    },
    
    onMutate: async (params) => {
      if (!optimisticUpdate) return { previousList: undefined, previousDetail: undefined }
      
      const { id, ...updateData } = params
      
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: createQueryKeys.table(table).all() })
      
      // Snapshot previous values
      const previousList = queryClient.getQueryData(
        createQueryKeys.table(table).list()
      )
      const previousDetail = queryClient.getQueryData(
        createQueryKeys.table(table).detail(id)
      )
      
      // Optimistic update
      if (previousList) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          (old: any[] = []) =>
            old.map((item: any) => 
              item.id === id ? { ...item, ...updateData } : item
            )
        )
      }
      
      if (previousDetail) {
        queryClient.setQueryData(
          createQueryKeys.table(table).detail(id),
          (old: any) => ({ ...old, ...updateData })
        )
      }
      
      return { previousList, previousDetail }
    },
    
    onError: (error, variables, context: any) => {
      // Rollback on error
      if (context?.previousList) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          context.previousList
        )
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          createQueryKeys.table(table).detail(variables.id),
          context.previousDetail
        )
      }
    },
    
    onSuccess: () => {
      // Invalidate related queries
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    onSettled: () => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    ...mutationOptions,
  })
}

/**
 * Hook cho Supabase delete mutations
 */
export function useSupabaseDelete<T extends TableNames>(
  table: T,
  options: UseSupabaseMutationOptions<void, Error, string> = {}
) {
  const queryClient = useQueryClient()
  const { invalidateQueries = true, optimisticUpdate = false, ...mutationOptions } = options
  
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from(table).delete().eq('id', id as any)
      
      if (error) throw error
    },
    
    onMutate: async (id) => {
      if (!optimisticUpdate) return { previousData: undefined }
      
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: createQueryKeys.table(table).all() })
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        createQueryKeys.table(table).list()
      )
      
      // Optimistic update
      if (previousData) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          (old: any[] = []) => old.filter((item: any) => item.id !== id)
        )
      }
      
      return { previousData }
    },
    
    onError: (error, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          createQueryKeys.table(table).list(),
          context.previousData
        )
      }
    },
    
    onSuccess: () => {
      // Invalidate related queries
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    onSettled: () => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
      }
    },
    
    ...mutationOptions,
  })
}

/**
 * Utility functions cho cache management
 */
export const supabaseQueryUtils = {
  // Invalidate tất cả queries của một table
  invalidateTable: <T extends TableNames>(table: T) => {
    const queryClient = getQueryClient()
    queryClient.invalidateQueries({ queryKey: createQueryKeys.table(table).all() })
  },
  
  // Set query data manually
  setTableData: <T extends TableNames>(
    table: T, 
    data: TableRow<T>[], 
    filters?: Record<string, any>
  ) => {
    const queryClient = getQueryClient()
    queryClient.setQueryData(
      createQueryKeys.table(table).list(filters),
      data
    )
  },
}

// Import getQueryClient để sử dụng trong utils
import { getQueryClient } from '@/lib/query-client'