# Refactored AnalysisEditor - Interfaces & Types

## 1. Core Type Definitions

### 1.1 Base Types

```typescript
// Analysis Types
export type AnalysisType = 'word' | 'sentence' | 'paragraph';

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  text: string;
  data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  timestamp: number;
  processingTime: number;
}

export interface AnalysisHistory {
  id: string;
  type: AnalysisType;
  input: string;
  result: AnalysisResult;
  timestamp: number;
}

// Editor Content Types
export interface EditorContent {
  html: string;
  json: any;
  text: string;
}

export interface TextSelection {
  text: string;
  from: number;
  to: number;
  empty: boolean;
  type: AnalysisType;
  rect?: DOMRect;
}

export interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

// Save Types
export interface SaveOptions {
  force?: boolean;
  silent?: boolean;
  metadata?: Record<string, any>;
}

export interface SaveResult {
  success: boolean;
  data?: {
    analysisId: string;
    sessionAnalysisId?: string;
    type: AnalysisType;
  };
  error?: string;
  timestamp: number;
}

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  status: 'idle' | 'saving' | 'success' | 'error';
  error?: string;
}

// Error Types
export interface EditorError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
}

export type ErrorCode = 
  | 'ANALYSIS_FAILED'
  | 'SAVE_FAILED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'SESSION_NOT_FOUND'
  | 'CONTENT_TOO_LARGE';
```

### 1.2 Configuration Types

```typescript
export interface EditorConfig {
  // Basic Configuration
  sessionId?: string;
  initialContent?: string;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  
  // Feature Toggles
  autoSave?: boolean;
  autoAnalysis?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableHighlighting?: boolean;
  
  // Timing Configuration
  analysisDebounceMs?: number;
  autoSaveDebounceMs?: number;
  autoSaveIntervalMs?: number;
  
  // UI Configuration
  theme?: 'light' | 'dark' | 'auto';
  language?: 'en' | 'vi';
  compactMode?: boolean;
  
  // Advanced Configuration
  enableDebugMode?: boolean;
  enablePerformanceMonitoring?: boolean;
  customExtensions?: any[];
}

export interface EditorTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
}
```

## 2. Component Interfaces

### 2.1 Main Container Component

```typescript
export interface AnalysisEditorProps extends EditorConfig, EditorEventHandlers {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface EditorEventHandlers {
  onTextSelect?: (text: string, type: AnalysisType) => void;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onSaveComplete?: (result: SaveResult) => void;
  onError?: (error: EditorError) => void;
  onContentChange?: (content: EditorContent) => void;
  onSelectionChange?: (selection: TextSelection) => void;
  onSessionChange?: (sessionId: string) => void;
}
```

### 2.2 Header Components

```typescript
// Editor Header
export interface EditorHeaderProps {
  session?: AnalysisSession | null;
  isLoading?: boolean;
  onNavigateBack?: () => void;
  onNavigateToSessions?: () => void;
  onSessionMenuClick?: () => void;
  onCreateNewSession?: () => void;
  className?: string;
}

// Session Info
export interface SessionInfoProps {
  session: AnalysisSession;
  analysesCount: number;
  isLoading?: boolean;
  className?: string;
}

// Breadcrumb Navigation
export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive?: boolean;
}

// Quick Actions
export interface QuickActionsProps {
  session?: AnalysisSession | null;
  onNewSession?: () => void;
  onSessionList?: () => void;
  onSettings?: () => void;
  disabled?: boolean;
  className?: string;
}
```

### 2.3 Toolbar Components

```typescript
// Main Toolbar
export interface EditorToolbarProps {
  editor: Editor;
  selection: TextSelection;
  isAnalyzing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave?: () => void;
  onFormat?: (command: FormatCommand) => void;
  onAnalysis?: (type: AnalysisType) => void;
  onHighlight?: (color: string) => void;
  onSessionActions?: () => void;
  className?: string;
}

// Save Controls
export interface SaveControlsProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  sessionId?: string;
  onSave?: () => void;
  onSessionActions?: () => void;
  disabled?: boolean;
  className?: string;
}

// Format Controls
export interface FormatControlsProps {
  editor: Editor;
  activeFormats: ActiveFormats;
  onFormat?: (command: FormatCommand) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
  heading: {
    1: boolean;
    2: boolean;
    3: boolean;
  };
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  codeBlock: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export type FormatCommand = 
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'textAlignLeft'
  | 'textAlignCenter'
  | 'textAlignRight'
  | 'textAlignJustify'
  | 'undo'
  | 'redo'
  | 'clearFormat';

// Selection Controls
export interface SelectionControlsProps {
  selection: TextSelection;
  analysisType: AnalysisType;
  onAnalysisTypeChange?: (type: AnalysisType) => void;
  onExpandToWord?: () => void;
  onExpandToSentence?: () => void;
  onExpandToParagraph?: () => void;
  onAnalyze?: () => void;
  disabled?: boolean;
  className?: string;
}

// Highlight Controls
export interface HighlightControlsProps {
  colors: string[];
  onHighlight?: (color: string) => void;
  onClearHighlight?: () => void;
  disabled?: boolean;
  className?: string;
}
```

### 2.4 Editor Content Components

```typescript
// Editor Content Wrapper
export interface EditorContentProps {
  editor: Editor;
  content: EditorContent;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  theme?: EditorTheme;
  className?: string;
}

// TipTap Editor Wrapper
export interface TipTapEditorWrapperProps {
  initialContent?: string;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  extensions?: any[];
  onUpdate?: (content: EditorContent) => void;
  onSelectionUpdate?: (selection: TextSelection) => void;
  onCreate?: (editor: Editor) => void;
  onDestroy?: () => void;
  className?: string;
}

// Bubble Menu
export interface BubbleMenuProps {
  editor: Editor;
  selection: TextSelection;
  position: { x: number; y: number };
  isVisible: boolean;
  analysisType: AnalysisType;
  onAnalysisTypeChange?: (type: AnalysisType) => void;
  onAnalyze?: () => void;
  onSave?: () => void;
  onHighlight?: (color: string) => void;
  onPronounce?: (text: string) => void;
  onClose?: () => void;
  className?: string;
}
```

### 2.5 Status Bar Components

```typescript
// Status Bar
export interface EditorStatusBarProps {
  textStats: TextStats;
  saveStatus: AutoSaveStatus;
  isAnalyzing: boolean;
  selection: TextSelection;
  onAnalysis?: () => void;
  onSave?: () => void;
  onSettings?: () => void;
  className?: string;
}

// Text Stats Display
export interface TextStatsProps {
  stats: TextStats;
  compact?: boolean;
  className?: string;
}

// Save Status Display
export interface SaveStatusProps {
  status: AutoSaveStatus;
  hasUnsavedChanges: boolean;
  showDetails?: boolean;
  className?: string;
}

// Analysis Button
export interface AnalysisButtonProps {
  isAnalyzing: boolean;
  isDisabled?: boolean;
  selection: TextSelection;
  onAnalyze?: () => void;
  onTypeChange?: (type: AnalysisType) => void;
  showTypeSelector?: boolean;
  className?: string;
}
```

### 2.6 Modal Components

```typescript
// Modals Container
export interface EditorModalsProps {
  saveDialog: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SaveDialogData) => void;
  };
  sessionQuickActions: {
    isOpen: boolean;
    onClose: () => void;
    session?: AnalysisSession | null;
  };
  errorDialog: {
    isOpen: boolean;
    error: EditorError | null;
    onClose: () => void;
  };
  className?: string;
}

// Save to Session Dialog
export interface SaveToSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveDialogData) => void;
  sessions: AnalysisSession[];
  lastAnalysis: AnalysisResult | null;
  currentSessionId?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export interface SaveDialogData {
  action: 'createSession' | 'addToSession' | 'saveOnly';
  sessionTitle?: string;
  sessionDescription?: string;
  sessionType?: AnalysisType;
  selectedSessionId?: string;
  includeAnalysis?: boolean;
}

// Session Quick Actions Dialog
export interface SessionQuickActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session?: AnalysisSession | null;
  onSessionUpdate?: (updates: Partial<AnalysisSession>) => void;
  onSessionDuplicate?: () => void;
  onSessionDelete?: () => void;
  onNewSession?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Error Dialog
export interface ErrorDialogProps {
  isOpen: boolean;
  error: EditorError | null;
  onClose: () => void;
  onRetry?: () => void;
  onReport?: () => void;
  showDetails?: boolean;
  className?: string;
}
```

## 3. State Management Interfaces

### 3.1 Context Interface

```typescript
export interface EditorContextValue {
  // State
  state: EditorState;
  
  // Actions
  actions: EditorActions;
  
  // Configuration
  config: EditorConfig;
  
  // Utilities
  utils: EditorUtils;
}

export interface EditorState {
  // Content State
  content: EditorContent;
  initialContent: EditorContent;
  
  // Selection State
  selection: TextSelection;
  bubbleMenu: {
    isVisible: boolean;
    position: { x: number; y: number };
  };
  
  // Analysis State
  analysis: {
    isAnalyzing: boolean;
    lastResult: AnalysisResult | null;
    history: AnalysisHistory[];
    error: EditorError | null;
  };
  
  // Save State
  save: {
    isAutoSaveEnabled: boolean;
    status: AutoSaveStatus;
    hasUnsavedChanges: boolean;
    lastSavedContent: string;
  };
  
  // UI State
  ui: {
    isToolbarVisible: boolean;
    isStatusBarVisible: boolean;
    isFullscreen: boolean;
    activeModal: 'save' | 'sessionActions' | 'error' | null;
    theme: EditorTheme;
  };
  
  // Session State
  session: {
    current: AnalysisSession | null;
    isLoading: boolean;
    error: string | null;
  };
}

export interface EditorActions {
  // Content Actions
  updateContent: (content: EditorContent) => void;
  resetContent: () => void;
  
  // Selection Actions
  updateSelection: (selection: TextSelection) => void;
  clearSelection: () => void;
  expandSelection: (type: 'word' | 'sentence' | 'paragraph') => void;
  
  // Analysis Actions
  triggerAnalysis: (type: AnalysisType) => void;
  cancelAnalysis: () => void;
  clearAnalysisError: () => void;
  addToHistory: (result: AnalysisResult) => void;
  clearHistory: () => void;
  
  // Save Actions
  saveContent: (options?: SaveOptions) => Promise<SaveResult>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
  
  // UI Actions
  toggleToolbar: () => void;
  toggleStatusBar: () => void;
  toggleFullscreen: () => void;
  openModal: (modal: 'save' | 'sessionActions' | 'error') => void;
  closeModal: () => void;
  setTheme: (theme: EditorTheme) => void;
  
  // Session Actions
  setCurrentSession: (session: AnalysisSession | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (data: CreateSessionRequest) => Promise<AnalysisSession>;
}

export interface EditorUtils {
  // Content Utils
  sanitizeHTML: (html: string) => string;
  validateContent: (content: EditorContent) => boolean;
  formatContent: (content: EditorContent, format: 'html' | 'json' | 'text') => string;
  
  // Selection Utils
  getSelectedText: (selection: TextSelection) => string;
  detectSelectionType: (text: string) => AnalysisType;
  expandToWord: (editor: Editor) => void;
  expandToSentence: (editor: Editor) => void;
  expandToParagraph: (editor: Editor) => void;
  
  // Analysis Utils
  validateAnalysisRequest: (text: string, type: AnalysisType) => boolean;
  formatAnalysisResult: (result: AnalysisResult) => string;
  
  // Save Utils
  generateSaveData: (content: EditorContent, analysis?: AnalysisResult) => any;
  formatSaveError: (error: Error) => EditorError;
  
  // UI Utils
  calculateBubbleMenuPosition: (selection: TextSelection) => { x: number; y: number };
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number) => T;
  throttle: <T extends (...args: any[]) => any>(fn: T, limit: number) => T;
}
```

### 3.2 Provider Interface

```typescript
export interface EditorProviderProps {
  config: EditorConfig;
  initialState?: Partial<EditorState>;
  onStateChange?: (state: EditorState) => void;
  onError?: (error: EditorError) => void;
  children: React.ReactNode;
}

export interface EditorProviderValue {
  // Context value
  context: EditorContextValue;
  
  // Direct access to commonly used values
  editor: Editor | null;
  selection: TextSelection;
  isAnalyzing: boolean;
  hasUnsavedChanges: boolean;
  
  // Convenience methods
  triggerAnalysis: (type?: AnalysisType) => void;
  saveContent: () => Promise<SaveResult>;
  updateContent: (content: EditorContent) => void;
}
```

## 4. Hook Interfaces

### 4.1 Custom Hooks

```typescript
// Main Editor Hook
export interface UseEditorReturn {
  // State
  state: EditorState;
  
  // Actions
  actions: EditorActions;
  
  // Utilities
  utils: EditorUtils;
  
  // Computed values
  editor: Editor | null;
  selection: TextSelection;
  isAnalyzing: boolean;
  hasUnsavedChanges: boolean;
  canSave: boolean;
  canAnalyze: boolean;
}

// Content Hook
export interface UseEditorContentReturn {
  content: EditorContent;
  updateContent: (content: EditorContent) => void;
  resetContent: () => void;
  sanitizeHTML: (html: string) => string;
  validateContent: (content: EditorContent) => boolean;
}

// Selection Hook
export interface UseEditorSelectionReturn {
  selection: TextSelection;
  bubbleMenu: { isVisible: boolean; position: { x: number; y: number } };
  updateSelection: (selection: TextSelection) => void;
  clearSelection: () => void;
  expandSelection: (type: 'word' | 'sentence' | 'paragraph') => void;
  detectSelectionType: (text: string) => AnalysisType;
}

// Analysis Hook
export interface UseEditorAnalysisReturn {
  isAnalyzing: boolean;
  lastResult: AnalysisResult | null;
  history: AnalysisHistory[];
  error: EditorError | null;
  triggerAnalysis: (type: AnalysisType) => void;
  cancelAnalysis: () => void;
  clearError: () => void;
  addToHistory: (result: AnalysisResult) => void;
  clearHistory: () => void;
}

// Save Hook
export interface UseEditorSaveReturn {
  isAutoSaveEnabled: boolean;
  status: AutoSaveStatus;
  hasUnsavedChanges: boolean;
  saveContent: (options?: SaveOptions) => Promise<SaveResult>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
}

// UI Hook
export interface UseEditorUIReturn {
  isToolbarVisible: boolean;
  isStatusBarVisible: boolean;
  isFullscreen: boolean;
  activeModal: 'save' | 'sessionActions' | 'error' | null;
  theme: EditorTheme;
  toggleToolbar: () => void;
  toggleStatusBar: () => void;
  toggleFullscreen: () => void;
  openModal: (modal: 'save' | 'sessionActions' | 'error') => void;
  closeModal: () => void;
  setTheme: (theme: EditorTheme) => void;
}
```

## 5. Testing Interfaces

### 5.1 Test Types

```typescript
export interface TestConfig {
  mockEditor?: boolean;
  mockAPI?: boolean;
  mockSession?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableDebugLogging?: boolean;
}

export interface TestHelpers {
  renderWithProvider: (component: React.ReactElement, options?: TestConfig) => RenderResult;
  createMockEditor: (overrides?: Partial<Editor>) => Editor;
  createMockSelection: (overrides?: Partial<TextSelection>) => TextSelection;
  createMockAnalysisResult: (overrides?: Partial<AnalysisResult>) => AnalysisResult;
  createMockSession: (overrides?: Partial<AnalysisSession>) => AnalysisSession;
  waitForAnalysis: (type: AnalysisType) => Promise<AnalysisResult>;
  waitForSave: () => Promise<SaveResult>;
  simulateTextSelection: (text: string, type: AnalysisType) => void;
  simulateContentChange: (content: EditorContent) => void;
}

export interface RenderResult {
  container: HTMLElement;
  baseElement: HTMLElement;
  rerender: (element: React.ReactElement) => void;
  unmount: () => void;
  getByTestId: (testId: string) => HTMLElement;
  queryByTestId: (testId: string) => HTMLElement | null;
  getByText: (text: string) => HTMLElement;
  queryByText: (text: string) => HTMLElement | null;
  getByRole: (role: string) => HTMLElement;
  queryByRole: (role: string) => HTMLElement | null;
}
```

## 6. Migration Interfaces

### 6.1 Compatibility Types

```typescript
// Legacy Props (for backward compatibility)
export interface LegacyAnalysisEditorProps {
  onTextSelect?: (text: string, type: AnalysisType) => void;
  onAnalyze?: (text: string, type: AnalysisType) => void;
  onAnalysisComplete?: (result: {
    text: string;
    type: AnalysisType;
    data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  }) => void;
  initialText?: string;
  className?: string;
  isAnalyzing?: boolean;
  sessionId?: string;
}

// Migration Utilities
export interface MigrationUtils {
  mapLegacyProps: (legacy: LegacyAnalysisEditorProps) => AnalysisEditorProps;
  mapLegacyState: (legacy: any) => EditorState;
  validateMigration: (legacy: any, modern: EditorState) => boolean;
  createCompatibilityWrapper: (Component: React.ComponentType<AnalysisEditorProps>) => React.ComponentType<LegacyAnalysisEditorProps>;
}

// Version Management
export interface VersionInfo {
  current: string;
  legacy: string;
  migrationDate: string;
  breakingChanges: string[];
  deprecatedFeatures: string[];
  newFeatures: string[];
}
```

---

*These interfaces provide a comprehensive type system for the refactored AnalysisEditor component, ensuring type safety, maintainability, and clear contracts between components.*