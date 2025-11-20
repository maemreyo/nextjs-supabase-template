# Quick Reference Guide

Tham khảo nhanh các commands, patterns và utilities cho Next.js Supabase Template.

## 🚀 Commands

### Development Commands

```bash
# Khởi động development server
npm run dev

# Khởi động với port tùy chỉnh
npm run dev -- --port 3001

# Build cho production
npm run build

# Start production server
npm start

# Khởi động với environment tùy chỉnh
NODE_ENV=production npm run dev
```

### Code Quality Commands

```bash
# Run ESLint
npm run lint

# Fix ESLint issues tự động
npm run lint:fix

# Type checking
npm run type-check

# Format code với Prettier
npm run format

# Check formatting
npm run format:check
```

### Testing Commands

```bash
# Run tất cả tests
npm run test

# Run tests trong watch mode
npm run test:watch

# Run tests với coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests với UI
npm run test:e2e:ui

# Run smoke tests
npm run test:smoke
```

### Database Commands

```bash
# Generate types từ local database
npm run db:generate

# Generate types từ remote database
npm run db:generate-types-remote

# Push migrations đến database
npm run db:push

# Reset database
npm run db:reset

# Seed database với test data
npm run db:seed

# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

### Supabase Commands

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check Supabase status
npm run supabase:status

# Migrate database
npm run db:migrate
```

### AI Module Commands

```bash
# Test AI providers
npm run ai:test-providers

# Generate AI usage report
npm run ai:usage-report

# Clear AI cache
npm run ai:cache-clear
```

### Utility Commands

```bash
# Setup development environment
npm run dev:setup

# Cleanup project
npm run cleanup

# Analyze bundle size
npm run bundle:analyze

# Install dependencies
npm install

# Install với exact versions
npm install --save-exact
```

## 🎨 Component Patterns

### Basic Component Structure

```typescript
// src/components/example-component.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ExampleComponentProps {
  title: string
  className?: string
  children?: React.ReactNode
}

export function ExampleComponent({ 
  title, 
  className, 
  children 
}: ExampleComponentProps) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('Component mounted')
    return () => console.log('Component unmounted')
  }, [])
  
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>Count: {count}</div>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
        {children}
      </CardContent>
    </Card>
  )
}
```

### Form Component Pattern

```typescript
// src/components/forms/contact-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormValues = z.infer<typeof formSchema>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Submit form logic
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Input placeholder="Your message" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </Form>
  )
}
```

### Data Table Component Pattern

```typescript
// src/components/tables/data-table.tsx
'use client'

import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getVisibilityRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(table),
    getPaginationRowModel: getPaginationRowModel(table),
    getSortedRowModel: getSortedRowModel(table),
    getFilteredRowModel: getFilteredRowModel(table),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  return (
    <div className="w-full">
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={`Filter ${searchKey}...`}
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## 🔧 Hook Patterns

### Custom Hook for API Calls

```typescript
// src/hooks/use-api.ts
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface UseApiOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useApi<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const query = useQuery({
    queryKey: key,
    queryFn: fetcher,
    enabled: options.immediate !== false,
    onSuccess: options.onSuccess,
    onError: options.onError,
  })
  
  const mutation = useMutation({
    mutationFn: fetcher,
    onSuccess: (data) => {
      setData(data)
      options.onSuccess?.(data)
    },
    onError: (error) => {
      setError(error)
      options.onError?.(error)
    },
  })
  
  const execute = useCallback(() => {
    mutation.mutate()
  }, [mutation])
  
  return {
    data: query.data,
    loading: query.isLoading || mutation.isPending,
    error: query.error || mutation.error,
    execute,
    refetch: query.refetch,
  }
}
```

### Authentication Hook

```typescript
// src/hooks/use-auth.ts
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    
    getSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }
  
  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Local Storage Hook

```typescript
// src/hooks/use-local-storage.ts
import { useState, useEffect } from 'react'

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }
  
  const [storedValue, setStoredValue] = useState<T>(readValue)
  
  const setValue = (value: T) => {
    try {
      // Save state
      setStoredValue(value)
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }
  
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])
  
  return [storedValue, setValue]
}

export default useLocalStorage
```

## 🗄️ Database Patterns

### Server Component Data Fetching

```typescript
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getUserData(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { profile, projects }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { profile, projects } = await getUserData(user.id)
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        Welcome, {profile?.full_name || user.email}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <div key={project.id} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### API Route Pattern

```typescript
// src/app/api/projects/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Database Utility Functions

```typescript
// src/lib/database/projects.ts
import { createClient } from '@/lib/supabase/server'

export async function getProjects(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  }
  
  return data
}

export async function createProject(project: {
  name: string
  description?: string
  user_id: string
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }
  
  return data
}

export async function updateProject(
  id: string,
  updates: Partial<{
    name: string
    description: string
  }>
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating project:', error)
    throw new Error('Failed to update project')
  }
  
  return data
}

export async function deleteProject(id: string, userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Security check
  
  if (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  }
  
  return true
}
```

## 🎨 Styling Patterns

### Tailwind Utility Classes

```css
/* Common spacing patterns */
.space-y-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
.space-y-4 { margin-top: 1rem; margin-bottom: 1rem; }
.space-x-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
.space-x-4 { margin-left: 1rem; margin-right: 1rem; }

/* Common layouts */
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.grid-auto { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }

/* Common card styles */
.card { @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700; }
.card-hover { @apply transition-shadow hover:shadow-md; }

/* Common button styles */
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded; }
.btn-secondary { @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded; }
```

### CSS Variables for Theming

```css
/* src/app/globals.css */
:root {
  /* Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Borders */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  
  /* Radius */
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

## 🔒 Security Patterns

### Input Validation

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
})

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data)
}
```

### Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  const ip = request.ip || 'unknown'
  const now = Date.now()
  
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    // First request or window reset
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// Usage in API route
export async function GET(request: NextRequest) {
  const rateLimitResult = rateLimit(request, 10, 60 * 1000) // 10 requests per minute
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        }
      }
    )
  }
  
  // Continue with request...
}
```

### Environment Variable Validation

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
```

## 🧪 Testing Patterns

### Component Testing

```typescript
// tests/components/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary')
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass('bg-destructive')
  })
  
  it('is disabled when loading', () => {
    render(<Button disabled>Loading</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toBeDisabled()
  })
})
```

### API Testing

```typescript
// tests/api/projects.test.ts
import { createApp } from '@/app/api/projects/route'
import { NextRequest } from 'next/server'

describe('/api/projects', () => {
  it('returns projects for authenticated user', async () => {
    const request = new Request('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': 'Bearer valid-token',
        'Cookie': 'session=valid-session'
      }
    })
    
    const response = await createApp(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
  
  it('rejects unauthenticated requests', async () => {
    const request = new Request('http://localhost:3000/api/projects')
    
    const response = await createApp(request)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })
})
```

### Mock Utilities

```typescript
// tests/mocks/supabase.ts
import { jest } from '@jest/globals'

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
}

export const mockSupabaseServer = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { id: '1', name: 'Test Project' },
          error: null,
        })),
      })),
    })),
  })),
}
```

## 📊 Performance Patterns

### Code Splitting

```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(
  () => import('@/components/heavy-component'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false, // Client-side only
  }
)

// Dynamic imports for routes
const AdminPage = dynamic(() => import('@/app/admin/page'), {
  loading: () => <div>Loading admin...</div>,
})
```

### Image Optimization

```typescript
// Optimized image component
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 300,
  priority = false 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="transition-opacity duration-300"
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  )
}
```

### Memoization

```typescript
// Expensive component with memo
import { memo, useMemo } from 'react'

interface ExpensiveComponentProps {
  data: number[]
  filter: string
}

export const ExpensiveComponent = memo<ExpensiveComponentProps>(({ data, filter }) => {
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.toString().toLowerCase().includes(filter.toLowerCase())
    )
  }, [data, filter])
  
  const processedData = useMemo(() => {
    return filteredData.map(item => ({
      value: item,
      squared: item * item,
      cubed: item * item * item,
    }))
  }, [filteredData])
  
  return (
    <div>
      {processedData.map((item, index) => (
        <div key={index}>
          {item.value}² = {item.squared}, {item.value}³ = {item.cubed}
        </div>
      ))}
    </div>
  )
})

ExpensiveComponent.displayName = 'ExpensiveComponent'
```

## 🔧 Utility Functions

### Date Formatting

```typescript
// src/lib/utils/date.ts
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}
```

### String Utilities

```typescript
// src/lib/utils/string.ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
```

### Array Utilities

```typescript
// src/lib/utils/array.ts
export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    groups[groupKey] = groups[groupKey] || []
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

---

## 📞 Quick Help

### Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Build fails with TypeScript errors | Run `npm run type-check` to identify issues |
| Supabase connection not working | Check environment variables and network connectivity |
| CSS not applying correctly | Verify Tailwind CSS imports and class names |
| Tests failing in CI | Check environment setup and test configuration |
| Performance issues | Use `npm run bundle:analyze` to identify large bundles |

### Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Shadcn UI Components](https://ui.shadcn.com)

### Keyboard Shortcuts (VS Code)

| Shortcut | Action |
|---------|--------|
| `Cmd/Ctrl + P` | Command palette |
| `Cmd/Ctrl + Shift + P` | Show command palette with `>` |
| `Cmd/Ctrl + /` | Toggle comment |
| `Cmd/Ctrl + .` | Quick fix |
| `F12` | Go to definition |
| `Shift + F12` | Go to implementation |
| `Cmd/Ctrl + G` | Go to line |
| `Cmd/Ctrl + Shift + F` | Find in files |

---

Đây là reference nhanh cho các patterns và utilities phổ biến. Tham khảo [documentation chi tiết](./) để biết thêm thông tin! 🚀