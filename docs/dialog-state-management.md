# Dialog State Management System

## 1. State Architecture Overview

### 1.1. Global State Structure
```typescript
interface DialogGlobalState {
  // Dialog visibility states
  openDialogs: Record<AnalysisType, boolean>;
  
  // Dialog data storage
  dialogData: Record<AnalysisType, AnalysisItem | null>;
  
  // Individual dialog states
  dialogStates: Record<AnalysisType, DialogState>;
  
  // Global settings
  settings: {
    enableAnimations: boolean;
    enableKeyboardShortcuts: boolean;
    defaultDialogSize: DialogSize;
    enableResize: boolean;
    enableFullscreen: boolean;
  };
}

interface DialogState {
  loading: boolean;
  error: string | null;
  fullscreen: boolean;
  resizedWidth?: number;
  lastUpdated: number;
  position?: { x: number; y: number };
}
```

### 1.2. State Management Pattern
- **Zustand store**: Centralized state management
- **Local state**: Component-level state với useState
- **Derived state**: useMemo cho computed values
- **Persistence**: LocalStorage cho user preferences
- **Optimization**: useCallback cho action handlers

## 2. Dialog Manager Service

### 2.1. Service Interface
```typescript
interface DialogManagerService {
  // Dialog control methods
  openDialog: (type: AnalysisType, data: AnalysisItem) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  toggleDialog: (type: AnalysisType, data?: AnalysisItem) => void;
  
  // State access methods
  getDialogState: (type: AnalysisType) => DialogState;
  getAllDialogStates: () => Record<AnalysisType, DialogState>;
  getOpenDialogs: () => AnalysisType[];
  
  // Data management methods
  updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
  clearDialogData: (type: AnalysisType) => void;
  
  // Settings management
  updateSettings: (settings: Partial<DialogGlobalState['settings']>) => void;
  getSettings: () => DialogGlobalState['settings'];
  
  // Subscription methods
  subscribe: (callback: (state: DialogGlobalState) => void) => () => void;
  unsubscribe: (callback: (state: DialogGlobalState) => void) => void;
}
```

### 2.2. Zustand Store Implementation
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DialogStore extends DialogGlobalState {
  // Actions
  openDialog: (type: AnalysisType, data: AnalysisItem) => void;
  closeDialog: (type: AnalysisType) => void;
  closeAllDialogs: () => void;
  updateDialogData: (type: AnalysisType, data: AnalysisItem) => void;
  setDialogLoading: (type: AnalysisType, loading: boolean) => void;
  setDialogError: (type: AnalysisType, error: string | null) => void;
  toggleFullscreen: (type: AnalysisType) => void;
  setDialogWidth: (type: AnalysisType, width: number) => void;
  updateSettings: (settings: Partial<DialogGlobalState['settings']>) => void;
}

export const useDialogStore = create<DialogStore>()(
  persist(
    (set, get) => ({
      // Initial state
      openDialogs: {
        word: false,
        phrase: false,
        sentence: false,
        paragraph: false,
      },
      dialogData: {
        word: null,
        phrase: null,
        sentence: null,
        paragraph: null,
      },
      dialogStates: {
        word: {
          loading: false,
          error: null,
          fullscreen: false,
          lastUpdated: Date.now(),
        },
        phrase: {
          loading: false,
          error: null,
          fullscreen: false,
          lastUpdated: Date.now(),
        },
        sentence: {
          loading: false,
          error: null,
          fullscreen: false,
          lastUpdated: Date.now(),
        },
        paragraph: {
          loading: false,
          error: null,
          fullscreen: false,
          lastUpdated: Date.now(),
        },
      },
      settings: {
        enableAnimations: true,
        enableKeyboardShortcuts: true,
        defaultDialogSize: 'large',
        enableResize: true,
        enableFullscreen: true,
      },
      
      // Actions
      openDialog: (type, data) => {
        set((state) => ({
          ...state,
          openDialogs: { ...state.openDialogs, [type]: true },
          dialogData: { ...state.dialogData, [type]: data },
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              loading: true, 
              error: null, 
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      closeDialog: (type) => {
        set((state) => ({
          ...state,
          openDialogs: { ...state.openDialogs, [type]: false },
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              loading: false, 
              error: null,
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      closeAllDialogs: () => {
        set((state) => ({
          ...state,
          openDialogs: {
            word: false,
            phrase: false,
            sentence: false,
            paragraph: false,
          },
        }));
      },
      
      updateDialogData: (type, data) => {
        set((state) => ({
          ...state,
          dialogData: { ...state.dialogData, [type]: data },
        }));
      },
      
      setDialogLoading: (type, loading) => {
        set((state) => ({
          ...state,
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              loading, 
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      setDialogError: (type, error) => {
        set((state) => ({
          ...state,
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              error, 
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      toggleFullscreen: (type) => {
        set((state) => ({
          ...state,
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              fullscreen: !state.dialogStates[type]?.fullscreen, 
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      setDialogWidth: (type, width) => {
        set((state) => ({
          ...state,
          dialogStates: { 
            ...state.dialogStates, 
            [type]: { 
              ...state.dialogStates[type], 
              resizedWidth: width, 
              lastUpdated: Date.now() 
            } 
          },
        }));
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          ...state,
          settings: { ...state.settings, ...newSettings },
        }));
      },
    }),
    {
      name: 'dialog-store',
      partialize: (state) => ({
        openDialogs: state.openDialogs,
        settings: state.settings,
      }),
    }
  )
);
```

## 3. Custom Hooks

### 3.1. useDialogState Hook
```typescript
import { useCallback, useMemo } from 'react';
import { useDialogStore } from './useDialogStore';

export const useDialogState = (type: AnalysisType) => {
  const store = useDialogStore();
  
  const state = useMemo(() => ({
    isOpen: store.openDialogs[type],
    data: store.dialogData[type],
    dialogState: store.dialogStates[type],
  }), [store.openDialogs[type], store.dialogData[type], store.dialogStates[type]]);
  
  const actions = useMemo(() => ({
    open: (data: AnalysisItem) => store.openDialog(type, data),
    close: () => store.closeDialog(type),
    updateData: (data: AnalysisItem) => store.updateDialogData(type, data),
    setLoading: (loading: boolean) => store.setDialogLoading(type, loading),
    setError: (error: string | null) => store.setDialogError(type, error),
    toggleFullscreen: () => store.toggleFullscreen(type),
    setWidth: (width: number) => store.setDialogWidth(type, width),
  }), [store]);
  
  return { state, actions };
};
```

### 3.2. useDialogActions Hook
```typescript
import { useCallback } from 'react';
import { useDialogState } from './useDialogState';
import { exportUtils } from '../utils/exportUtils';

export const useDialogActions = (type: AnalysisType, analysis: AnalysisItem) => {
  const { state, actions } = useDialogState(type);
  
  const handleExport = useCallback(async (format: ExportFormat) => {
    actions.setLoading(true);
    try {
      await exportUtils.export(analysis, format);
    } catch (error) {
      actions.setError(`Export failed: ${error.message}`);
    } finally {
      actions.setLoading(false);
    }
  }, [type, analysis, actions]);
  
  const handleShare = useCallback(async () => {
    actions.setLoading(true);
    try {
      await exportUtils.share(analysis);
    } catch (error) {
      actions.setError(`Share failed: ${error.message}`);
    } finally {
      actions.setLoading(false);
    }
  }, [type, analysis, actions]);
  
  const handlePrint = useCallback(() => {
    exportUtils.print(analysis);
  }, [analysis]);
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(analysis.word || analysis.phrase || analysis.sentence || analysis.paragraph);
  }, [analysis]);
  
  const handlePronounce = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  }, []);
  
  return {
    handleExport,
    handleShare,
    handlePrint,
    handleCopy,
    handlePronounce,
    loading: state.dialogState.loading,
    error: state.dialogState.error,
  };
};
```

### 3.3. useDialogKeyboard Hook
```typescript
import { useEffect, useCallback } from 'react';
import { useDialogState } from './useDialogState';

export const useDialogKeyboard = (type: AnalysisType) => {
  const { state, actions } = useDialogState(type);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!state.isOpen) return;
    
    switch (event.key) {
      case 'Escape':
        if (state.dialogState.fullscreen) {
          actions.toggleFullscreen();
        } else {
          actions.close();
        }
        break;
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          actions.toggleFullscreen();
        }
        break;
      case 'p':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Print functionality
        }
        break;
      case 'e':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Export functionality
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Share functionality
        }
        break;
    }
  }, [state.isOpen, state.dialogState.fullscreen, actions]);
  
  useEffect(() => {
    if (!state.isOpen) return;
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, handleKeyDown]);
  
  return {
    shortcuts: {
      escape: () => actions.close(),
      ctrlF: () => actions.toggleFullscreen(),
      ctrlP: () => {/* Print */},
      ctrlE: () => {/* Export */},
      ctrlS: () => {/* Share */},
    },
  };
};
```

## 4. Event System

### 4.1. Event Types
```typescript
type DialogEventType = 
  | 'dialog:open'
  | 'dialog:close'
  | 'dialog:data-update'
  | 'dialog:loading'
  | 'dialog:error'
  | 'dialog:settings-update';

interface DialogEvent<T = any> {
  type: DialogEventType;
  payload: T;
  timestamp: number;
}
```

### 4.2. Event Bus Implementation
```typescript
class DialogEventBus {
  private listeners: Map<DialogEventType, Set<Function>> = new Map();
  
  subscribe<T = (eventType: DialogEventType, callback: (event: DialogEvent<T>) => void) => {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  };
  
  emit = <T = (eventType: DialogEventType, payload: T) => {
    const event: DialogEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    
    this.listeners.get(eventType)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in dialog event listener:', error);
      }
    });
  };
  
  clear = (eventType?: DialogEventType) => {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  };
}

export const dialogEventBus = new DialogEventBus();
```

## 5. Performance Optimization

### 5.1. State Selectors
```typescript
// Optimized selectors cho Zustand
export const dialogSelectors = {
  isOpen: (type: AnalysisType) => (state: DialogGlobalState) => state.openDialogs[type],
  getData: (type: AnalysisType) => (state: DialogGlobalState) => state.dialogData[type],
  getState: (type: AnalysisType) => (state: DialogGlobalState) => state.dialogStates[type],
  isLoading: (type: AnalysisType) => (state: DialogGlobalState) => state.dialogStates[type]?.loading || false,
  getError: (type: AnalysisType) => (state: DialogGlobalState) => state.dialogStates[type]?.error || null,
  isFullscreen: (type: AnalysisType) => (state: DialogGlobalState) => state.dialogStates[type]?.fullscreen || false,
  getOpenDialogs: (state: DialogGlobalState) => Object.keys(state.openDialogs).filter(key => state.openDialogs[key as AnalysisType]) as AnalysisType[],
  getSettings: (state: DialogGlobalState) => state.settings,
};
```

### 5.2. Memoized Components
```typescript
import { memo, useMemo } from 'react';

export const MemoizedDialogHeader = memo(({ title, subtitle, icon }: DialogHeaderProps) => {
  const headerContent = useMemo(() => (
    <div className="flex items-center gap-3">
      {icon && <div className="p-2 bg-primary/10 rounded-md">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  ), [title, subtitle, icon]);
  
  return headerContent;
});

export const MemoizedDialogActions = memo(({ actions, layout }: DialogActionsProps) => {
  const actionsContent = useMemo(() => (
    <div className={`flex gap-2 ${layout === 'vertical' ? 'flex-col' : 'flex-row'}`}>
      {actions.map((action, index) => (
        <button
          key={index}
          className={`
            px-3 py-2 rounded-md text-sm font-medium
            ${action.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 
             action.variant === 'outline' ? 'border border-input bg-background hover:bg-accent' :
             'bg-primary text-primary-foreground'}
            ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
          `}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
        >
          {action.loading && <span className="animate-spin">⟳</span>}
          {!action.loading && (
            <>
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </>
          )}
        </button>
      ))}
    </div>
  ), [actions, layout]);
  
  return actionsContent;
});
```

## 6. Error Handling

### 6.1. Error Types
```typescript
type DialogErrorType = 
  | 'network'
  | 'validation'
  | 'permission'
  | 'export'
  | 'share'
  | 'unknown';

interface DialogError {
  type: DialogErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
}
```

### 6.2. Error Handler
```typescript
export const dialogErrorHandler = {
  handle: (error: unknown, context: string): DialogError => {
    console.error(`Dialog error in ${context}:`, error);
    
    if (error instanceof Error) {
      return {
        type: 'unknown',
        message: error.message,
        code: error.name,
        details: error.stack,
        timestamp: Date.now(),
      };
    }
    
    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
        timestamp: Date.now(),
      };
    }
    
    return {
      type: 'unknown',
      message: 'An unknown error occurred',
      timestamp: Date.now(),
    };
  },
  
  getUserFriendlyMessage: (error: DialogError): string => {
    switch (error.type) {
      case 'network':
        return 'Network connection failed. Please check your internet connection.';
      case 'permission':
        return 'Permission denied. Please check your browser settings.';
      case 'export':
        return 'Export failed. Please try again.';
      case 'share':
        return 'Share failed. Please try again.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  },
};
```

## 7. Testing Utilities

### 7.1. Test State Management
```typescript
export const createDialogTestStore = (initialState?: Partial<DialogGlobalState>) => {
  let store: DialogGlobalState = {
    openDialogs: { word: false, phrase: false, sentence: false, paragraph: false },
    dialogData: { word: null, phrase: null, sentence: null, paragraph: null },
    dialogStates: {
      word: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
      phrase: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
      sentence: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
      paragraph: { loading: false, error: null, fullscreen: false, lastUpdated: Date.now() },
    },
    settings: {
      enableAnimations: true,
      enableKeyboardShortcuts: true,
      defaultDialogSize: 'large',
      enableResize: true,
      enableFullscreen: true,
    },
    ...initialState,
  };
  
  const listeners = new Set<() => void>();
  
  return {
    getState: () => ({ ...store }),
    setState: (updates: Partial<DialogGlobalState>) => {
      store = { ...store, ...updates };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
```

### 7.2. Mock Utilities
```typescript
export const createMockAnalysisItem = (type: AnalysisType, overrides?: Partial<AnalysisItem>): AnalysisItem => {
  const baseItem = {
    id: `test-${type}-${Date.now()}`,
    analysisId: `test-analysis-${type}`,
    sessionId: 'test-session',
    analysisType: type,
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  switch (type) {
    case 'word':
      return {
        ...baseItem,
        analysisType: 'word',
        word: 'test word',
        translation: 'test translation',
        definition: 'test definition',
        ipa: '/test/',
        pos: 'noun',
        ...overrides,
      } as WordAnalysis;
    case 'phrase':
      return {
        ...baseItem,
        analysisType: 'phrase',
        phrase: 'test phrase',
        naturalTranslation: 'test natural translation',
        literalMeaning: 'test literal meaning',
        ...overrides,
      } as PhraseAnalysis;
    // Add other cases as needed
  }
};
```

## 8. Migration Strategy

### 8.1. State Migration
```typescript
// Migration from existing AnalysisResultDialog state to new system
export const migrateDialogState = () => {
  // Get existing state from localStorage or context
  const existingState = localStorage.getItem('analysis-dialog-state');
  
  if (existingState) {
    try {
      const parsed = JSON.parse(existingState);
      
      // Map existing state to new structure
      const migratedState: Partial<DialogGlobalState> = {
        dialogData: {
          word: parsed.wordAnalysis || null,
          phrase: parsed.phraseAnalysis || null,
          sentence: parsed.sentenceAnalysis || null,
          paragraph: parsed.paragraphAnalysis || null,
        },
        settings: {
          enableAnimations: parsed.enableAnimations ?? true,
          enableKeyboardShortcuts: parsed.enableKeyboardShortcuts ?? true,
          defaultDialogSize: parsed.defaultSize || 'large',
          enableResize: parsed.enableResize ?? true,
          enableFullscreen: parsed.enableFullscreen ?? true,
        },
      };
      
      // Store migrated state
      useDialogStore.setState(migratedState);
      
      // Clean up old state
      localStorage.removeItem('analysis-dialog-state');
      
      return true;
    } catch (error) {
      console.error('Failed to migrate dialog state:', error);
      return false;
    }
  }
  
  return false;
};
```

### 8.2. Feature Flag Integration
```typescript
export const dialogFeatureFlags = {
  useNewDialogSystem: process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('feature-new-dialog-system') === 'true',
  
  isFeatureEnabled: (feature: string) => {
    const flags = localStorage.getItem('dialog-feature-flags');
    if (flags) {
      try {
        const parsed = JSON.parse(flags);
        return parsed[feature] === true;
      } catch {
        return false;
      }
    }
    return false;
  },
  
  setFeatureFlag: (feature: string, enabled: boolean) => {
    const flags = localStorage.getItem('dialog-feature-flags') || '{}';
    try {
      const parsed = JSON.parse(flags);
      parsed[feature] = enabled;
      localStorage.setItem('dialog-feature-flags', JSON.stringify(parsed));
    } catch (error) {
      console.error('Failed to set feature flag:', error);
    }
  },
};
```

State management system này cung cấp:
- **Centralized state**: Quản lý tất cả dialog types trong một place
- **Performance optimization**: Memoization và selective updates
- **Type safety**: Full TypeScript support
- **Testing support**: Utilities cho easy testing
- **Migration path**: Smooth transition từ existing system
- **Feature flags**: Gradual rollout capability
- **Event system**: Loose coupling giữa components