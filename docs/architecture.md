# Architecture Guide

This document explains the architecture and design patterns used in this Next.js Supabase template.

## 🏗️ Overall Architecture

The template follows a modern, scalable architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │  Server Side   │    │   Database      │
│                 │    │                 │    │                 │
│ • React Hooks   │◄──►│ • API Routes    │◄──►│ • Supabase     │
│ • Components    │    │ • Server Utils  │    │ • PostgreSQL    │
│ • State Mgmt    │    │ • Auth          │    │ • Realtime      │
│ • AI Module     │    │ • AI Service    │    │ • AI Usage     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Directory Structure & Responsibilities

### `/src/app` - Next.js App Router
- **Purpose**: Route definitions and layouts
- **Patterns**: 
  - Route groups: `(auth)`, `(dashboard)`
  - Parallel routes for complex layouts
  - Server components by default
- **Key Files**:
  - `layout.tsx` - Root layout with providers
  - `page.tsx` - Route components

### `/src/components` - React Components
- **Purpose**: Reusable UI components
- **Structure**:
  ```
  components/
  ├── ui/              # Shadcn UI components
  ├── forms/            # Form-specific components
  ├── layout/           # Layout components
  ├── providers/        # React context providers
  ├── examples/         # Component examples
  └── features/         # Feature-specific components
  ```

### `/src/lib` - Business Logic & Utilities
- **Purpose**: Shared business logic and utilities
- **Structure**:
  ```
  lib/
  ├── supabase/         # Supabase client configuration
  ├── auth/              # Authentication utilities
  ├── db/               # Database operations
  ├── utils/             # General utilities
  └── validations/       # Form validation schemas
  ```

### `/src/hooks` - Custom React Hooks
- **Purpose**: Reusable stateful logic
- **Patterns**:
  - Custom hooks for API calls
  - State management hooks
  - Utility hooks

### `/src/types` - TypeScript Definitions
- **Purpose**: Type definitions and interfaces
- **Contents**:
  - Database types
  - API response types
  - Component prop types

## 🔐 Authentication Architecture

### Client-Side Authentication
```typescript
// Supabase client for browser
const supabase = createBrowserClient()

// Auth state management
const { user, loading, signOut } = useSupabase()
```

### Server-Side Authentication
```typescript
// Supabase client for server
const supabase = await createServerClient()

// Protected routes
const { data: { user } } = await supabase.auth.getUser()
```

### Auth Flow
1. **Sign In** → Client-side auth → Session stored in cookies
2. **Server Request** → Server reads session from cookies
3. **Auth Change** → Real-time sync across client/server

## 🗄️ Database Architecture

### Supabase Integration
- **Client**: Browser-based operations
- **Server**: Server-side operations with cookie auth
- **Realtime**: Live subscriptions for real-time features

### Type Safety
```typescript
// Auto-generated types
interface Database {
  public: {
    Tables: {
      users: { ... }
      profiles: { ... }
    }
  }
}
```

## 🔄 Data Flow Patterns

### Server Components (Default)
```typescript
// Direct database access
async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select()
  
  return <div>{data?.name}</div>
}
```

### Client Components
```typescript
// Use hooks for data fetching
'use client'
function ClientComponent() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers()
  })
  
  return <div>{data?.name}</div>
}
```

### API Routes
```typescript
// Server-side business logic
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // Validation, processing, database operations
  return Response.json({ success: true })
}
```

## 🎨 UI Architecture

### Component Hierarchy
```
Layout
├── Providers (Auth, Query, Theme)
├── Header
├── Main Content
│   ├── Page Components
│   └── Feature Components
└── Footer
```

### Shadcn UI Integration
- **Base Components**: Pre-built UI primitives
- **Customization**: Theme-aware through CSS variables
- **Composition**: Build complex components from primitives

## 🔧 Development Patterns

### Error Handling
```typescript
// Server-side error handling
try {
  const result = await operation()
  return Response.json(result)
} catch (error) {
  return Response.json({ error: error.message }, { status: 500 })
}

// Client-side error handling
const { data, error } = useQuery(...)
if (error) return <ErrorMessage error={error} />
```

### Loading States
```typescript
// Server components
const loading = <Skeleton />
const data = await fetchData()

// Client components
const { isPending, data } = useQuery(...)
if (isPending) return <LoadingSpinner />
```

### Form Handling
```typescript
// Validation with Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

// Form submission
const handleSubmit = async (data: FormData) => {
  const validated = schema.parse(data)
  await submitForm(validated)
}
```

## 🚀 Performance Optimizations

### Code Splitting
- Route-based: Automatic with App Router
- Component-based: Dynamic imports
- Library-based: Optimized package imports

### Data Fetching
- **React Query**: Caching, background refetching
- **Server Components**: Direct database access
- **Streaming**: Progressive UI rendering

### Bundle Optimization
- Tree shaking: Unused code elimination
- Dynamic imports: Lazy loading
- Image optimization: Next.js Image component

## 🔒 Security Considerations

### Authentication
- **JWT tokens**: Secure, httpOnly cookies
- **CSRF protection**: Built-in with Next.js
- **Route protection**: Middleware and server checks

### Data Validation
- **Input validation**: Zod schemas
- **SQL injection**: Protected by Supabase
- **XSS prevention**: React's built-in protection

### Environment Variables
- **Client-safe**: `NEXT_PUBLIC_*` only
- **Server-only**: Private keys on server
- **Type safety**: TypeScript validation

## 📏 Best Practices

### Code Organization
- **Colocation**: Related files together
- **Separation**: Client vs server logic
- **Reusability**: Shared utilities and components

### TypeScript Usage
- **Strict mode**: Enabled for type safety
- **No any**: Explicit typing preferred
- **Generated types**: Database schema types

### Testing Strategy
- **Unit tests**: Individual functions/components
- **Integration tests**: API routes and database
- **E2E tests**: User flows and interactions

This architecture provides a solid foundation for building scalable, maintainable Next.js applications with Supabase and integrated AI capabilities.

## 🧠 AI Module Architecture

### AI Service Layer
```
src/lib/ai/
├── providers/           # Multi-provider AI implementations
│   ├── openai-provider.ts
│   ├── anthropic-provider.ts
│   ├── gemini-provider.ts
│   └── cohere-provider.ts
├── models/              # AI model configurations
├── monitoring/          # Performance and usage tracking
├── prompts/             # Reusable prompt templates
├── types.ts            # TypeScript definitions
├── ai-service.ts       # Core AI service with caching
├── ai-service-client.ts # Client-side AI service
└── ai-service-server.ts # Server-side AI service
```

### AI API Routes
```
src/app/api/ai/
├── generate-text/        # Text generation endpoint
├── generate-embedding/   # Embedding generation endpoint
├── check-usage/         # Usage checking endpoint
├── models/              # Available models endpoint
└── provider-status/      # Provider health check endpoint
```

### AI Hooks
```
src/hooks/
├── useAIService.ts           # Basic AI service hook
├── useAIUsageOptimized.ts # Usage tracking hooks
└── [additional AI hooks...]
```

### AI Components
```
src/components/examples/
└── ai-examples.tsx           # Comprehensive AI integration examples
```

This AI architecture provides:
- **Multi-provider support** for flexibility and cost optimization
- **Usage tracking** with real-time monitoring
- **Smart caching** for performance and cost reduction
- **Rate limiting** with user tier management
- **Error handling** with fallback strategies
- **Type safety** throughout the stack