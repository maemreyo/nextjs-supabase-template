import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { useState } from 'react'

/**
 * Enhanced table options với type safety
 */
export interface UseDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  pageCount?: number
  totalRows?: number
  defaultPageSize?: number
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void
  onSortingChange?: (sorting: SortingState) => void
  onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void
  onPaginationChange?: (pagination: PaginationState) => void
}

/**
 * Hook để tạo TanStack Table với các features phổ biến
 */
export function useDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  pageCount = -1,
  totalRows = 0,
  defaultPageSize = 10,
  enableRowSelection = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  onRowSelectionChange,
  onSortingChange,
  onColumnFiltersChange,
  onPaginationChange,
}: UseDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    manualPagination: pageCount > 0,
    pageCount: pageCount > 0 ? pageCount : undefined,
    manualSorting: false,
    manualFiltering: false,
    state: {
      rowSelection: enableRowSelection ? rowSelection : undefined,
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined,
      pagination: enablePagination ? pagination : undefined,
    },
  })

  // Callback handlers để sync với external state
  const handleRowSelectionChange = (newRowSelection: RowSelectionState) => {
    setRowSelection(newRowSelection)
    onRowSelectionChange?.(newRowSelection)
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    onSortingChange?.(newSorting)
    // Reset to first page when sorting changes
    if (enablePagination) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }
  }

  const handleColumnFiltersChange = (newColumnFilters: ColumnFiltersState) => {
    setColumnFilters(newColumnFilters)
    onColumnFiltersChange?.(newColumnFilters)
    // Reset to first page when filters change
    if (enablePagination) {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }
  }

  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination)
    onPaginationChange?.(newPagination)
  }

  // Utility functions
  const resetFilters = () => {
    setColumnFilters([])
    onColumnFiltersChange?.([])
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }

  const resetSorting = () => {
    setSorting([])
    onSortingChange?.([])
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }

  const resetAll = () => {
    setRowSelection({})
    setSorting([])
    setColumnFilters([])
    setPagination({ pageIndex: 0, pageSize: defaultPageSize })
    
    onRowSelectionChange?.({})
    onSortingChange?.([])
    onColumnFiltersChange?.([])
    onPaginationChange?.({ pageIndex: 0, pageSize: defaultPageSize })
  }

  const selectedRows = (enableFiltering && table.getFilteredSelectedRowModel()?.rows) ||
                      (table.getCoreRowModel()?.rows) || []
  const selectedRowIds = selectedRows.map(row => (row.original as any).id as string)

  return {
    table,
    rowSelection,
    sorting,
    columnFilters,
    pagination,
    selectedRows,
    selectedRowIds,
    handleRowSelectionChange,
    handleSortingChange,
    handleColumnFiltersChange,
    handlePaginationChange,
    resetFilters,
    resetSorting,
    resetAll,
    isLoading,
    totalRows,
    pageCount,
  }
}

/**
 * Utility functions cho table columns
 */
export const columnUtils = {
  /**
   * Tạo column với sorting và filtering
   */
  createColumn: <TData, TValue>(
    accessorKey: keyof TData,
    header: string,
    options: Partial<ColumnDef<TData, TValue>> = {}
  ): ColumnDef<TData, TValue> => ({
    accessorKey: accessorKey as string,
    header,
    ...options,
  }),

  /**
   * Tạo sortable column
   */
  createSortableColumn: <TData, TValue>(
    accessorKey: keyof TData,
    header: string,
    options: Partial<ColumnDef<TData, TValue>> = {}
  ): ColumnDef<TData, TValue> => ({
    accessorKey: accessorKey as string,
    header,
    enableSorting: true,
    ...options,
  }),

  /**
   * Tạo filterable column
   */
  createFilterableColumn: <TData, TValue>(
    accessorKey: keyof TData,
    header: string,
    options: Partial<ColumnDef<TData, TValue>> = {}
  ): ColumnDef<TData, TValue> => ({
    accessorKey: accessorKey as string,
    header,
    enableColumnFilter: true,
    ...options,
  }),

  /**
   * Tạo column với custom cell renderer
   */
  createCustomColumn: <TData, TValue>(
    accessorKey: keyof TData,
    header: string,
    cell: (props: any) => React.ReactNode,
    options: Partial<ColumnDef<TData, TValue>> = {}
  ): ColumnDef<TData, TValue> => ({
    accessorKey: accessorKey as string,
    header,
    cell,
    ...options,
  }),

  /**
   * Tạo selection column
   */
  createSelectionColumn: <TData>(
    options: Partial<ColumnDef<TData, any>> = {}
  ): ColumnDef<TData, any> => ({
    id: 'select',
    header: ({ table }) => {
      // Return JSX element - this will be used in React component
      return React.createElement('input', {
        type: 'checkbox',
        checked: table.getIsAllPageRowsSelected(),
        onCheckedChange: (value: any) => table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Select all',
        className: 'translate-y-[2px]',
      })
    },
    cell: ({ row }) => {
      return React.createElement('input', {
        type: 'checkbox',
        checked: row.getIsSelected(),
        onCheckedChange: (value: any) => row.toggleSelected(!!value),
        'aria-label': 'Select row',
        className: 'translate-y-[2px]',
      })
    },
    enableSorting: false,
    enableHiding: false,
    ...options,
  }),

  /**
   * Tạo action column với buttons
   */
  createActionColumn: <TData>(
    header: string = 'Actions',
    cell: (props: { row: any; original: TData }) => React.ReactNode,
    options: Partial<ColumnDef<TData, any>> = {}
  ): ColumnDef<TData, any> => ({
    id: 'actions',
    header,
    cell: ({ row }) => cell({ row, original: row.original }),
    enableSorting: false,
    ...options,
  }),
}

/**
 * Utility functions cho filtering
 */
export const filterUtils = {
  /**
   * Tạo text filter
   */
  createTextFilter: (value: string) => ({
    id: 'global',
    value,
    operator: 'contains',
  }),

  /**
   * Tạo date range filter
   */
  createDateRangeFilter: (from?: string, to?: string) => ({
    id: 'dateRange',
    value: { from, to },
    operator: 'between',
  }),

  /**
   * Tạo multi-select filter
   */
  createMultiSelectFilter: (values: string[]) => ({
    id: 'multiSelect',
    value: values,
    operator: 'in',
  }),

  /**
   * Parse filter values từ URL search params
   */
  parseFromSearchParams: (searchParams: URLSearchParams) => {
    const filters: Record<string, any> = {}
    
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const filterKey = key.replace('filter_', '')
        try {
          filters[filterKey] = JSON.parse(value)
        } catch {
          filters[filterKey] = value
        }
      }
    })
    
    return filters
  },

  /**
   * Convert filters thành URL search params
   */
  toSearchParams: (filters: Record<string, any>) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(`filter_${key}`, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })
    
    return params
  },
}

/**
 * Utility functions cho pagination
 */
export const paginationUtils = {
  /**
   * Tạo pagination info
   */
  createPaginationInfo: (
    pageIndex: number,
    pageSize: number,
    totalRows: number
  ) => {
    const start = pageIndex * pageSize + 1
    const end = Math.min((pageIndex + 1) * pageSize, totalRows)
    const totalPages = Math.ceil(totalRows / pageSize)
    
    return {
      start,
      end,
      total: totalRows,
      totalPages,
      currentPage: pageIndex + 1,
      hasNextPage: pageIndex < totalPages - 1,
      hasPreviousPage: pageIndex > 0,
    }
  },

  /**
   * Parse pagination từ URL search params
   */
  parseFromSearchParams: (searchParams: URLSearchParams, defaultPageSize = 10) => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || defaultPageSize.toString(), 10)
    
    return {
      pageIndex: Math.max(0, page - 1),
      pageSize: Math.max(1, pageSize),
    }
  },

  /**
   * Convert pagination thành URL search params
   */
  toSearchParams: (pageIndex: number, pageSize: number) => {
    const params = new URLSearchParams()
    params.set('page', (pageIndex + 1).toString())
    params.set('pageSize', pageSize.toString())
    return params
  },
}

/**
 * Utility functions cho sorting
 */
export const sortingUtils = {
  /**
   * Parse sorting từ URL search params
   */
  parseFromSearchParams: (searchParams: URLSearchParams) => {
    const sort = searchParams.get('sort')
    const order = searchParams.get('order')
    
    if (!sort) return []
    
    return [{
      id: sort,
      desc: order === 'desc',
    }]
  },

  /**
   * Convert sorting thành URL search params
   */
  toSearchParams: (sorting: SortingState) => {
    const params = new URLSearchParams()
    
    if (sorting.length > 0 && sorting[0]) {
      const sort = sorting[0]
      params.set('sort', sort.id)
      params.set('order', sort.desc ? 'desc' : 'asc')
    }
    
    return params
  },
}

// Export flexRender cho convenience
export { flexRender }