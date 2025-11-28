# Zustand Provider Infinite Loop Issue

## Issue Overview

Infinite loop/max update depth occurs when hooks in [`zustand-provider.tsx`](../../src/components/providers/zustand-provider.tsx) are uncommented, causing continuous re-renders and eventual application crash.

## Symptoms

- Console logs repeatedly showing:
  - `"ZustandProvider: Rendering"`
  - `"useAuthInit: Hook called"`
  - `"useAuthInit: useEffect triggered"`
- Browser error: "Uncaught Error: Maximum update depth exceeded"
- Application becomes unresponsive
- Performance degradation with increasing memory usage

## Root Cause

The infinite loop is caused by non-stable store function references in dependency arrays of hooks:

1. **Function Recreation**: Store actions (like `setInitialized`, `refreshSession`) are recreated on each render
2. **Dependency Array Issues**: These unstable functions are included in `useEffect` dependency arrays
3. **Cross-Provider Interaction**: Multiple providers (AuthSyncProvider) interacting with the same store
4. **Selector Object Recreation**: Object selectors in hooks create new references each render

### Example Problematic Code

```typescript
// In useAuthInit hook - PROBLEMATIC
const setInitialized = useAuthStore(state => state.setInitialized)
const refreshSession = useAuthStore(state => state.refreshSession)

useEffect(() => {
  // ... initialization logic
}, [setInitialized, refreshSession]) // These functions change every render
```

## Investigation Steps

1. **Uncomment hooks one-by-one** in [`zustand-provider.tsx`](../../src/components/providers/zustand-provider.tsx) to isolate the problematic hook
2. **Check dependency arrays** in all hooks for unstable references
3. **Examine store selectors** for object recreation issues
4. **Verify cross-provider interactions** that might trigger cascading updates

## Solutions

### Solution 1: Direct Store Access

Replace store function selectors with direct store access:

```typescript
// BEFORE - Problematic
const setInitialized = useAuthStore(state => state.setInitialized)
const refreshSession = useAuthStore(state => state.refreshSession)

useEffect(() => {
  // ... logic
}, [setInitialized, refreshSession])

// AFTER - Fixed
useEffect(() => {
  // ... logic
  useAuthStore.getState().setInitialized(true)
}, []) // No store functions in deps
```

### Solution 2: Remove Functions from Dependencies

Use stable selectors and remove function dependencies:

```typescript
// Only use stable values in dependencies
const isInitialized = useAuthStore(state => state.isInitialized)

useEffect(() => {
  if (!isInitialized) {
    useAuthStore.getState().refreshSession()
      .then(() => useAuthStore.getState().setInitialized(true))
  }
}, [isInitialized]) // Only depends on primitive values
```

### Solution 3: Shallow Selectors

Use shallow comparison for object selectors:

```typescript
import { shallow } from 'zustand/shallow'

// Instead of recreating objects
const authState = useAuthStore(state => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading
}), shallow) // Prevents unnecessary re-renders
```

### Solution 4: Comment Problematic Hooks

As a temporary fix, comment out hooks causing issues:

```typescript
// In zustand-provider.tsx
// useAuthInit() // Commented to prevent loop
// useAuthSessionMonitor() // Commented to prevent loop
```

## Prevention Strategies

1. **Stable Callbacks**: Always use `useCallback` with correct dependencies
2. **Single Provider**: Use only one provider per store to avoid conflicts
3. **Primitive Dependencies**: Prefer primitive values over functions/objects in dependency arrays
4. **Direct Store Access**: Use `useStore.getState()` for one-time operations
5. **Shallow Comparison**: Use `shallow` for object selectors to prevent unnecessary re-renders

## Best Practices

```typescript
// ✅ GOOD - Stable selector with shallow comparison
const user = useAuthStore(
  useCallback((state) => state.user, []),
  shallow
)

// ✅ GOOD - Direct store access for actions
useEffect(() => {
  const { refreshSession } = useAuthStore.getState()
  refreshSession()
}, [])

// ❌ BAD - Function in dependencies
const refreshSession = useAuthStore(state => state.refreshSession)
useEffect(() => {
  refreshSession()
}, [refreshSession]) // Will cause infinite loop
```

## Related Files

- [`src/components/providers/zustand-provider.tsx`](../../src/components/providers/zustand-provider.tsx) - Main provider with hooks
- [`src/hooks/stores/use-auth-store.ts`](../../src/hooks/stores/use-auth-store.ts) - Auth hooks implementation
- [`src/hooks/stores/use-ui-store.ts`](../../src/hooks/stores/use-ui-store.ts) - UI hooks implementation
- [`src/stores/auth-store.ts`](../../src/stores/auth-store.ts) - Auth store definition
- [`src/stores/ui-store.ts`](../../src/stores/ui-store.ts) - UI store definition