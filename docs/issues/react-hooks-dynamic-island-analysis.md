# React Hooks Violation - DynamicIslandAnalysis

## Error Message
"Rendered more hooks than during the previous render."

## Stack Trace Pattern
AnalysisEditor ErrorBoundary -> DynamicIslandAnalysis -> useMemo

## Affected Files
- src/components/ui/dynamic-island-analysis/index.tsx

## Root Cause
Multiple early returns before all hooks:
- if (!props.isVisible) return null;
- if (isCollapsed) return <CompactView/>;
- if (!current) return loading/error;
- Later useMemo/useCallback not called consistently.

## Solution Applied
1. Move ALL hooks (useState, useEffect, useMemo, etc.) to TOP of component before ANY conditionals.
2. Single return with nested conditional JSX: {props.isVisible && (isCollapsed ? <Compact/> : (!current ? ... : <Main/>))}
3. Ensure fallback values for TS (e.g., variantStyles['default']).

## Verification
Error resolved; component renders consistently.

## Date Fixed
2025-11-29

## Related Components
AnalysisEditor, useAnalysisDynamicIsland

## Detailed Analysis

### Problem Explanation

React hooks must be called in the same order on every render. When a component has conditional returns before all hooks are called, React will detect a different number of hooks being called between renders, resulting in the "Rendered more hooks than during the previous render" error.

In the DynamicIslandAnalysis component, the issue occurred because:

1. The component had multiple early conditional returns based on props and state
2. These returns happened before all hooks (particularly useMemo) were called
3. When conditions changed between renders, different numbers of hooks were executed
4. React's hooks tracking mechanism detected this inconsistency and threw an error

### Code Examples

#### Before Fix (Problematic Code)

```typescript
function DynamicIslandAnalysis(props) {
  // Early return before all hooks
  if (!props.isVisible) return null;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Another early return before all hooks
  if (isCollapsed) return <CompactView />;
  
  const { current, loading, error } = useAnalysisDynamicIsland(props.id);
  
  // Yet another early return before all hooks
  if (!current) return loading ? <LoadingSpinner /> : <ErrorMessage error={error} />;
  
  // This hook might not be called consistently due to early returns above
  const variantStyles = useMemo(() => {
    return getVariantStyles(current.variant);
  }, [current.variant]);
  
  return <ExpandedView styles={variantStyles} />;
}
```

#### After Fix (Correct Code)

```typescript
function DynamicIslandAnalysis(props) {
  // ALL hooks are called first, before any conditionals
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { current, loading, error } = useAnalysisDynamicIsland(props.id);
  
  // Memoized values with fallbacks
  const variantStyles = useMemo(() => {
    if (!current) return variantStyles['default']; // Fallback for TS
    return getVariantStyles(current.variant);
  }, [current?.variant]); // Optional chaining to prevent errors
  
  // Single return with conditional JSX
  return (
    <>
      {props.isVisible && (
        isCollapsed ? (
          <CompactView />
        ) : (
          !current ? (
            loading ? <LoadingSpinner /> : <ErrorMessage error={error} />
          ) : (
            <ExpandedView styles={variantStyles} />
          )
        )
      )}
    </>
  );
}
```

### Best Practices to Avoid This Issue

1. **Always call hooks at the top level** of your React function
2. **Never call hooks inside loops, conditions, or nested functions**
3. **Use conditional rendering inside JSX**, not before hooks
4. **Provide fallback values** for derived state to prevent TypeScript errors
5. **Consider using optional chaining** (?.) when accessing properties that might be undefined

### Detection Strategies

1. **ESLint Rules**: Use the `react-hooks/rules-of-hooks` rule to catch violations during development
2. **Code Review**: Look for early returns before all hooks are called
3. **Error Boundaries**: Implement error boundaries to catch and report these errors
4. **Testing**: Test components with various prop combinations to ensure consistent hook execution

### Common Patterns That Cause This Issue

1. **Early visibility checks**: `if (!isVisible) return null;`
2. **Loading state returns**: `if (loading) return <Spinner />;`
3. **Error state returns**: `if (error) return <ErrorMessage />;`
4. **Empty state returns**: `if (!data) return <EmptyState />;`
5. **Permission-based returns**: `if (!hasPermission) return <AccessDenied />;`

### Alternative Solutions

While the recommended approach is to move all hooks to the top, in some cases you might consider:

1. **Component Composition**: Split complex conditional logic into separate components
2. **Custom Hooks**: Extract conditional logic into custom hooks that handle their own state
3. **Wrapper Components**: Use wrapper components to handle conditional rendering

```typescript
// Example with component composition
function DynamicIslandAnalysis(props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { current, loading, error } = useAnalysisDynamicIsland(props.id);
  const variantStyles = useMemo(() => {
    if (!current) return variantStyles['default'];
    return getVariantStyles(current.variant);
  }, [current?.variant]);
  
  if (!props.isVisible) return null;
  
  return isCollapsed ? (
    <CompactView />
  ) : (
    <DynamicIslandContent 
      current={current} 
      loading={loading} 
      error={error} 
      variantStyles={variantStyles} 
    />
  );
}

function DynamicIslandContent({ current, loading, error, variantStyles }) {
  if (!current) {
    return loading ? <LoadingSpinner /> : <ErrorMessage error={error} />;
  }
  
  return <ExpandedView styles={variantStyles} />;
}
```

## Related Resources

- [React Hooks Rules](https://react.dev/reference/rules)
- [React Hooks FAQ](https://react.dev/reference/react/hooks#faq)
- [Custom Hooks Documentation](https://react.dev/learn/reusing-logic-with-custom-hooks)