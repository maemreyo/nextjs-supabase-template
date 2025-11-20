# Zustand Stores

This directory contains all Zustand stores and their associated hooks for the Next.js Supabase template.

## Directory Structure

```
stores/
├── index.ts                    # Store exports
├── auth-store.ts              # Authentication state
├── ui-store.ts                # UI state (theme, modals, etc.)
├── app-store.ts               # Application state
├── example-feature-store.ts    # Feature store template
└── README.md                  # This file
```

## Available Stores

### 1. Auth Store (`auth-store.ts`)

Manages user authentication, profiles, and session data.

**Key Features:**
- User authentication (sign in, sign up, sign out)
- Profile management
- Session handling and refresh
- Password reset and update
- Avatar upload
- Token management

**Usage:**
```typescript
import { useAuth } from '@/hooks/stores/use-auth-store'

const { user, isAuthenticated, signIn, signOut } = useAuth()
```

### 2. UI Store (`ui-store.ts`)

Manages UI state including theme, sidebar, modals, and notifications.

**Key Features:**
- Theme management (light, dark, system)
- Sidebar state and responsive behavior
- Modal management with data
- Notification system
- Keyboard shortcuts
- Focus management
- Responsive detection

**Usage:**
```typescript
import { useUI, useTheme, useModal } from '@/hooks/stores/use-ui-store'

const { theme, setTheme } = useTheme()
const { isOpen, open, close } = useModal('modal-id')
```

### 3. App Store (`app-store.ts`)

Manages application-wide state and settings.

**Key Features:**
- Feature flags
- User preferences
- Performance metrics
- Cache management
- Error tracking
- Activity monitoring

**Usage:**
```typescript
import { useAppStore } from '@/stores/app-store'

const { features, preferences, setFeature, setPreference } = useAppStore()
```

### 4. Example Feature Store (`example-feature-store.ts`)

Template for creating feature-specific stores with CRUD operations.

**Key Features:**
- Data management (CRUD)
- Filtering and sorting
- Pagination
- Form state
- Bulk operations
- Search functionality

**Usage:**
```typescript
import { useExampleFeatureStore } from '@/stores/example-feature-store'

const { items, addItem, updateItem, removeItem } = useExampleFeatureStore()
```

## Store Patterns

### Standard Store Structure

Each store follows this pattern:

```typescript
// 1. State interface
interface StoreState {
  // State properties
}

// 2. Actions interface
interface StoreActions {
  // Action methods
}

// 3. Selectors
export const storeSelectors = {
  // Selector functions
}

// 4. Store implementation
export const useStore = create<StoreState & StoreActions>()(
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

1. **subscribeWithSelector**: Optimized subscriptions with shallow comparison
2. **devtools**: Redux DevTools integration for debugging
3. **persist**: localStorage persistence with partial state saving
4. **Custom**: Business logic and side effects

### Persistence Strategy

Only essential data is persisted to localStorage:

```typescript
{
  name: 'store-storage',
  partialize: (state) => ({
    // Only persist user preferences and settings
    theme: state.theme,
    preferences: state.preferences,
    // Don't persist temporary state like loading, errors, etc.
  }),
  version: 1,
  migrate: (persistedState, version) => {
    // Handle migrations
  }
}
```

## Custom Hooks

Each store provides multiple hooks for different use cases:

### Hook Categories

1. **Complete Hooks**: Full store access
   ```typescript
   const store = useStore()
   ```

2. **State Hooks**: Read-only access to state
   ```typescript
   const state = useStoreState()
   ```

3. **Action Hooks**: Action methods only
   ```typescript
   const actions = useStoreActions()
   ```

4. **Selector Hooks**: Specific state selectors
   ```typescript
   const value = useStoreSelector()
   ```

5. **Lifecycle Hooks**: Side effects and monitoring
   ```typescript
   useStoreInit() // Initialization
   useStoreMonitor() // Monitoring
   ```

### Hook Examples

```typescript
// Auth hooks
const auth = useAuth()                    // Complete access
const user = useAuthUser()                 // User data only
const authState = useAuthState()           // Auth state only
const authActions = useAuthActions()         // Actions only

// UI hooks
const theme = useTheme()                   // Theme management
const sidebar = useSidebar()               // Sidebar state
const modal = useModal('modal-id')         // Specific modal
const notifications = useNotifications()     // Notifications

// Specialized hooks
useSystemTheme()                        // System theme detection
useResponsiveDetection()                 // Screen size detection
useNotificationManager()                 // Auto-dismiss notifications
useKeyboardShortcutManager()             // Handle shortcuts
useFocusManager()                       // Focus management
```

## Best Practices

### 1. Store Organization

- ✅ **Separate concerns**: Different stores for different domains
- ✅ **Consistent naming**: Descriptive names for stores and actions
- ✅ **Type safety**: Always use TypeScript interfaces
- ✅ **Selective persistence**: Only persist necessary data

### 2. Hook Usage

- ✅ **Use specific hooks**: Prefer specific hooks over complete hooks
- ✅ **Optimize selectors**: Use shallow comparison for performance
- ✅ **Memoize callbacks**: Use `useCallback` for event handlers

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

## Development

### Debugging

1. **Redux DevTools**: All stores are integrated with DevTools
2. **Console logging**: Use `console.log` for debugging
3. **State inspection**: Use `useStore.getState()` to inspect current state

### Testing

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
  })
})
```

## Adding New Stores

### 1. Create Store File

```typescript
// stores/new-feature-store.ts
import { create } from 'zustand'
import { subscribeWithSelector, devtools, persist } from 'zustand/middleware'

interface NewFeatureState {
  // State properties
}

interface NewFeatureActions {
  // Action methods
}

export const useNewFeatureStore = create<NewFeatureState & NewFeatureActions>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          // State and actions
        }),
        {
          name: 'new-feature-storage',
          partialize: (state) => ({ /* persist only needed data */ }),
        }
      ),
      {
        name: 'new-feature-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
)
```

### 2. Create Selectors

```typescript
export const newFeatureSelectors = {
  basicSelector: (state: NewFeatureStore) => state.property,
  derivedSelector: (state: NewFeatureStore) => {
    // Computed values
    return state.property1 + state.property2
  },
}
```

### 3. Create Hooks

```typescript
// hooks/stores/use-new-feature-store.ts
import { useCallback } from 'react'
import { useNewFeatureStore, newFeatureSelectors } from '@/stores/new-feature-store'

export function useNewFeature() {
  return useNewFeatureStore(
    useCallback(
      (state) => ({
        // Select state and actions
      }),
      []
    )
  )
}
```

### 4. Update Exports

```typescript
// stores/index.ts
export { useNewFeatureStore, newFeatureSelectors } from './new-feature-store'
export type { NewFeatureStore, NewFeatureState, NewFeatureActions } from './new-feature-store'

// hooks/stores/index.ts
export { useNewFeature } from './use-new-feature-store'
```

### 5. Add Documentation

Update this README and the main documentation:
- Add store description
- Include usage examples
- Document best practices

## Migration from Other State Management

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

## Resources

- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Main Documentation](../../docs/zustand-usage.md)

---

For detailed usage examples and advanced patterns, see the [Zustand Usage Guide](../../docs/zustand-usage.md).