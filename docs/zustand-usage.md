# Zustand Usage Guide

This guide covers how to use Zustand stores in the Next.js Supabase template.

## Table of Contents

1. [Overview](#overview)
2. [Store Architecture](#store-architecture)
3. [Available Stores](#available-stores)
4. [Custom Hooks](#custom-hooks)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Advanced Patterns](#advanced-patterns)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Overview

Zustand is a small, fast, and scalable state management solution. This template includes a comprehensive Zustand setup with:

- **TypeScript support** with full type safety
- **Persistence** with localStorage
- **DevTools integration** for debugging
- **Optimized selectors** for performance
- **Custom hooks** for easy usage
- **Middleware** for common patterns

### Key Features

- ✅ **Type-safe**: Full TypeScript support with proper typing
- ✅ **Persistent**: Automatic state persistence to localStorage
- ✅ **Performant**: Optimized selectors with shallow comparison
- ✅ **Developer-friendly**: DevTools integration and debugging
- ✅ **Modular**: Separate stores for different concerns
- ✅ **Extensible**: Easy to add new stores and patterns

## Store Architecture

### Store Structure

Each store follows this structure:

```typescript
// State interface
interface StoreState {
  // State properties
}

// Actions interface  
interface StoreActions {
  // Action methods
}

// Combined store type
type Store = StoreState & StoreActions

// Store implementation
export const useStore = create<Store>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          // State and actions
        }),
        {
          name: 'store-storage',
          partialize: (state) => ({ /* persist only needed data */ }),
        }
      ),
      {
        name: 'store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)
```

### Middleware Stack

1. **subscribeWithSelector**: Optimized subscriptions
2. **devtools**: Redux DevTools integration
3. **persist**: localStorage persistence
4. **Custom middleware**: Business logic

### Selectors Pattern

```typescript
// Selectors for derived state
export const storeSelectors = {
  basicSelector: (state: Store) => state.property,
  derivedSelector: (state: Store) => {
    // Computed values
    return state.property1 + state.property2
  },
}
```

## Available Stores

### 1. Auth Store (`/stores/auth-store.ts`)

Manages authentication state and user data.

**State:**
- `user`: Supabase user object
- `profile`: User profile data
- `isAuthenticated`: Authentication status
- `isLoading`: Loading state
- `error`: Error messages
- Session data and tokens

**Actions:**
- `signIn()`, `signUp()`, `signOut()`
- `fetchProfile()`, `updateProfile()`, `uploadAvatar()`
- `resetPassword()`, `updatePassword()`
- `refreshSession()`, `clearAuth()`

**Usage:**
```typescript
import { useAuth } from '@/hooks/stores/use-auth-store'

const { user, isAuthenticated, signIn, signOut } = useAuth()
```

### 2. UI Store (`/stores/ui-store.ts`)

Manages UI state like theme, sidebar, modals.

**State:**
- `theme`: Current theme ('light', 'dark', 'system')
- `sidebarOpen`: Sidebar visibility
- `modals`: Modal states
- `notifications`: Notification queue
- `globalLoading`: Global loading state
- Responsive state and focus management

**Actions:**
- `setTheme()`, `toggleTheme()`
- `setSidebarOpen()`, `toggleSidebar()`
- `openModal()`, `closeModal()`, `toggleModal()`
- `addNotification()`, `removeNotification()`
- Layout and responsive actions

**Usage:**
```typescript
import { useUI, useTheme, useModal } from '@/hooks/stores/use-ui-store'

const { theme, setTheme } = useTheme()
const { isOpen, open, close } = useModal('example-modal')
```

### 3. App Store (`/stores/app-store.ts`)

Manages application-wide state and settings.

**State:**
- `features`: Feature flags
- `preferences`: User preferences
- `performance`: Performance metrics
- `cache`: Cache state
- `errors`: Error tracking
- `activity`: User activity

**Actions:**
- `setFeature()`, `setFeatures()`
- `setPreference()`, `setPreferences()`
- `updatePerformance()`, `addError()`
- Cache and activity management

**Usage:**
```typescript
import { useAppStore } from '@/stores/app-store'

const { features, preferences, setFeature, setPreference } = useAppStore()
```

### 4. Example Feature Store (`/stores/example-feature-store.ts`)

Template for feature-specific stores.

**State:**
- `items`: Data items
- `selectedItem`: Currently selected item
- `filters`: Filter state
- `formData`: Form state
- Pagination and loading state

**Actions:**
- CRUD operations (`addItem()`, `updateItem()`, `removeItem()`)
- Selection management (`selectItem()`, `selectAll()`)
- Filter and sort actions
- Form and bulk actions

**Usage:**
```typescript
import { useExampleFeatureStore } from '@/stores/example-feature-store'

const { items, addItem, updateItem, removeItem } = useExampleFeatureStore()
```

## Custom Hooks

### Auth Hooks

```typescript
// Complete auth hook
const auth = useAuth()

// Specific auth hooks
const user = useAuthUser()
const profile = useAuthProfile()
const authState = useAuthState()
const authActions = useAuthActions()
const userInfo = useUserInfo()
const permissions = useAuthPermissions()

// Lifecycle hooks
useAuthInit() // Initialize auth
useAuthSessionMonitor() // Monitor session
```

### UI Hooks

```typescript
// Complete UI hook
const ui = useUI()

// Specific UI hooks
const theme = useTheme()
const sidebar = useSidebar()
const modals = useModals()
const notifications = useNotifications()
const responsive = useResponsive()
const shortcuts = useKeyboardShortcuts()

// Specialized hooks
const modal = useModal('modal-id')
useSystemTheme() // Detect system theme
useResponsiveDetection() // Detect screen size
useNotificationManager() // Auto-dismiss notifications
useKeyboardShortcutManager() // Handle shortcuts
useFocusManager() // Manage focus
useSidebarResponsive() // Responsive sidebar
```

### Store Hooks Pattern

Each store has multiple hooks for different use cases:

1. **Complete Hook**: All state and actions
2. **State Hooks**: Only state properties
3. **Action Hooks**: Only action methods
4. **Selector Hooks**: Specific selectors
5. **Lifecycle Hooks**: Side effects and monitoring

## Usage Examples

### Basic Auth Usage

```typescript
'use client'

import { useAuth } from '@/hooks/stores/use-auth-store'

export function UserProfile() {
  const { user, profile, isAuthenticated, signOut } = useAuth()
  
  if (!isAuthenticated) {
    return <p>Please sign in.</p>
  }
  
  return (
    <div>
      <h1>Welcome, {profile?.full_name || user?.email}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Theme Management

```typescript
'use client'

import { useTheme } from '@/hooks/stores/use-ui-store'

export function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value as any)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  )
}
```

### Modal Management

```typescript
'use client'

import { useModal } from '@/hooks/stores/use-ui-store'

export function ExampleModal() {
  const { isOpen, data, open, close } = useModal('example-modal')
  
  return (
    <>
      <button onClick={() => open({ message: 'Hello!' })}>
        Open Modal
      </button>
      
      {isOpen && (
        <div className="modal">
          <h2>Modal Content</h2>
          <p>{data?.message}</p>
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  )
}
```

### Feature Store Usage

```typescript
'use client'

import { useExampleFeatureStore, exampleFeatureSelectors } from '@/stores/example-feature-store'

export function ExampleList() {
  const { 
    items, 
    loading, 
    error, 
    addItem, 
    updateItem, 
    removeItem,
    filters,
    setFilters 
  } = useExampleFeatureStore()
  
  const filteredItems = exampleFeatureSelectors.filteredItems(useExampleFeatureStore.getState())
  
  return (
    <div>
      {/* Filter controls */}
      <select 
        value={filters.category} 
        onChange={(e) => setFilters({ category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="demo">Demo</option>
        <option value="test">Test</option>
      </select>
      
      {/* Items list */}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>
            {item.title}
            <button onClick={() => removeItem(item.id)}>Delete</button>
          </li>
        ))}
      </ul>
      
      <button onClick={() => addItem({
        id: `new-${Date.now()}`,
        title: 'New Item',
        description: 'Description',
        category: 'demo',
        tags: [],
        status: 'draft',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user',
      })}>
        Add Item
      </button>
    </div>
  )
}
```

## Best Practices

### 1. Store Organization

- **Separate concerns**: Different stores for different domains
- **Consistent naming**: Use descriptive names for stores and actions
- **Type safety**: Always use TypeScript interfaces
- **Selective persistence**: Only persist necessary data

### 2. Hook Usage

- **Use specific hooks**: Prefer specific hooks over complete hooks
- **Optimize selectors**: Use shallow comparison for performance
- **Memoize callbacks**: Use `useCallback` for event handlers

### 3. Performance

```typescript
// ✅ Good - Use specific hooks
const { theme, setTheme } = useTheme()

// ❌ Avoid - Complete hook when not needed
const { theme, setTheme, sidebarOpen, modals, ... } = useUI()

// ✅ Good - Optimized selector
const items = useStore(state => state.items.filter(item => item.active))

// ❌ Avoid - Unnecessary re-renders
const items = useStore(state => state.items).filter(item => item.active)
```

### 4. Error Handling

```typescript
// ✅ Good - Handle errors in actions
const handleSubmit = async () => {
  try {
    await signIn(email, password)
  } catch (error) {
    // Error is handled by store, show user feedback
    console.error('Sign in failed:', error)
  }
}

// ✅ Good - Check error state
const { error, clearError } = useAuth()
if (error) {
  return <ErrorMessage error={error} onDismiss={clearError} />
}
```

### 5. TypeScript Usage

```typescript
// ✅ Good - Type-safe selectors
const user = useAuthStore(state => state.user)
const isLoading = useAuthStore(state => state.isLoading)

// ✅ Good - Type-safe actions
const { signIn, signOut } = useAuthActions()

// ❌ Avoid - Any types
const data = useStore(state => state.anyProperty as any)
```

## Advanced Patterns

### 1. Store Composition

```typescript
// Combine multiple stores
export function useAppData() {
  const auth = useAuth()
  const ui = useUI()
  const app = useAppStore()
  
  return {
    user: auth.user,
    theme: ui.theme,
    features: app.features,
    // Computed values
    isReady: auth.isInitialized && !ui.globalLoading,
  }
}
```

### 2. Async Actions

```typescript
// Async action with loading and error handling
const fetchUserData: (state) => async (userId: string) => {
  state.setLoading(true)
  state.setError(null)
  
  try {
    const data = await api.fetchUser(userId)
    state.setUser(data)
  } catch (error) {
    state.setError(error.message)
  } finally {
    state.setLoading(false)
  }
}
```

### 3. Optimistic Updates

```typescript
// Optimistic update pattern
const updateItemOptimistic: (state) => async (id: string, updates: any) => {
  // Update immediately
  state.updateItem(id, updates)
  
  try {
    await api.updateItem(id, updates)
  } catch (error) {
    // Revert on error
    state.updateItem(id, { ...updates, error: error.message })
  }
}
```

### 4. Custom Middleware

```typescript
// Custom middleware for logging
const loggerMiddleware = (config) => (set, get, api) => {
  const loggedSet: typeof set = (...args) => {
    console.log('State update:', args)
    return set(...args)
  }
  
  return config(loggedSet, get, api)
}

// Usage
export const useStore = create<Store>()(
  loggerMiddleware(
    devtools(
      persist(/* ... */)
    )
  )
)
```

## Testing

### 1. Store Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'

describe('Auth Store', () => {
  it('should set user', () => {
    const { result } = renderHook(() => useAuthStore())
    
    act(() => {
      result.current.setUser({ id: '1', email: 'test@example.com' })
    })
    
    expect(result.current.user).toEqual({ id: '1', email: 'test@example.com' })
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### 2. Hook Testing

```typescript
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/stores/use-auth-store'

describe('useAuth Hook', () => {
  it('should return auth state', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signOut')
  })
})
```

### 3. Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { UserProfile } from '@/components/UserProfile'

describe('UserProfile Component', () => {
  it('should show user profile when authenticated', () => {
    render(<UserProfile />)
    
    expect(screen.queryByText('Please sign in')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
  })
})
```

## Troubleshooting

### Common Issues

1. **State not persisting**
   - Check `partialize` function in persist config
   - Verify localStorage availability
   - Check for quota exceeded errors

2. **Performance issues**
   - Use specific hooks instead of complete hooks
   - Optimize selectors with shallow comparison
   - Avoid unnecessary re-renders

3. **TypeScript errors**
   - Ensure proper typing of state and actions
   - Check selector return types
   - Verify middleware chain types

4. **DevTools not working**
   - Ensure `enabled: process.env.NODE_ENV === 'development'`
   - Check Redux DevTools extension
   - Verify store name uniqueness

### Debug Tips

```typescript
// Enable debug logging
const useStore = create<Store>()(
  devtools(
    persist(/* ... */),
    {
      name: 'store',
      enabled: true, // Always enable for debugging
    }
  )
)

// Log state changes
useStore.subscribe(
  (state) => state.someProperty,
  (value) => console.log('Property changed:', value)
)

// Debug selectors
console.log('Current state:', useStore.getState())
```

## Migration Guide

### From Redux

1. **Replace reducers with Zustand actions**
2. **Use hooks instead of connect**
3. **Remove middleware setup**
4. **Update component patterns**

### From Context API

1. **Extract state to stores**
2. **Replace useContext with store hooks**
3. **Add persistence and DevTools**
4. **Optimize re-renders**

## Resources

- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)

## Contributing

When adding new stores:

1. Follow the established patterns
2. Include TypeScript types
3. Add comprehensive selectors
4. Create custom hooks
5. Write tests and documentation
6. Update this guide

---

This guide provides a comprehensive overview of Zustand usage in this template. For specific implementation details, refer to the individual store files and hook implementations.