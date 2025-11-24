# AnalysisEditor.tsx Refactoring Plan

## 1. Current Architecture Analysis

### 1.1 Component Structure Overview

**Current Issues Identified:**

#### 🚨 **Critical Issues**
1. **Single Responsibility Principle Violation** (832 lines)
   - Handles text editing, analysis triggering, session management, auto-save, UI rendering, keyboard shortcuts
   - Mixed concerns: UI logic, business logic, state management, event handling

2. **Security Vulnerabilities**
   - **XSS Risk**: Direct HTML rendering without sanitization in TipTap editor
   - **Input Validation**: Missing validation for user inputs in analysis requests
   - **Data Exposure**: Sensitive session data exposed in client-side logs

3. **Performance Issues**
   - **Memory Leaks**: Uncleanup of event listeners and timeouts
   - **Excessive Re-renders**: Missing memoization for expensive operations
   - **Inefficient Debouncing**: Multiple debounce mechanisms conflicting

4. **Zero Test Coverage**
   - No unit tests, integration tests, or E2E tests
   - Critical business logic untested

5. **Broken Component Structure**
   - `SessionQuickActions` rendered outside return statement (lines 823-827)
   - Potential React rendering errors

#### ⚠️ **Maintainability Issues**
6. **Error Handling Inconsistencies**
   - Silent failures in auto-save mechanisms
   - Inconsistent error propagation
   - Missing error boundaries

7. **Accessibility Violations**
   - Missing ARIA labels on interactive elements
   - No keyboard navigation support for custom components
   - Poor focus management

### 1.2 Current Dependencies Analysis

```typescript
// External Dependencies
- React (useState, useRef, useCallback, useEffect, useMemo)
- TipTap Editor (useEditor, EditorContent)
- Zustand Store (useSessionStore)
- Next.js (useSearchParams, useRouter)

// Internal Hooks
- useTipTapEditor (121 lines)
- useTipTapSelection (325 lines) 
- useTipTapAutoSave (284 lines)
- useSessionData (237 lines)
- useAnalysisSave (129 lines)

// Internal Components
- SessionQuickActions (446 lines)
- UI Components (Button, Dialog, Input, etc.)
```

### 1.3 State Management Complexity

```typescript
// Local State (23 useState calls)
- isAnalyzing, autoAnalysisEnabled, autoSaveEnabled
- lastAnalysisResult, saveToSessionDialogOpen
- sessionTitle, selectedSessionId, sessionQuickActionsOpen

// External State
- useSessionStore (908 lines)
- Multiple hook states interacting
```

## 2. Proposed Component Architecture

### 2.1 Component Hierarchy Design

```
AnalysisEditor (Container - ~150 lines)
├── EditorHeader (Presentation)
│   ├── SessionInfo
│   ├── BreadcrumbNavigation
│   └── QuickActions
├── EditorToolbar (Presentation)
│   ├── SaveControls
│   ├── FormatControls
│   ├── SelectionControls
│   └── HighlightControls
├── EditorContent (Presentation)
│   ├── TipTapEditorWrapper
│   └── BubbleMenu
├── EditorStatusBar (Presentation)
│   ├── TextStats
│   ├── SaveStatus
│   └── AnalysisButton
└── EditorModals (Presentation)
    ├── SaveToSessionDialog
    ├── SessionQuickActionsDialog
    └── ErrorBoundary
```

### 2.2 Separation of Concerns

#### **Container Components**
- `AnalysisEditor`: Orchestration, data flow, business logic
- `EditorProvider`: Context provider for editor state

#### **Presentation Components**
- `EditorHeader`: Session info and navigation
- `EditorToolbar`: All toolbar functionality
- `EditorContent`: TipTap editor wrapper
- `EditorStatusBar`: Status information and controls

#### **Business Logic Components**
- `AnalysisOrchestrator`: Manages analysis workflow
- `SaveManager`: Handles all save operations
- `KeyboardShortcutManager`: Keyboard event handling

## 3. Interface Definitions

### 3.1 Core Interfaces

```typescript
// Editor State Management
interface EditorState {
  content: EditorContent;
  selection: TextSelection;
  isAnalyzing: boolean;
  hasUnsavedChanges: boolean;
  lastAnalysisResult: AnalysisResult | null;
  autoSaveStatus: AutoSaveStatus;
}

interface EditorActions {
  updateContent: (content: EditorContent) => void;
  updateSelection: (selection: TextSelection) => void;
  triggerAnalysis: (type: AnalysisType) => void;
  saveContent: (options?: SaveOptions) => Promise<void>;
  resetEditor: () => void;
}

// Configuration
interface EditorConfig {
  sessionId?: string;
  initialContent?: string;
  autoSave?: boolean;
  autoAnalysis?: boolean;
  analysisDebounceMs?: number;
  readOnly?: boolean;
}

// Event Handlers
interface EditorEventHandlers {
  onTextSelect: (text: string, type: AnalysisType) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onSaveComplete: (data: SaveResult) => void;
  onError: (error: EditorError) => void;
}

// Component Props
interface AnalysisEditorProps extends EditorConfig, EditorEventHandlers {
  className?: string;
  children?: React.ReactNode;
}
```

### 3.2 Sub-component Interfaces

```typescript
// Toolbar Components
interface ToolbarProps {
  editor: Editor;
  selection: TextSelection;
  isAnalyzing: boolean;
  onSave: () => void;
  onFormat: (command: FormatCommand) => void;
  onAnalysis: (type: AnalysisType) => void;
}

// Status Bar
interface StatusBarProps {
  textStats: TextStats;
  saveStatus: SaveStatus;
  isAnalyzing: boolean;
  onAnalysis: () => void;
}

// Modals
interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveDialogData) => void;
  sessions: Session[];
  lastAnalysis: AnalysisResult | null;
}
```

## 4. State Management Improvements

### 4.1 Context-Based Architecture

```typescript
// Editor Context
const EditorContext = createContext<{
  state: EditorState;
  actions: EditorActions;
  config: EditorConfig;
}>();

// Provider Component
export const EditorProvider: React.FC<{
  config: EditorConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  // State management logic
  // Event handling
  // Side effects
};

// Custom Hook
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};
```

### 4.2 State Slices

```typescript
// Content State Slice
interface ContentState {
  html: string;
  json: any;
  text: string;
  lastSaved: string;
}

// Selection State Slice  
interface SelectionState {
  text: string;
  from: number;
  to: number;
  type: AnalysisType;
  rect?: DOMRect;
}

// Analysis State Slice
interface AnalysisState {
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  error: string | null;
  history: AnalysisHistory[];
}
```

## 5. Testing Strategy

### 5.1 Test Pyramid Structure

```
E2E Tests (10%)
├── Critical user journeys
├── Cross-browser compatibility
└── Performance benchmarks

Integration Tests (30%)
├── Component integration
├── Hook integration
├── API integration
└── State management

Unit Tests (60%)
├── Component rendering
├── Business logic
├── Utility functions
└── Event handlers
```

### 5.2 Test Coverage Requirements

```typescript
// Critical Paths to Test
1. Editor initialization and content loading
2. Text selection and analysis triggering
3. Save operations (manual and auto)
4. Keyboard shortcuts
5. Error handling and recovery
6. Session management
7. Accessibility features
```

### 5.3 Testing Tools Setup

```typescript
// Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Providers
const MockEditorProvider = ({ children }) => (
  <EditorProvider config={mockConfig}>
    {children}
  </EditorProvider>
);

// Test Utilities
const renderWithEditor = (component, options = {}) => {
  return render(
    <MockEditorProvider>
      {component}
    </MockEditorProvider>,
    options
  );
};
```

## 6. Security Improvements

### 6.1 Input Sanitization

```typescript
// Content Sanitization
import DOMPurify from 'dompurify';

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'],
  });
};

// Analysis Request Validation
const validateAnalysisRequest = (text: string, type: AnalysisType): boolean => {
  const maxLengths = {
    word: 100,
    sentence: 500,
    paragraph: 2000
  };
  
  return text.length <= maxLengths[type] && text.trim().length > 0;
};
```

### 6.2 Error Handling

```typescript
// Secure Error Handling
const handleSecureError = (error: unknown): EditorError => {
  // Remove sensitive information
  const sanitizedError = {
    message: error instanceof Error ? error.message : 'Unknown error',
    code: getErrorCode(error),
    timestamp: new Date().toISOString(),
    // No stack traces or internal paths exposed
  };
  
  // Log securely
  console.error('Editor Error:', sanitizedError);
  
  return sanitizedError;
};
```

## 7. Performance Optimizations

### 7.1 Memoization Strategy

```typescript
// Component Memoization
const EditorToolbar = React.memo(({ editor, selection, onAction }: ToolbarProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return shallowEqual(prevProps, nextProps);
});

// Hook Memoization
const useAnalysisDebounce = (text: string, type: AnalysisType) => {
  const debouncedAnalysis = useMemo(
    () => debounce(performAnalysis, 800),
    []
  );
  
  useEffect(() => {
    if (text.trim()) {
      debouncedAnalysis(text, type);
    }
  }, [text, type, debouncedAnalysis]);
};
```

### 7.2 Memory Management

```typescript
// Cleanup Management
const useEditorCleanup = (editor: Editor) => {
  useEffect(() => {
    return () => {
      // Cleanup event listeners
      editor.destroy();
      
      // Clear timeouts
      clearAllTimeouts();
      
      // Abort pending requests
      abortPendingRequests();
    };
  }, [editor]);
};
```

## 8. Migration Strategy

### 8.1 Phase-Based Migration

#### **Phase 1: Foundation (Week 1-2)**
- Create new component interfaces and types
- Set up testing infrastructure
- Create base container and presentation components
- Implement basic state management

#### **Phase 2: Core Features (Week 3-4)**
- Migrate editor functionality
- Implement toolbar components
- Add save functionality
- Integrate analysis workflow

#### **Phase 3: Advanced Features (Week 5-6)**
- Add keyboard shortcuts
- Implement session management
- Add accessibility features
- Performance optimizations

#### **Phase 4: Testing & Polish (Week 7-8)**
- Comprehensive testing
- Error handling improvements
- Security hardening
- Documentation

### 8.2 Backward Compatibility

```typescript
// Compatibility Wrapper
const AnalysisEditorCompat: React.FC<LegacyProps> = (props) => {
  // Map legacy props to new interface
  const newProps = mapLegacyToNew(props);
  
  return (
    <ErrorBoundary>
      <AnalysisEditor {...newProps} />
    </ErrorBoundary>
  );
};

// Gradual Migration Strategy
export { AnalysisEditor as NewAnalysisEditor };
export { AnalysisEditorCompat as AnalysisEditor }; // Default export
```

## 9. Implementation Effort Estimation

### 9.1 Effort Breakdown

| Component | Lines | Complexity | Effort (days) |
|-----------|-------|-------------|----------------|
| AnalysisEditor (Container) | 150 | Medium | 3 |
| EditorHeader | 80 | Low | 1 |
| EditorToolbar | 200 | Medium | 4 |
| EditorContent | 120 | High | 5 |
| EditorStatusBar | 60 | Low | 1 |
| EditorModals | 150 | Medium | 3 |
| State Management | 200 | High | 5 |
| Testing Suite | 400 | High | 8 |
| **Total** | **1360** | **High** | **30** |

### 9.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Breaking changes | Medium | High | Compatibility wrapper |
| Performance regression | Low | Medium | Performance monitoring |
| Feature gaps | Medium | Medium | Feature parity checklist |
| Testing coverage gaps | Low | High | Code coverage requirements |

## 10. Success Metrics

### 10.1 Quality Metrics

- **Code Coverage**: >90% for new components
- **Component Size**: <200 lines per component
- **Bundle Size**: <10% increase from current
- **Performance**: <100ms interaction response time
- **Accessibility**: WCAG 2.1 AA compliance

### 10.2 Development Metrics

- **Build Time**: <30% increase
- **Test Execution**: <5 minutes for full suite
- **Type Safety**: 100% TypeScript coverage
- **Documentation**: 100% API documentation

## 11. Next Steps

1. **Get stakeholder approval** for the refactoring plan
2. **Set up development branch** for refactoring work
3. **Create component scaffolding** with basic structure
4. **Implement testing infrastructure** before development
5. **Start with Phase 1** foundation work
6. **Regular progress reviews** with stakeholders
7. **Performance monitoring** during development
8. **User acceptance testing** before deployment

---

*This document will be updated throughout the refactoring process to reflect changes and progress.*