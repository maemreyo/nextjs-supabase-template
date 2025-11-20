# TanStack Query & Table Guide

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Query Client Configuration](#query-client-configuration)
4. [Query Keys System](#query-keys-system)
5. [Custom Hooks](#custom-hooks)
6. [Table Utilities](#table-utilities)
7. [Components](#components)
8. [Examples](#examples)
9. [Best Practices](#best-practices)
10. [Performance Optimization](#performance-optimization)

## Overview

Template này đã được tích hợp sẵn TanStack Query và TanStack Table với các tính năng sau:

- **TanStack Query v5**: Data fetching và caching với proper error handling
- **TanStack Table v8**: Powerful table component với sorting, filtering, pagination
- **Type Safety**: Full TypeScript support với proper type definitions
- **Optimistic Updates**: Built-in support cho optimistic updates
- **Query Keys Structure**: Hierarchical cache management
- **Shadcn UI Integration**: Beautiful UI components với Tailwind CSS

## Installation

Các dependencies cần thiết đã được cài đặt sẵn:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools @tanstack/react-table
```

## Query Client Configuration

Query client được cấu hình trong [`src/lib/query-client.ts`](../src/lib/query-client.ts):

### Features

- **Retry Logic**: Smart retry với exponential backoff
- **Cache Strategies**: Proper staleTime và gcTime
- **Error Handling**: Structured error logging
- **Development Tools**: React Query DevTools integration

### Usage

```typescript
import { getQueryClient } from '@/lib/query-client'

// Automatic configuration trong providers
// Custom configuration nếu cần
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

## Query Keys System

Query keys được quản lý trong [`src/lib/query-keys.ts`](../src/lib/query-keys.ts):

### Structure

```typescript
// Hierarchical structure
queryKeys.tables.table('profiles').list(filters)
queryKeys.tables.table('profiles').detail(id)
queryKeys.auth.profile(userId)
```

### Benefits

- **Type Safety**: Autocomplete và error checking
- **Invalidation**: Easy cache invalidation
- **Hierarchy**: Logical organization
- **Reusability**: Consistent patterns

## Custom Hooks

Enhanced hooks được cung cấp trong [`src/hooks/use-supabase-query.ts`](../src/hooks/use-supabase-query.ts):

### useSupabaseQuery

```typescript
// Basic query
const { data, isLoading, error } = useSupabaseQuery('profiles', {
  select: 'id, full_name, avatar_url',
  filters: { status: 'active' },
  orderBy: { column: 'created_at', ascending: false },
  limit: 20,
})

// Detail query
const { data: profile } = useSupabaseDetailQuery('profiles', id)
```

### useSupabaseMutation

```typescript
const createMutation = useSupabaseMutation('profiles', {
  optimisticUpdate: true,
  onSuccess: (data) => {
    console.log('Created:', data)
  },
  onError: (error) => {
    console.error('Create failed:', error)
  },
})

// Usage
createMutation.mutate({ full_name: 'John Doe', user_id: '123' })
```

### useSupabaseUpdate

```typescript
const updateMutation = useSupabaseUpdate('profiles', {
  optimisticUpdate: true,
})

updateMutation.mutate({
  id: '123',
  full_name: 'Jane Doe',
})
```

### useSupabaseDelete

```typescript
const deleteMutation = useSupabaseDelete('profiles', {
  optimisticUpdate: true,
})

deleteMutation.mutate('123')
```

## Table Utilities

Table utilities được cung cấp trong [`src/lib/table-utils.ts`](../src/lib/table-utils.ts):

### useDataTable Hook

```typescript
const table = useDataTable({
  columns,
  data: profiles,
  isLoading,
  pageCount: 5,
  totalRows: 100,
  enableRowSelection: true,
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
  onRowSelectionChange: (selection) => console.log('Selection:', selection),
  onSortingChange: (sorting) => console.log('Sorting:', sorting),
  onPaginationChange: (pagination) => console.log('Pagination:', pagination),
})
```

### Column Utilities

```typescript
const columns = [
  // Basic column
  columnUtils.createColumn('full_name', 'Full Name'),
  
  // Sortable column
  columnUtils.createSortableColumn('created_at', 'Created At'),
  
  // Filterable column
  columnUtils.createFilterableColumn('status', 'Status'),
  
  // Custom cell column
  columnUtils.createCustomColumn('avatar', 'Avatar', ({ row }) => (
    <img src={row.original.avatar_url} alt="Avatar" />
  )),
  
  // Selection column
  columnUtils.createSelectionColumn(),
  
  // Action column
  columnUtils.createActionColumn('Actions', ({ row }) => (
    <div className="flex space-x-2">
      <Button onClick={() => editProfile(row)}>Edit</Button>
      <Button onClick={() => deleteProfile(row)}>Delete</Button>
    </div>
  )),
]
```

## Components

Enhanced table components trong [`src/components/ui/data-table.tsx`](../src/components/ui/data-table.tsx):

### DataTable

```typescript
<DataTable
  table={table.table}
  columns={columns}
  isLoading={isLoading}
  emptyMessage="No profiles found"
/>
```

### TablePagination

```typescript
<TablePagination
  table={table.table}
  totalRows={totalRows}
  pageSize={pageSize}
/>
```

### TableSearch

```typescript
<TableSearch
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search profiles..."
/>
```

### TableFilters

```typescript
<TableFilters
  filters={activeFilters}
  onFilterChange={(id, value) => updateFilter(id, value)}
  onFilterRemove={(id) => removeFilter(id)}
  onClearAll={() => clearAllFilters()}
/>
```

### TableActions

```typescript
<TableActions
  selectedCount={selectedRows.length}
  onClearSelection={() => clearSelection()}
>
  <Button onClick={() => deleteSelected()}>
    Delete Selected ({selectedRows.length})
  </Button>
</TableActions>
```

## Examples

Comprehensive examples trong [`src/components/examples/table-examples.tsx`](../src/components/examples/table-examples.tsx):

### Basic Table

```typescript
import { tableExamples } from '@/components/examples'

function MyComponent() {
  return <tableExamples.BasicTableExample />
}
```

### Advanced Table

```typescript
function MyComponent() {
  return <tableExamples.AdvancedTableExample />
}
```

### Mutation Table

```typescript
function MyComponent() {
  return <tableExamples.MutationTableExample />
}
```

### Real-time Table

```typescript
function MyComponent() {
  return <tableExamples.RealTimeTableExample />
}
```

## Best Practices

### 1. Query Keys

**DO:**
```typescript
// Hierarchical and specific
queryKeys.tables.table('profiles').list({ status: 'active' })
queryKeys.tables.table('profiles').detail(id)
```

**DON'T:**
```typescript
// Flat and generic
['profiles']
['profiles', id]
```

### 2. Error Handling

**DO:**
```typescript
const { data, error, isLoading } = useSupabaseQuery('profiles')

if (error) {
  return <ErrorDisplay error={error} />
}

if (isLoading) {
  return <LoadingSpinner />
}
```

**DON'T:**
```typescript
// Ignore error states
const { data } = useSupabaseQuery('profiles')
return data.map(/* ... */)
```

### 3. Optimistic Updates

**DO:**
```typescript
const mutation = useSupabaseMutation('profiles', {
  optimisticUpdate: true,
  onMutate: async (newData) => {
    // Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: queryKeys.tables.table('profiles').all() })
    
    // Snapshot previous data
    const previousData = queryClient.getQueryData(queryKeys.tables.table('profiles').list())
    
    // Optimistic update
    queryClient.setQueryData(queryKeys.tables.table('profiles').list(), 
      old => [...old, { ...newData, id: 'temp-id' }]
    )
    
    return { previousData }
  },
})
```

**DON'T:**
```typescript
// Update without rollback mechanism
const mutation = useSupabaseMutation('profiles', {
  onSuccess: () => {
    // No error handling
  },
})
```

### 4. Performance

**DO:**
```typescript
// Select specific columns
const { data } = useSupabaseQuery('profiles', {
  select: 'id, full_name, avatar_url', // Only needed columns
})

// Proper pagination
const { data } = useSupabaseQuery('profiles', {
  limit: 20, // Reasonable page size
})

// Cache configuration
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})
```

**DON'T:**
```typescript
// Select all columns
const { data } = useSupabaseQuery('profiles', {
  select: '*', // Inefficient
})

// Large page sizes
const { data } = useSupabaseQuery('profiles', {
  limit: 1000, // Too large
})

// No caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always fresh
      gcTime: 0, // No caching
    },
  },
})
```

## Performance Optimization

### 1. Query Optimization

```typescript
// ✅ Select specific columns
const { data } = useSupabaseQuery('profiles', {
  select: 'id, full_name, avatar_url', // Only needed fields
})

// ✅ Use filters effectively
const { data } = useSupabaseQuery('profiles', {
  filters: { 
    status: 'active',    // Server-side filter
    created_after: '2024-01-01', // Date range filter
  },
})

// ✅ Proper pagination
const { data } = useSupabaseQuery('profiles', {
  limit: 20, // Reasonable page size
  offset: page * 20, // Calculate offset
})
```

### 2. Table Performance

```typescript
// ✅ Virtualization cho large datasets
import { useVirtualizedTable } from '@/hooks/use-virtualized-table'

// ✅ Memoize expensive calculations
const columns = useMemo(() => [
  columnUtils.createColumn('name', 'Name'),
  columnUtils.createColumn('email', 'Email'),
], [])

// ✅ Efficient filtering
const filteredData = useMemo(() => {
  return data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
}, [data, searchTerm])
```

### 3. Cache Strategies

```typescript
// ✅ Appropriate stale times
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      // User data: 5 minutes (changes frequently)
      staleTime: 5 * 60 * 1000,
      
      // Reference data: 1 hour (changes rarely)
      staleTime: 60 * 60 * 1000,
      
      // Static data: 24 hours (changes very rarely)
      staleTime: 24 * 60 * 60 * 1000,
    },
  },
})

// ✅ Prefetching
const prefetchData = async () => {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.tables.table('profiles').list(),
    queryFn: () => fetchProfiles(),
  })
}

// ✅ Selective invalidation
const updateMutation = useSupabaseMutation('profiles', {
  onSuccess: (data, variables) => {
    // ✅ Only invalidate affected queries
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.tables.table('profiles').detail(variables.id) 
    })
    
    // ❌ Don't invalidate all queries
    // queryClient.invalidateQueries()
  },
})
```

## Troubleshooting

### Common Issues

1. **Query not updating**
   - Check query keys consistency
   - Verify invalidation strategies
   - Ensure proper cache keys

2. **Table performance issues**
   - Use virtualization cho large datasets
   - Optimize column definitions
   - Memoize expensive operations

3. **TypeScript errors**
   - Ensure proper type imports
   - Check database types generation
   - Verify column type definitions

### Debug Tools

1. **React Query DevTools**
   - Install browser extension
   - Inspect query cache
   - Monitor query states

2. **Console Logging**
   - Enable development logging
   - Monitor query performance
   - Track cache hits/misses

## Migration Guide

### From Basic React Query

```typescript
// ❌ Old way
import { useQuery } from 'react-query'
const { data } = useQuery('profiles', fetchProfiles)

// ✅ New way
import { useSupabaseQuery } from '@/hooks/use-supabase-query'
const { data } = useSupabaseQuery('profiles')
```

### From Basic Tables

```typescript
// ❌ Old way
<table>
  {data.map(item => (
    <tr key={item.id}>
      <td>{item.name}</td>
    </tr>
  ))}
</table>

// ✅ New way
<DataTable
  columns={columns}
  data={data}
  table={table}
/>
```

## Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Contributing

Khi contributing:

1. Follow existing patterns
2. Maintain type safety
3. Add proper error handling
4. Include examples cho new features
5. Update documentation

## Support

Nếu bạn gặp issues:

1. Check [troubleshooting](#troubleshooting) section
2. Review [best practices](#best-practices)
3. Consult official documentation
4. Create issue với detailed information