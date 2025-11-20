"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DataTable, 
  TableSearch, 
  TableFilters, 
  TableActions,
  TablePagination,
  ColumnVisibility,
} from "@/components/ui/data-table"
import { useDataTable, columnUtils, filterUtils, paginationUtils } from "@/lib/table-utils"
import { useSupabaseQuery, useSupabaseMutation, useSupabaseDelete, useSupabaseUpdate } from "@/hooks/use-supabase-query"
import { queryKeys } from "@/lib/query-keys"
import { flexRender } from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { Database } from "@/types/database"

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Basic Table Example
 */
export function BasicTableExample() {
  const { data: profiles, isLoading, error } = useSupabaseQuery('profiles', {
    select: 'id, user_id, full_name, avatar_url, updated_at',
    orderBy: { column: 'updated_at', ascending: false },
    limit: 50,
  })

  const columns: ColumnDef<Profile>[] = [
    columnUtils.createColumn('id', 'ID'),
    columnUtils.createColumn('full_name', 'Full Name'),
    columnUtils.createColumn('user_id', 'User ID'),
    columnUtils.createColumn('updated_at', 'Updated At'),
  ]

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Failed to load profiles data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Table Example</CardTitle>
        <CardDescription>
          Simple table displaying profiles from Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={profiles || []}
          isLoading={isLoading}
          emptyMessage="No profiles found"
        />
      </CardContent>
    </Card>
  )
}

/**
 * Advanced Table Example với sorting, filtering, pagination
 */
export function AdvancedTableExample() {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<any[]>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: profiles, isLoading } = useSupabaseQuery('profiles', {
    filters: globalFilter ? { full_name: globalFilter } : undefined,
    select: 'id, user_id, full_name, avatar_url, updated_at',
    limit: 20,
  })

  const columns: ColumnDef<Profile>[] = [
    columnUtils.createSelectionColumn<Profile>(),
    columnUtils.createSortableColumn('full_name', 'Full Name'),
    columnUtils.createSortableColumn('user_id', 'User ID'),
    columnUtils.createSortableColumn('updated_at', 'Updated At', {
      cell: ({ row }) => {
        const date = new Date(row.getValue('updated_at'))
        return date.toLocaleDateString()
      },
    }),
    columnUtils.createActionColumn('Actions', ({ row }) => (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => console.log('View:', row.original)}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => console.log('Edit:', row.original)}
        >
          Edit
        </Button>
      </div>
    )),
  ]

  const table = useDataTable({
    columns,
    data: profiles || [],
    isLoading,
    enableRowSelection: true,
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    defaultPageSize: 10,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (sorting) => console.log('Sorting changed:', sorting),
    onColumnFiltersChange: (filters) => setColumnFilters(filters),
    onPaginationChange: (pagination) => console.log('Pagination changed:', pagination),
  })

  const selectedRows = table.selectedRows
  const selectedCount = selectedRows.length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Table Example</CardTitle>
          <CardDescription>
            Table with sorting, filtering, pagination, and row selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <TableSearch
              value={globalFilter}
              onChange={setGlobalFilter}
              placeholder="Search by name..."
              className="w-64"
            />
            {columnFilters.length > 0 && (
              <TableFilters
                filters={columnFilters}
                onFilterChange={(id, value) => {
                  const newFilters = columnFilters.filter(f => f.id !== id)
                  if (value) {
                    newFilters.push({ id, label: id, value })
                  }
                  setColumnFilters(newFilters)
                }}
                onFilterRemove={(id) => {
                  setColumnFilters(columnFilters.filter(f => f.id !== id))
                }}
                onClearAll={() => setColumnFilters([])}
              />
            )}
          </div>

          {/* Actions */}
          <TableActions
            selectedCount={selectedCount}
            onClearSelection={() => {
              table.resetAll()
              setRowSelection({})
            }}
          >
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedCount === 0}
              onClick={() => {
                console.log('Delete selected:', selectedRows)
                // Implement bulk delete logic here
              }}
            >
              Delete Selected ({selectedCount})
            </Button>
          </TableActions>

          {/* Column Visibility */}
          <ColumnVisibility table={table.table} />

          {/* Table */}
          <DataTable
            table={table.table}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No profiles found"
          />

          {/* Pagination */}
          <TablePagination
            table={table.table}
            totalRows={profiles?.length}
            pageSize={table.pagination.pageSize}
          />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Mutation Table Example với optimistic updates
 */
export function MutationTableExample() {
  const [newProfile, setNewProfile] = React.useState({
    full_name: '',
    user_id: '',
  })
  const [isCreating, setIsCreating] = React.useState(false)

  const { data: profiles, isLoading, refetch } = useSupabaseQuery('profiles', {
    select: 'id, user_id, full_name, avatar_url, updated_at',
    orderBy: { column: 'updated_at', ascending: false },
  })

  const createMutation = useSupabaseMutation('profiles', {
    optimisticUpdate: true,
    onSuccess: () => {
      setNewProfile({ full_name: '', user_id: '' })
      setIsCreating(false)
      refetch()
    },
    onError: (error) => {
      console.error('Create error:', error)
      setIsCreating(false)
    },
  })

  const updateMutation = useSupabaseUpdate('profiles', {
    optimisticUpdate: true,
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      console.error('Update error:', error)
    },
  })

  const deleteMutation = useSupabaseDelete('profiles', {
    optimisticUpdate: true,
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      console.error('Delete error:', error)
    },
  })

  const handleCreate = () => {
    if (!newProfile.full_name || !newProfile.user_id) {
      alert('Please fill in all fields')
      return
    }
    setIsCreating(true)
    createMutation.mutate(newProfile as any)
  }

  const handleUpdate = (profile: Profile) => {
    const newName = prompt('Enter new name:', profile.full_name)
    if (newName && newName !== profile.full_name) {
      updateMutation.mutate({
        id: profile.id,
        full_name: newName,
      })
    }
  }

  const handleDelete = (profile: Profile) => {
    if (confirm(`Are you sure you want to delete ${profile.full_name}?`)) {
      deleteMutation.mutate(profile.id)
    }
  }

  const columns: ColumnDef<Profile>[] = [
    columnUtils.createColumn('full_name', 'Name', {
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span>{row.getValue('full_name')}</span>
          {createMutation.isPending && row.original.full_name === newProfile.full_name && (
            <Badge variant="secondary">Creating...</Badge>
          )}
          {updateMutation.isPending && (
            <Badge variant="secondary">Updating...</Badge>
          )}
          {deleteMutation.isPending && (
            <Badge variant="destructive">Deleting...</Badge>
          )}
        </div>
      ),
    }),
    columnUtils.createColumn('user_id', 'User ID'),
    columnUtils.createColumn('updated_at', 'Updated At', {
      cell: ({ row }) => {
        const date = new Date(row.getValue('updated_at'))
        return date.toLocaleDateString()
      },
    }),
    columnUtils.createActionColumn('Actions', ({ row }) => (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdate(row)}
          disabled={updateMutation.isPending || deleteMutation.isPending}
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(row)}
          disabled={updateMutation.isPending || deleteMutation.isPending}
        >
          Delete
        </Button>
      </div>
    )),
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mutation Table Example</CardTitle>
          <CardDescription>
            Table with optimistic updates for create, update, and delete operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create Form */}
          <div className="flex items-end space-x-2">
            <Input
              placeholder="Full name"
              value={newProfile.full_name}
              onChange={(e) => setNewProfile(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="User ID"
              value={newProfile.user_id}
              onChange={(e) => setNewProfile(prev => ({ ...prev, user_id: e.target.value }))}
              className="w-48"
            />
            <Button
              onClick={handleCreate}
              disabled={isCreating || createMutation.isPending}
            >
              {isCreating ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={profiles || []}
            isLoading={isLoading}
            emptyMessage="No profiles found. Create your first profile above!"
          />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Real-time Table Example với polling
 */
export function RealTimeTableExample() {
  const { data: profiles, isLoading, refetch } = useSupabaseQuery('profiles', {
    select: 'id, user_id, full_name, avatar_url, updated_at',
    orderBy: { column: 'updated_at', ascending: false },
    // Refetch every 30 seconds
    refetchInterval: 30000,
  })

  React.useEffect(() => {
    console.log('Profiles updated:', profiles?.length)
  }, [profiles])

  const columns: ColumnDef<Profile>[] = [
    columnUtils.createColumn('full_name', 'Full Name'),
    columnUtils.createColumn('user_id', 'User ID'),
    columnUtils.createColumn('updated_at', 'Last Updated', {
      cell: ({ row }) => {
        const date = new Date(row.getValue('updated_at'))
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        
        return (
          <div className="flex items-center space-x-2">
            <span>{date.toLocaleTimeString()}</span>
            {diffMins < 1 && (
              <Badge variant="secondary">Just now</Badge>
            )}
            {diffMins >= 1 && diffMins < 5 && (
              <Badge variant="outline">{diffMins}m ago</Badge>
            )}
          </div>
        )
      },
    }),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Table Example</CardTitle>
        <CardDescription>
          Table with automatic polling for real-time updates (every 30 seconds)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            {profiles?.length || 0} profiles loaded
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Refresh Now
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={profiles || []}
          isLoading={isLoading}
          emptyMessage="No profiles found"
        />
      </CardContent>
    </Card>
  )
}

/**
 * Export all examples
 */
export const tableExamples = {
  BasicTableExample,
  AdvancedTableExample,
  MutationTableExample,
  RealTimeTableExample,
}