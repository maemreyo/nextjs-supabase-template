"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { flexRender } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  table: any
  columns: any[]
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

/**
 * Enhanced DataTable component với TanStack Table integration
 */
export function DataTable<TData, TValue>({
  table,
  columns,
  isLoading = false,
  emptyMessage = "No results found.",
  className,
}: DataTableProps<TData, TValue>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table className={className}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

/**
 * TablePagination component
 */
interface TablePaginationProps {
  table: any
  totalRows?: number
  pageSize?: number
  className?: string
}

export function TablePagination({
  table,
  totalRows = 0,
  pageSize = 10,
  className,
}: TablePaginationProps) {
  const pagination = table.getState().pagination
  const pageCount = table.getPageCount()
  
  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        {totalRows > 0 && (
          <span>
            Showing {pagination.pageIndex * pageSize + 1} to{" "}
            {Math.min((pagination.pageIndex + 1) * pageSize, totalRows)} of{" "}
            {totalRows} results
          </span>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={`${pagination.pageSize}`}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="h-8 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={`${size}`}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pagination.pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0",
              !table.getCanPreviousPage() && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="sr-only">Go to previous page</span>
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0",
              !table.getCanNextPage() && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="sr-only">Go to next page</span>
            {">"}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * TableSearch component
 */
interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: TableSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="sr-only">Clear search</span>
          {"×"}
        </button>
      )}
    </div>
  )
}

/**
 * TableFilters component
 */
interface TableFiltersProps {
  filters: any[]
  onFilterChange: (filterId: string, value: any) => void
  onFilterRemove: (filterId: string) => void
  onClearAll: () => void
  className?: string
}

export function TableFilters({
  filters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
  className,
}: TableFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      {filters.map((filter: any) => (
        <div
          key={filter.id}
          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-sm"
        >
          <span>{filter.label}:</span>
          <span className="font-medium">{filter.value}</span>
          <button
            onClick={() => onFilterRemove(filter.id)}
            className="ml-1 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 p-1"
          >
            <span className="sr-only">Remove filter</span>
            {"×"}
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  )
}

/**
 * TableActions component cho bulk operations
 */
interface TableActionsProps {
  selectedCount: number
  onClearSelection: () => void
  children?: React.ReactNode
  className?: string
}

export function TableActions({
  selectedCount,
  onClearSelection,
  children,
  className,
}: TableActionsProps) {
  if (selectedCount === 0 && !children) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear selection
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * ColumnVisibility component
 */
interface ColumnVisibilityProps {
  table: any
  className?: string
}

export function ColumnVisibility({
  table,
  className,
}: ColumnVisibilityProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm">Columns:</span>
      <div className="flex flex-wrap gap-1">
        {table.getAllLeafColumns().map((column: any) => (
          <label
            key={column.id}
            className="flex items-center space-x-1 text-sm"
          >
            <input
              type="checkbox"
              checked={column.getIsVisible()}
              onChange={(e) =>
                column.toggleVisibility(!!e.target.checked)
              }
              className="rounded border border-input"
            />
            <span>{column.id}</span>
          </label>
        ))}
      </div>
    </div>
  )
}