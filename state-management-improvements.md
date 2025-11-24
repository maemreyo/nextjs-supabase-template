# State Management Improvements for AnalysisEditor

## 1. Current State Management Problems

### 1.1 Issues with Current Approach

```typescript
// Current Problems:
// 1. Scattered state across 23 useState calls
// 2. Multiple hooks with overlapping responsibilities
// 3. No centralized state management
// 4. Difficult to debug and test
// 5. Performance issues with unnecessary re-renders

// Example of current scattered state:
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
const [lastAnalysisResult, setLastAnalysisResult] = useState(null);
const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
// ... 18 more useState calls
```

### 1.2 Performance Issues

```typescript
// Current Performance Problems:
// 1. No memoization of expensive operations
// 2. Global re-renders on minor state changes
// 3. Multiple conflicting debounce mechanisms
// 4. Memory leaks from uncleanup

// Example of problematic pattern:
useEffect(() => {
  // This runs on EVERY state change
  const handleKeyDown = (e: KeyboardEvent) => {
    // Complex logic inside event handler
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [/* many dependencies */]); // Too many dependencies
```

## 2. Proposed State Management Architecture

### 2.1 Context-Based State Management

```typescript
// Centralized Editor Context
interface EditorContextValue {
  state: EditorState;
  actions: EditorActions;
  config: EditorConfig;
  utils: EditorUtils;
}

const EditorContext = createContext<EditorContextValue | null>(null);

// Provider Component
export const EditorProvider: React.FC<EditorProviderProps> = ({
  config,
  initialState,
  onStateChange,
  onError,
  children
}) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...getInitialState(config),
    ...initialState
  });

  // Optimized actions with useCallback
  const actions = useMemo(() => createActions(dispatch, state, config), [dispatch, state, config]);
  
  // Utilities with memoization
  const utils = useMemo(() => createUtils(config), [config]);

  // Performance monitoring
  useEffect(() => {
    if (config.enablePerformanceMonitoring) {
      performanceMonitor.trackStateChange(state);
    }
  }, [state, config.enablePerformanceMonitoring]);

  // Error boundary integration
  const handleError = useCallback((error: EditorError) => {
    dispatch({ type: 'SET_ERROR', payload: error });
    onError?.(error);
  }, [onError]);

  const contextValue = useMemo(() => ({
    state,
    actions,
    config,
    utils
  }), [state, actions, config, utils]);

  return (
    <EditorContext.Provider value={contextValue}>
      <ErrorBoundary onError={handleError}>
        {children}
      </ErrorBoundary>
    </EditorContext.Provider>
  );
};
```

### 2.2 State Reducer Pattern

```typescript
// State Reducer
type EditorAction = 
  | { type: 'UPDATE_CONTENT'; payload: EditorContent }
  | { type: 'UPDATE_SELECTION'; payload: TextSelection }
  | { type: 'TRIGGER_ANALYSIS'; payload: AnalysisType }
  | { type: 'ANALYSIS_COMPLETE'; payload: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; payload: EditorError }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_COMPLETE'; payload: SaveResult }
  | { type: 'SAVE_ERROR'; payload: EditorError }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'TOGGLE_MODAL'; payload: ModalType | null }
  | { type: 'SET_SESSION'; payload: AnalysisSession | null }
  | { type: 'RESET_STATE' };

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'UPDATE_CONTENT':
      return {
        ...state,
        content: action.payload,
        save: {
          ...state.save,
          hasUnsavedChanges: action.payload.html !== state.save.lastSavedContent
        }
      };

    case 'UPDATE_SELECTION':
      return {
        ...state,
        selection: action.payload,
        bubbleMenu: calculateBubbleMenuPosition(action.payload),
        ui: {
          ...state.ui,
          activeModal: action.payload.text.trim() ? state.ui.activeModal : null
        }
      };

    case 'TRIGGER_ANALYSIS':
      return {
        ...state,
        analysis: {
          ...state.analysis,
          isAnalyzing: true,
          error: null
        }
      };

    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        analysis: {
          isAnalyzing: false,
          lastResult: action.payload,
          history: [action.payload, ...state.analysis.history.slice(0, 49)], // Keep last 50
          error: null
        }
      };

    case 'SAVE_START':
      return {
        ...state,
        save: {
          ...state.save,
          status: { isSaving: true, status: 'saving', lastSaved: null, error: undefined }
        }
      };

    case 'SAVE_COMPLETE':
      return {
        ...state,
        save: {
          ...state.save,
          status: { 
            isSaving: false, 
            status: 'success', 
            lastSaved: new Date(), 
            error: undefined 
          },
          hasUnsavedChanges: false,
          lastSavedContent: state.content.html
        }
      };

    default:
      return state;
  }
};
```

### 2.3 State Slices with Selectors

```typescript
// Content State Slice
interface ContentState {
  html: string;
  json: any;
  text: string;
  lastSaved: string;
  hasChanged: boolean;
}

// Selectors for content
const contentSelectors = {
  getHTML: (state: EditorState) => state.content.html,
  getJSON: (state: EditorState) => state.content.json,
  getText: (state: EditorState) => state.content.text,
  getWordCount: (state: EditorState) => state.content.text.split(/\s+/).filter(w => w.length > 0).length,
  getCharacterCount: (state: EditorState) => state.content.text.length,
  hasUnsavedChanges: (state: EditorState) => state.save.hasUnsavedChanges,
  isEmpty: (state: EditorState) => !state.content.text.trim(),
};

// Selection State Slice
interface SelectionState {
  text: string;
  from: number;
  to: number;
  empty: boolean;
  type: AnalysisType;
  rect?: DOMRect;
}

// Selectors for selection
const selectionSelectors = {
  getSelectedText: (state: EditorState) => state.selection.text,
  getSelectionType: (state: EditorState) => state.selection.type,
  hasSelection: (state: EditorState) => !state.selection.empty && state.selection.text.trim().length > 0,
  canAnalyze: (state: EditorState) => !state.selection.empty && !state.analysis.isAnalyzing,
  getWordCount: (state: EditorState) => state.selection.text.split(/\s+/).filter(w => w.length > 0).length,
};

// Analysis State Slice
interface AnalysisState {
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  history: AnalysisHistory[];
  error: EditorError | null;
  autoAnalysisEnabled: boolean;
}

// Selectors for analysis
const analysisSelectors = {
  isAnalyzing: (state: EditorState) => state.analysis.isAnalyzing,
  getLastResult: (state: EditorState) => state.analysis.lastResult,
  getHistory: (state: EditorState) => state.analysis.history,
  getError: (state: EditorState) => state.analysis.error,
  canAnalyze: (state: EditorState) => !state.analysis.isAnalyzing && selectionSelectors.hasSelection(state),
  getHistoryByType: (state: EditorState, type: AnalysisType) => 
    state.analysis.history.filter(item => item.type === type),
};
```

## 3. Optimized Hooks Implementation

### 3.1 Main Editor Hook

```typescript
// useEditor - Main hook for consuming editor context
export const useEditor = () => {
  const context = useContext(EditorContext);
  
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }

  // Memoized selectors for performance
  const selectedText = useMemo(
    () => contentSelectors.getText(context.state),
    [context.state.content.text]
  );

  const hasSelection = useMemo(
    () => selectionSelectors.hasSelection(context.state),
    [context.state.selection.text, context.state.selection.empty]
  );

  const canAnalyze = useMemo(
    () => analysisSelectors.canAnalyze(context.state),
    [context.state.analysis.isAnalyzing, context.state.selection.text, context.state.selection.empty]
  );

  const hasUnsavedChanges = useMemo(
    () => contentSelectors.hasUnsavedChanges(context.state),
    [context.state.save.hasUnsavedChanges]
  );

  // Optimized actions
  const triggerAnalysis = useCallback(
    (type?: AnalysisType) => {
      const analysisType = type || selectionSelectors.getSelectionType(context.state);
      if (analysisSelectors.canAnalyze(context.state)) {
        context.actions.triggerAnalysis(analysisType);
      }
    },
    [context.actions, context.state]
  );

  const saveContent = useCallback(
    async (options?: SaveOptions) => {
      if (hasUnsavedChanges || options?.force) {
        return await context.actions.saveContent(options);
      }
    },
    [context.actions, hasUnsavedChanges]
  );

  return {
    // State
    state: context.state,
    
    // Computed values
    editor: context.utils.editor,
    selection: context.state.selection,
    selectedText,
    hasSelection,
    isAnalyzing: context.state.analysis.isAnalyzing,
    hasUnsavedChanges,
    canAnalyze,
    canSave: hasUnsavedChanges,
    
    // Actions
    ...context.actions,
    triggerAnalysis,
    saveContent,
    
    // Utilities
    utils: context.utils,
  };
};
```

### 3.2 Specialized Hooks

```typescript
// useEditorContent - Content-specific hook
export const useEditorContent = () => {
  const { state, actions } = useEditor();
  
  const content = useMemo(() => ({
    html: state.content.html,
    json: state.content.json,
    text: state.content.text,
    stats: {
      characters: state.content.text.length,
      words: state.content.text.split(/\s+/).filter(w => w.length > 0).length,
      sentences: state.content.text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      paragraphs: state.content.text.split(/\n\n+/).filter(p => p.trim().length > 0).length,
    }
  }), [state.content]);

  const updateContent = useCallback(
    (newContent: EditorContent) => {
      actions.updateContent(newContent);
    },
    [actions]
  );

  const resetContent = useCallback(
    () => {
      actions.resetContent();
    },
    [actions]
  );

  return {
    content,
    updateContent,
    resetContent,
    isEmpty: !content.text.trim(),
    hasChanged: state.save.hasUnsavedChanges,
  };
};

// useEditorSelection - Selection-specific hook
export const useEditorSelection = () => {
  const { state, actions } = useEditor();
  
  const selection = useMemo(() => state.selection, [state.selection]);
  
  const updateSelection = useCallback(
    (newSelection: TextSelection) => {
      actions.updateSelection(newSelection);
    },
    [actions]
  );

  const expandSelection = useCallback(
    (type: 'word' | 'sentence' | 'paragraph') => {
      actions.expandSelection(type);
    },
    [actions]
  );

  const clearSelection = useCallback(
    () => {
      actions.clearSelection();
    },
    [actions]
  );

  return {
    selection,
    updateSelection,
    expandSelection,
    clearSelection,
    hasSelection: !selection.empty && selection.text.trim().length > 0,
    wordCount: selection.text.split(/\s+/).filter(w => w.length > 0).length,
    characterCount: selection.text.length,
  };
};

// useEditorAnalysis - Analysis-specific hook
export const useEditorAnalysis = () => {
  const { state, actions } = useEditor();
  
  const analysis = useMemo(() => ({
    isAnalyzing: state.analysis.isAnalyzing,
    lastResult: state.analysis.lastResult,
    history: state.analysis.history,
    error: state.analysis.error,
    autoAnalysisEnabled: state.analysis.autoAnalysisEnabled,
  }), [state.analysis]);

  const triggerAnalysis = useCallback(
    (type: AnalysisType) => {
      actions.triggerAnalysis(type);
    },
    [actions]
  );

  const cancelAnalysis = useCallback(
    () => {
      actions.cancelAnalysis();
    },
    [actions]
  );

  const addToHistory = useCallback(
    (result: AnalysisResult) => {
      actions.addToHistory(result);
    },
    [actions]
  );

  return {
    ...analysis,
    triggerAnalysis,
    cancelAnalysis,
    addToHistory,
    clearHistory: actions.clearHistory,
    clearError: actions.clearAnalysisError,
  };
};
```

## 4. Performance Optimizations

### 4.1 Memoization Strategy

```typescript
// Memoized utilities
const useMemoizedUtils = (config: EditorConfig) => {
  return useMemo(() => {
    // Expensive operations memoized
    const sanitizeHTML = memoize((html: string) => {
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: config.allowedTags || DEFAULT_ALLOWED_TAGS,
        ALLOWED_ATTR: config.allowedAttributes || DEFAULT_ALLOWED_ATTR,
      });
    });

    const validateContent = memoize((content: EditorContent) => {
      const maxLength = config.maxLength || DEFAULT_MAX_LENGTH;
      return content.text.length <= maxLength && content.html.length <= maxLength * 2;
    });

    const calculateTextStats = memoize((text: string) => {
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      
      return {
        characters: text.length,
        words: words.length,
        sentences: sentences.length,
        paragraphs: Math.max(1, paragraphs.length),
      };
    });

    return {
      sanitizeHTML,
      validateContent,
      calculateTextStats,
    };
  }, [config]);
};

// Debounced actions
const useDebouncedActions = (actions: EditorActions, config: EditorConfig) => {
  const debouncedSave = useMemo(
    () => debounce(
      (options?: SaveOptions) => actions.saveContent(options),
      config.autoSaveDebounceMs || 3000
    ),
    [actions.saveContent, config.autoSaveDebounceMs]
  );

  const debouncedAnalysis = useMemo(
    () => debounce(
      (type: AnalysisType) => actions.triggerAnalysis(type),
      config.analysisDebounceMs || 800
    ),
    [actions.triggerAnalysis, config.analysisDebounceMs]
  );

  return {
    debouncedSave,
    debouncedAnalysis,
  };
};
```

### 4.2 Re-render Optimization

```typescript
// Component memoization with custom comparison
const EditorHeader = React.memo<EditorHeaderProps>(({ session, onNavigateBack }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom shallow comparison for performance
  return (
    prevProps.session?.id === nextProps.session?.id &&
    prevProps.session?.title === nextProps.session?.title &&
    prevProps.onNavigateBack === nextProps.onNavigateBack
  );
});

// Selectors with memoization
const useOptimizedSelector = <T>(
  selector: (state: EditorState) => T,
  equalityFn?: (a: T, b: T) => boolean
) => {
  const { state } = useEditor();
  
  return useSelector(state, selector, equalityFn || shallowEqual);
};

// Usage example
const currentSession = useOptimizedSelector(
  state => state.session.current,
  (prev, next) => prev?.id === next?.id
);
```

## 5. State Persistence & Recovery

### 5.1 Local Storage Integration

```typescript
// State persistence utilities
const useStatePersistence = (state: EditorState, config: EditorConfig) => {
  const saveToStorage = useCallback(
    (key: string, data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },
    []
  );

  const loadFromStorage = useCallback(
    (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
      }
    },
    []
  );

  // Auto-save state to localStorage
  useEffect(() => {
    if (config.enablePersistence) {
      saveToStorage(`editor-state-${config.sessionId || 'default'}`, {
        content: state.content,
        lastSaved: new Date().toISOString(),
      });
    }
  }, [state.content, config.enablePersistence, config.sessionId, saveToStorage]);

  // Recovery on mount
  useEffect(() => {
    if (config.enablePersistence) {
      const persisted = loadFromStorage(`editor-state-${config.sessionId || 'default'}`);
      if (persisted && !state.content.text.trim()) {
        // Recover content if current is empty
        actions.updateContent(persisted.content);
      }
    }
  }, [config.enablePersistence, config.sessionId]);
};
```

### 5.2 State Synchronization

```typescript
// Multi-tab synchronization
const useTabSync = (state: EditorState, actions: EditorActions) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      channelRef.current = new BroadcastChannel('editor-sync');
      
      channelRef.current.onmessage = (event) => {
        const { type, data, source } = event.data;
        
        if (source === 'self') return; // Ignore own messages
        
        switch (type) {
          case 'CONTENT_UPDATE':
            actions.updateContent(data.content);
            break;
          case 'SELECTION_UPDATE':
            actions.updateSelection(data.selection);
            break;
          case 'ANALYSIS_COMPLETE':
            actions.addToHistory(data.result);
            break;
        }
      };

      return () => {
        channelRef.current?.close();
      };
    }
  }, [actions]);

  // Broadcast state changes
  useEffect(() => {
    channelRef.current?.postMessage({
      type: 'CONTENT_UPDATE',
      data: { content: state.content },
      source: 'self',
    });
  }, [state.content]);
};
```

## 6. Error Handling & Recovery

### 6.1 State Error Boundaries

```typescript
// State error handling
const useStateErrorHandling = (state: EditorState, dispatch: Dispatch<EditorAction>) => {
  const handleError = useCallback(
    (error: EditorError) => {
      // Log error for debugging
      console.error('Editor State Error:', error);
      
      // Dispatch error to state
      dispatch({ type: 'SET_ERROR', payload: error });
      
      // Attempt recovery based on error type
      switch (error.code) {
        case 'CONTENT_TOO_LARGE':
          dispatch({ type: 'TRIM_CONTENT', payload: MAX_CONTENT_LENGTH });
          break;
        case 'ANALYSIS_FAILED':
          dispatch({ type: 'RESET_ANALYSIS_STATE' });
          break;
        case 'SAVE_FAILED':
          dispatch({ type: 'ENABLE_OFFLINE_MODE' });
          break;
      }
    },
    [dispatch]
  );

  const recoverState = useCallback(
    () => {
      dispatch({ type: 'RECOVER_STATE' });
    },
    [dispatch]
  );

  return {
    handleError,
    recoverState,
  };
};
```

### 6.2 State Validation

```typescript
// State validation utilities
const validateState = (state: EditorState): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Content validation
  if (!state.content.html && !state.content.text) {
    errors.push('Content cannot be empty');
  }

  if (state.content.text.length > MAX_CONTENT_LENGTH) {
    errors.push('Content exceeds maximum length');
  }

  // Selection validation
  if (state.selection.from < 0 || state.selection.to < 0) {
    warnings.push('Invalid selection bounds');
  }

  if (state.selection.from > state.selection.to) {
    errors.push('Selection start cannot be after end');
  }

  // Analysis validation
  if (state.analysis.isAnalyzing && state.analysis.lastResult) {
    warnings.push('Analysis state inconsistency');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// State middleware for validation
const validationMiddleware = (state: EditorState, action: EditorAction) => {
  const newState = editorReducer(state, action);
  const validation = validateState(newState);
  
  if (!validation.isValid) {
    console.error('State validation failed:', validation.errors);
    // Return previous state or corrected state
    return state;
  }
  
  if (validation.warnings.length > 0) {
    console.warn('State validation warnings:', validation.warnings);
  }
  
  return newState;
};
```

## 7. Testing State Management

### 7.1 State Testing Utilities

```typescript
// Test utilities for state management
export const createStateTestUtils = () => {
  const createMockState = (overrides?: Partial<EditorState>): EditorState => ({
    content: { html: '', json: null, text: '' },
    selection: { text: '', from: 0, to: 0, empty: true, type: 'word' },
    analysis: {
      isAnalyzing: false,
      lastResult: null,
      history: [],
      error: null,
      autoAnalysisEnabled: true,
    },
    save: {
      isAutoSaveEnabled: true,
      status: { isSaving: false, status: 'idle', lastSaved: null },
      hasUnsavedChanges: false,
      lastSavedContent: '',
    },
    ui: {
      isToolbarVisible: true,
      isStatusBarVisible: true,
      isFullscreen: false,
      activeModal: null,
      theme: defaultTheme,
    },
    session: {
      current: null,
      isLoading: false,
      error: null,
    },
    ...overrides,
  });

  const createMockAction = <T extends EditorAction['type']>(
    type: T,
    payload?: Extract<EditorAction, { type: T }>['payload']
  ): EditorAction => ({ type, payload } as EditorAction);

  const dispatchAction = (state: EditorState, action: EditorAction): EditorState => {
    return editorReducer(state, action);
  };

  const expectStateChange = (
    initialState: EditorState,
    action: EditorAction,
    expectedChanges: Partial<EditorState>
  ) => {
    const newState = dispatchAction(initialState, action);
    
    Object.entries(expectedChanges).forEach(([key, expectedValue]) => {
      expect(newState[key]).toEqual(expectedValue);
    });
  };

  return {
    createMockState,
    createMockAction,
    dispatchAction,
    expectStateChange,
  };
};
```

### 7.2 Hook Testing

```typescript
// Hook testing utilities
export const renderHookWithProvider = <T>(
  hook: () => T,
  options?: {
    config?: Partial<EditorConfig>;
    initialState?: Partial<EditorState>;
  }
) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorProvider 
      config={options?.config || {}} 
      initialState={options?.initialState}
    >
      {children}
    </EditorProvider>
  );

  return renderHook(hook, { wrapper });
};

// Example test
describe('useEditorContent', () => {
  it('should provide content state and actions', () => {
    const { result } = renderHookWithProvider(() => useEditorContent());
    
    expect(result.current.content).toBeDefined();
    expect(result.current.updateContent).toBeInstanceOf(Function);
    expect(result.current.resetContent).toBeInstanceOf(Function);
  });

  it('should update content when updateContent is called', () => {
    const { result } = renderHookWithProvider(() => useEditorContent());
    
    const newContent = { html: '<p>Test</p>', json: {}, text: 'Test' };
    act(() => {
      result.current.updateContent(newContent);
    });
    
    expect(result.current.content).toEqual(newContent);
  });
});
```

## 8. Migration Strategy

### 8.1 Gradual Migration Plan

```typescript
// Compatibility layer for gradual migration
const LegacyStateAdapter = {
  // Convert old state format to new format
  convertState: (oldState: any): EditorState => {
    return {
      content: {
        html: oldState.content || '',
        json: oldState.editor?.getJSON() || null,
        text: oldState.editor?.getText() || '',
      },
      selection: {
        text: oldState.selection?.text || '',
        from: oldState.selection?.from || 0,
        to: oldState.selection?.to || 0,
        empty: !oldState.selection?.text?.trim(),
        type: oldState.selection?.type || 'word',
      },
      // ... map other properties
    };
  },

  // Convert old actions to new actions
  convertActions: (oldActions: any): EditorActions => {
    return {
      updateContent: (content) => oldActions.setContent(content.html),
      triggerAnalysis: (type) => oldActions.onAnalyze?.(oldActions.selection.text, type),
      // ... map other actions
    };
  },
};

// Wrapper component for backward compatibility
const AnalysisEditorCompat: React.FC<LegacyAnalysisEditorProps> = (props) => {
  const convertedConfig = LegacyStateAdapter.convertConfig(props);
  const convertedHandlers = LegacyStateAdapter.convertHandlers(props);
  
  return (
    <EditorProvider config={convertedConfig}>
      <AnalysisEditor {...convertedHandlers} />
    </EditorProvider>
  );
};
```

---

*This comprehensive state management plan addresses all current issues and provides a robust, performant, and maintainable solution for the refactored AnalysisEditor component.*