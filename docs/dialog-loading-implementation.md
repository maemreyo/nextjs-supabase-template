# Implementation Plan for Dialog Loading State

## Hook: useDialogLoading

```typescript
import { useCallback, useMemo, useEffect } from 'react';
import { useDialogStore } from '../../../../stores/analysis-dialog-store';
import { AnalysisType } from '../types/dialog-types';

/**
 * Interface cho loading state phân cấp
 */
interface DialogLoadingState {
  // Global loading state
  isLoading: boolean;
  error: string | null;
  message: string | null;
  
  // Local loading states
  fetching: {
    fullData: boolean;
    relatedData: boolean;
  };
  
  // Action-specific loading states
  actions: {
    pronunciation: boolean;
    addToVocabulary: boolean;
    share: boolean;
    export: boolean;
    analyze: boolean;
    print: boolean;
    copy: boolean;
    edit: boolean;
  };
  
  // Metadata
  lastUpdated: number;
  source: 'global' | 'local' | 'action';
}

/**
 * Return type cho useDialogLoading hook
 */
interface UseDialogLoadingReturn {
  // Global state
  isLoading: boolean;
  error: string | null;
  message: string | null;
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setLocalLoading: (key: string, loading: boolean) => void;
  setActionLoading: (action: string, loading: boolean) => void;
  clearError: () => void;
  
  // Computed states
  hasAnyLoading: boolean;
  primaryLoadingSource: string;
  loadingStates: DialogLoadingState;
}

/**
 * Hook quản lý loading state nhất quán cho dialog
 */
export const useDialogLoading = (type: AnalysisType): UseDialogLoadingReturn => {
  const store = useDialogStore();
  
  // Global loading state
  const isLoading = useMemo(() => 
    store.dialogStates[type]?.loading || false, 
    [store.dialogStates, type]
  );
  
  const error = useMemo(() => 
    store.dialogStates[type]?.error || null, 
    [store.dialogStates, type]
  );
  
  const message = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return null;
    
    // Determine message based on source and context
    if (state.error) return state.error;
    if (state.isLoading) return 'Đang tải...';
    if (state.fetching?.fullData) return 'Đang tải dữ liệu đầy đủ...';
    if (state.actions?.pronunciation) return 'Đang phát âm...';
    if (state.actions?.addToVocabulary) return 'Đang thêm vào từ vựng...';
    if (state.actions?.share) return 'Đang chia sẻ...';
    if (state.actions?.export) return 'Đang xuất...';
    if (state.actions?.analyze) return 'Đang phân tích...';
    if (state.actions?.print) return 'Đang in...';
    if (state.actions?.copy) return 'Đang sao chép...';
    if (state.actions?.edit) return 'Đang chỉnh sửa...';
    
    return null;
  }, [store.dialogStates, type]);
  
  // Set global loading
  const setGlobalLoading = useCallback((loading: boolean, message?: string) => {
    store.setDialogLoading(type, loading);
    
    // Update message if provided
    if (message && loading) {
      // Could store message in state if needed
      console.log(`[${type}] Loading message: ${message}`);
    }
  }, [store, type]);
  
  // Set local loading
  const setLocalLoading = useCallback((key: string, loading: boolean) => {
    const currentState = store.dialogStates[type];
    if (!currentState) return;
    
    store.setDialogLoading(type, {
      ...currentState,
      fetching: {
        ...currentState.fetching,
        [key]: loading
      }
    });
  }, [store, type]);
  
  // Set action loading
  const setActionLoading = useCallback((action: string, loading: boolean) => {
    const currentState = store.dialogStates[type];
    if (!currentState) return;
    
    store.setDialogLoading(type, {
      ...currentState,
      actions: {
        ...currentState.actions,
        [action]: loading
      }
    });
  }, [store, type]);
  
  // Clear error
  const clearError = useCallback(() => {
    store.setDialogError(type, null);
  }, [store, type]);
  
  // Computed states
  const hasAnyLoading = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return false;
    
    return (
      state.isLoading ||
      state.fetching?.fullData ||
      state.fetching?.relatedData ||
      Object.values(state.actions || {}).some(actionLoading => actionLoading)
    );
  }, [store.dialogStates, type]);
  
  const primaryLoadingSource = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return 'none';
    
    if (state.isLoading) return 'global';
    if (state.fetching?.fullData) return 'local';
    if (state.fetching?.relatedData) return 'local';
    
    const activeActions = Object.entries(state.actions || {})
      .filter(([_, loading]) => loading)
      .map(([action]) => action);
    
    return activeActions.length > 0 ? `action:${activeActions[0]}` : 'none';
  }, [store.dialogStates, type]);
  
  // Complete loading state object
  const loadingStates: DialogLoadingState = useMemo(() => {
    const state = store.dialogStates[type];
    return {
      isLoading: state?.loading || false,
      error: state?.error || null,
      message: state?.error || null,
      fetching: {
        fullData: state?.fetching?.fullData || false,
        relatedData: state?.fetching?.relatedData || false,
      },
      actions: state?.actions || {},
      lastUpdated: state?.lastUpdated || Date.now(),
      source: primaryLoadingSource === 'global' ? 'global' : 
              primaryLoadingSource === 'local' ? 'local' : 'action'
    };
  }, [store.dialogStates, type, primaryLoadingSource]);
  
  // Auto-clear loading when data is available
  useEffect(() => {
    const state = store.dialogStates[type];
    if (!state) return;
    
    // Clear global loading if we have data and no active actions
    const hasData = !!store.dialogData[type];
    const hasActiveActions = Object.values(state.actions || {}).some(loading => loading);
    
    if (hasData && !hasActiveActions && state.isLoading) {
      store.setDialogLoading(type, false);
    }
  }, [store.dialogData, store.dialogStates, type]);
  
  // Auto-clear loading on error
  useEffect(() => {
    const state = store.dialogStates[type];
    if (state?.error) {
      // Clear all loading states when there's an error
      store.setDialogLoading(type, {
        ...state,
        isLoading: false,
        fetching: {
          fullData: false,
          relatedData: false,
        },
        actions: {}
      });
    }
  }, [store.dialogStates, type]);
  
  return {
    isLoading,
    error,
    message,
    setGlobalLoading,
    setLocalLoading,
    setActionLoading,
    clearError,
    hasAnyLoading,
    primaryLoadingSource,
    loadingStates
  };
};
```

## Component: DialogLoadingIndicator

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DialogLoadingIndicatorProps {
  type: 'global' | 'local' | 'action';
  message?: string;
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DialogLoadingIndicator: React.FC<DialogLoadingIndicatorProps> = ({
  type,
  message,
  overlay = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  const typeColors = {
    global: 'text-blue-600 border-blue-600',
    local: 'text-green-600 border-green-600',
    action: 'text-orange-600 border-orange-600'
  };
  
  const defaultMessages = {
    global: 'Đang tải...',
    local: 'Đang tải dữ liệu...',
    action: 'Đang xử lý...'
  };
  
  const displayMessage = message || defaultMessages[type];
  
  const content = (
    <div className={cn(
      'flex items-center gap-2',
      typeColors[type],
      className
    )}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      <span className="text-sm font-medium">{displayMessage}</span>
    </div>
  );
  
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
        <div className="bg-background border rounded-lg shadow-lg p-4">
          {content}
        </div>
      </div>
    );
  }
  
  return content;
};
```

## Component: DialogErrorHandler

```typescript
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface DialogErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const DialogErrorHandler: React.FC<DialogErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  className
}) => {
  if (!error) return null;
  
  return (
    <Alert className={cn('border-destructive/50 bg-destructive/5', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2">
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
```

## Enhanced BaseAnalysisDialog

```typescript
// Thêm props vào BaseAnalysisDialogProps
interface BaseAnalysisDialogProps {
  // Existing props...
  loadingConfig?: {
    showGlobalLoading: boolean;
    showActionLoading: boolean;
    customMessages?: Record<string, string>;
  };
}

// Cập nhật render logic trong BaseAnalysisDialog
export const BaseAnalysisDialog: React.FC<BaseAnalysisDialogProps> = ({
  // existing props...
  loadingConfig = {
    showGlobalLoading: true,
    showActionLoading: true,
    customMessages: {},
    ...loadingConfig
  }
}) => {
  const { state, actions } = useDialogState(type);
  
  // Enhanced loading state calculation
  const shouldShowGlobalLoading = loadingConfig.showGlobalLoading && state.dialogState.loading;
  const shouldShowActionLoading = loadingConfig.showActionLoading && 
    Object.values(state.dialogState.actions || {}).some(action => action);
  
  // Enhanced error handling
  const handleRetry = useCallback(() => {
    actions.setError(null);
    // Trigger retry logic here
  }, [actions]);
  
  const handleDismissError = useCallback(() => {
    actions.setError(null);
  }, [actions]);
  
  return (
    <div className={dialogClasses}>
      {/* Global Loading Overlay */}
      {shouldShowGlobalLoading && (
        <DialogLoadingIndicator
          type="global"
          message={loadingConfig.customMessages?.global || state.dialogState.error}
          overlay={true}
        />
      )}
      
      {/* Error State */}
      {state.dialogState.error && !shouldShowGlobalLoading && (
        <DialogErrorHandler
          error={state.dialogState.error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}
      
      {/* Normal Content */}
      {!shouldShowGlobalLoading && !state.dialogState.error && (
        // Existing dialog content
        <div>
          {/* Action Loading Indicators */}
          {loadingConfig.showActionLoading && (
            <div className="flex gap-2 p-2 border-b">
              {Object.entries(state.dialogState.actions || {}).map(([action, loading]) => (
                loading && (
                  <DialogLoadingIndicator
                    key={action}
                    type="action"
                    message={loadingConfig.customMessages?.[action]}
                    size="sm"
                  />
                )
              ))}
            </div>
          )}
          
          {/* Dialog Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Usage Examples

### 1. Word Dialog Content

```typescript
// Old implementation
const { state, actions } = useDialogState('word');
const [isFetchingFullData, setIsFetchingFullData] = useState(false);

useEffect(() => {
  if (isLoading) {
    setIsFetchingFullData(true);
    actions.setLoading(true);
  } else {
    setIsFetchingFullData(false);
    if (mergedAnalysis) {
      actions.setLoading(false);
    }
  }
}, [isLoading, mergedAnalysis, actions]);

// New implementation
const { 
  isLoading, 
  error,
  message,
  setGlobalLoading,
  setLocalLoading,
  setActionLoading,
  clearError,
  hasAnyLoading,
  primaryLoadingSource
} = useDialogLoading('word');

// Fetch full data
const fetchFullData = useCallback(async () => {
  setLocalLoading('fullData', true);
  try {
    const fullData = await fetchWordAnalysis(analysis.id);
    updateMergedData(fullData);
  } catch (error) {
    clearError();
    actions.setError(error.message);
  } finally {
    setLocalLoading('fullData', false);
  }
}, [analysis.id, setLocalLoading, clearError, actions]);

// Handle pronunciation
const handlePronunciation = useCallback(async () => {
  setActionLoading('pronunciation', true);
  try {
    await playPronunciation(analysis.word);
  } catch (error) {
    clearError();
    actions.setError(error.message);
  } finally {
    setActionLoading('pronunciation', false);
  }
}, [analysis.word, setActionLoading, clearError, actions]);

// Render
return (
  <div className="space-y-4">
    {/* Loading indicator for full data fetch */}
    {primaryLoadingSource === 'local' && (
      <DialogLoadingIndicator
        type="local"
        message={message}
      />
    )}
    
    {/* Error handler */}
    <DialogErrorHandler
      error={error}
      onRetry={fetchFullData}
    />
    
    {/* Content */}
    <WordPrimaryInformationDisplayCard
      analysis={mergedAnalysis || analysis}
      onPronounce={handlePronunciation}
      disabled={hasAnyLoading}
    />
  </div>
);
```

### 2. Enhanced Dialog Actions

```typescript
// Word Dialog Actions
export const WordDialogActions: React.FC<WordDialogActionsProps> = ({
  analysis,
  loading,
  disabled,
  onAddToVocabulary,
  onPractice,
  onPronounce,
  onShare,
  onCopy,
  onEdit,
  onPrint,
}) => {
  const { 
    setActionLoading,
    clearError 
  } = useDialogLoading('word');
  
  const handleAddToVocabulary = useCallback(async () => {
    setActionLoading('addToVocabulary', true);
    try {
      await onAddToVocabulary?.(analysis);
    } catch (error) {
      clearError();
      // Error handling
    } finally {
      setActionLoading('addToVocabulary', false);
    }
  }, [analysis, onAddToVocabulary, setActionLoading, clearError]);
  
  const handlePronounce = useCallback(async () => {
    setActionLoading('pronunciation', true);
    try {
      await onPronounce?.(analysis.word);
    } catch (error) {
      clearError();
      // Error handling
    } finally {
      setActionLoading('pronunciation', false);
    }
  }, [analysis.word, onPronounce, setActionLoading, clearError]);
  
  return (
    <div className="flex gap-2">
      <Button
        onClick={handleAddToVocabulary}
        disabled={disabled || loading}
        className="relative"
      >
        {loading && (
          <DialogLoadingIndicator type="action" size="sm" />
        )}
        Add to Vocabulary
      </Button>
      
      <Button
        onClick={handlePronounce}
        disabled={disabled || loading}
        className="relative"
      >
        {loading && (
          <DialogLoadingIndicator type="action" size="sm" />
        )}
        <Volume2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

## Migration Steps

### Step 1: Update Store Types
```typescript
// Update DialogState interface in dialog-types.ts
interface DialogState {
  loading: boolean; // Keep for backward compatibility
  error: string | null;
  fullscreen: boolean;
  lastUpdated: number;
  
  // New loading states
  fetching?: {
    fullData: boolean;
    relatedData: boolean;
  };
  
  actions?: Record<string, boolean>;
}
```

### Step 2: Update Store Implementation
```typescript
// Update setDialogLoading in analysis-dialog-store.ts
setDialogLoading: (type: AnalysisType, loading: boolean | Partial<DialogState>) => {
  set((state) => {
    const currentDialogState = getDialogState(state.dialogStates, type);
    
    if (typeof loading === 'boolean') {
      // Backward compatibility
      return {
        ...state,
        dialogStates: {
          ...state.dialogStates,
          [type]: {
            ...currentDialogState,
            loading,
            lastUpdated: Date.now()
          }
        },
      };
    } else {
      // New partial state update
      return {
        ...state,
        dialogStates: {
          ...state.dialogStates,
          [type]: {
            ...currentDialogState,
            ...loading,
            lastUpdated: Date.now()
          }
        },
      };
    }
  });
},
```

### Step 3: Update Components
1. Replace direct state access with `useDialogLoading` hook
2. Replace local loading states with hook methods
3. Add proper error handling with `clearError`
4. Add loading indicators for actions
5. Remove redundant loading states

## Testing Strategy

### Unit Tests
```typescript
describe('useDialogLoading', () => {
  it('should manage global loading state', () => {
    const { result } = renderHook(() => useDialogLoading('word'));
    
    act(() => {
      result.current.setGlobalLoading(true, 'Test message');
    });
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.message).toBe('Test message');
  });
  
  it('should manage action loading states', () => {
    const { result } = renderHook(() => useDialogLoading('word'));
    
    act(() => {
      result.current.setActionLoading('pronunciation', true);
    });
    
    expect(result.current.loadingStates.actions.pronunciation).toBe(true);
    expect(result.current.primaryLoadingSource).toBe('action:pronunciation');
  });
  
  it('should clear loading on error', () => {
    const { result } = renderHook(() => useDialogLoading('word'));
    
    act(() => {
      result.current.setGlobalLoading(true);
      result.current.clearError();
    });
    
    // Should clear all loading states
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasAnyLoading).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Dialog Loading Integration', () => {
  it('should handle fetch full data workflow', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockFullData);
    
    const { getByText, queryByRole } = render(
      <WordDialogContent analysis={mockAnalysis} />
    );
    
    // Initially should show summary
    expect(getByText(mockAnalysis.word)).toBeInTheDocument();
    
    // Trigger full data fetch
    fireEvent.click(getByText('Tải đầy đủ'));
    
    // Should show loading
    expect(queryByRole('progressbar')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(mockAnalysis.id);
      expect(getByText('Full definition')).toBeInTheDocument();
    });
  });
  
  it('should handle pronunciation loading', async () => {
    const mockPronounce = jest.fn();
    
    const { getByRole } = render(
      <WordDialogContent analysis={mockAnalysis} />
    );
    
    // Trigger pronunciation
    fireEvent.click(getByRole('button', { name: 'Phát âm' }));
    
    // Should show action loading
    expect(queryByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockPronounce).toHaveBeenCalled();
    });
  });
});
```

## Performance Optimizations

### 1. Memoization
```typescript
// Use useMemo for expensive calculations
const loadingStates = useMemo(() => {
  // Expensive state calculations
}, [store.dialogStates, type]);

// Use useCallback for stable references
const setGlobalLoading = useCallback((loading: boolean, message?: string) => {
  // Stable function reference
}, [store, type]);
```

### 2. Debouncing
```typescript
// Debounce rapid loading changes
const debouncedSetLoading = useMemo(
  () => debounce(setGlobalLoading, 100),
  [setGlobalLoading]
);
```

### 3. Selective Updates
```typescript
// Only update when values actually change
const setLoading = useCallback((loading: boolean) => {
  if (isLoading !== loading) {
    setGlobalLoading(loading);
  }
}, [isLoading, setGlobalLoading]);
```

## Accessibility Considerations

### 1. ARIA Attributes
```typescript
<div
  role="progressbar"
  aria-busy={isLoading}
  aria-label={message || 'Loading content'}
>
  {/* Loading content */}
</div>
```

### 2. Screen Reader Support
```typescript
// Announce loading changes
useEffect(() => {
  if (isLoading) {
    const announcement = `Loading ${type} dialog: ${message || 'In progress'}`;
    announceToScreenReader(announcement);
  }
}, [isLoading, message, type]);
```

### 3. Keyboard Navigation
```typescript
// Maintain focus during loading
const handleKeyDown = useCallback((event: KeyboardEvent) => {
  if (event.key === 'Escape' && !isLoading) {
    onClose();
  }
}, [isLoading, onClose]);
```

## Conclusion

Implementation plan này cung cấp:
- **Consistency**: Một cách tiếp cận nhất quán cho tất cả dialog
- **Flexibility**: Hỗ trợ nhiều loại loading state
- **Reliability**: Xử lý lỗi đúng cách
- **Performance**: Tối ưu cho hiệu năng
- **Accessibility**: Hỗ trợ người dùng khuyết tật
- **Maintainability**: Dễ bảo trì và mở rộng