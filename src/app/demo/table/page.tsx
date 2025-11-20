"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tableExamples } from "@/components/examples"

export default function TableDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">TanStack Query & Table Demo</h1>
          <p className="text-muted-foreground">
            Comprehensive examples showcasing TanStack Query and TanStack Table integration with Supabase
          </p>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Table</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Table</TabsTrigger>
            <TabsTrigger value="mutations">Mutations</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Table Example</CardTitle>
                <CardDescription>
                  Simple table displaying profiles from Supabase with basic sorting and pagination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <tableExamples.BasicTableExample />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Table Example</CardTitle>
                <CardDescription>
                  Table with search, filtering, row selection, bulk actions, and column visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <tableExamples.AdvancedTableExample />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mutations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mutation Table Example</CardTitle>
                <CardDescription>
                  Table with optimistic updates for create, update, and delete operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <tableExamples.MutationTableExample />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Table Example</CardTitle>
                <CardDescription>
                  Table with automatic polling for real-time updates (every 30 seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <tableExamples.RealTimeTableExample />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Features Overview</CardTitle>
            <CardDescription>
              Key features implemented in this template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">TanStack Query Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Enhanced error handling and retry logic</li>
                  <li>• Optimistic updates with rollback</li>
                  <li>• Structured query keys system</li>
                  <li>• Automatic cache invalidation</li>
                  <li>• TypeScript type safety</li>
                  <li>• React Query DevTools integration</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">TanStack Table Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sorting and multi-column sorting</li>
                  <li>• Advanced filtering capabilities</li>
                  <li>• Pagination with customizable page sizes</li>
                  <li>• Row selection and bulk actions</li>
                  <li>• Column visibility toggle</li>
                  <li>• Responsive design</li>
                  <li>• Virtual scrolling ready</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Integration Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seamless Supabase integration</li>
                  <li>• Shadcn UI components</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Performance optimized</li>
                  <li>• Developer experience focused</li>
                  <li>• Production ready patterns</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Developer Tools</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React Query DevTools</li>
                  <li>• TypeScript IntelliSense</li>
                  <li>• Error boundary integration</li>
                  <li>• Comprehensive documentation</li>
                  <li>• Built-in examples</li>
                  <li>• Performance monitoring</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              How to use TanStack Query and Table in your components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Import Hooks</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm">
{`import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase-query'
import { useDataTable, columnUtils } from '@/lib/table-utils'`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2. Define Columns</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm">
{`const columns = [
  columnUtils.createSortableColumn('name', 'Name'),
  columnUtils.createFilterableColumn('status', 'Status'),
  columnUtils.createActionColumn('Actions', ({ row }) => (
    <Button onClick={() => editRow(row)}>Edit</Button>
  )),
]`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">3. Use Table Hook</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm">
{`const table = useDataTable({
  columns,
  data: profiles,
  enableRowSelection: true,
  enableSorting: true,
  enableFiltering: true,
  onRowSelectionChange: (selection) => console.log('Selected:', selection),
})`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">4. Fetch Data</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm">
{`const { data, isLoading, error } = useSupabaseQuery('profiles', {
  select: 'id, name, email',
  orderBy: { column: 'created_at', ascending: false },
  filters: { status: 'active' },
})`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">5. Render Table</h4>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-sm">
{`<DataTable
  table={table.table}
  columns={columns}
  isLoading={isLoading}
  emptyMessage="No profiles found"
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}