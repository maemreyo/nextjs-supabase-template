import {
  DialogManagerService,
  DialogEvent,
  DialogEventType,
  AnalysisType,
  AnalysisItem,
  DialogOptions,
  DialogError,
  DialogErrorType,
  DialogSettings,
  DialogGlobalState
} from '../types/dialog-types';
import { dialogStoreUtils, useDialogStore } from '../../../../stores/analysis-dialog-store';

/**
 * Dialog Event Bus for loose coupling between components
 */
class DialogEventBus {
  private listeners: Map<DialogEventType, Set<(event: DialogEvent<any>) => void>> = new Map();
  
  /**
   * Subscribe to dialog events
   */
  subscribe<T = any>(eventType: DialogEventType, callback: (event: DialogEvent<T>) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    const listenerSet = this.listeners.get(eventType)!;
    listenerSet.add(callback);
    
    // Return unsubscribe function
    return () => {
      listenerSet.delete(callback);
      if (listenerSet.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }
  
  /**
   * Emit dialog events
   */
  emit<T = any>(eventType: DialogEventType, payload: T): void {
    const event: DialogEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    
    const listenerSet = this.listeners.get(eventType);
    if (listenerSet) {
      listenerSet.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in dialog event listener for ${eventType}:`, error);
        }
      });
    }
  }
  
  /**
   * Clear all listeners for an event type
   */
  clear(eventType?: DialogEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Global event bus instance
export const dialogEventBus = new DialogEventBus();

/**
 * Dialog Manager Service Implementation
 */
class DialogManagerServiceImpl implements DialogManagerService {
  private eventBus = dialogEventBus;
  
  /**
   * Open a dialog with data and options
   */
  openDialog(type: AnalysisType, data: AnalysisItem, options?: DialogOptions): void {
    const store = useDialogStore.getState();
    
    // Update store
    store.openDialog(type, data);
    
    // Apply options if provided
    if (options) {
      if (options.size) {
        // Size would be handled by dialog component
        console.log(`Dialog size set to: ${options.size}`);
      }
      
      if (options.enableResize !== undefined) {
        // Resize setting would be handled by dialog component
        console.log(`Dialog resize enabled: ${options.enableResize}`);
      }
      
      if (options.enableFullscreen !== undefined) {
        // Fullscreen setting would be handled by dialog component
        console.log(`Dialog fullscreen enabled: ${options.enableFullscreen}`);
      }
      
      if (options.position) {
        store.setDialogWidth(type, options.position.x);
        // Position would be handled by the dialog component
        console.log(`Dialog position set to:`, options.position);
      }
    }
    
    // Emit event
    this.eventBus.emit('dialog:open', { type, data });
  }
  
  /**
   * Close a dialog
   */
  closeDialog(type: AnalysisType): void {
    const store = useDialogStore.getState();
    store.closeDialog(type);
    
    // Emit event
    this.eventBus.emit('dialog:close', { type });
  }
  
  /**
   * Close all dialogs
   */
  closeAllDialogs(): void {
    const store = useDialogStore.getState();
    store.closeAllDialogs();
    
    // Emit event (could add batch event in future)
    Object.values(store.openDialogs).forEach((isOpen, index) => {
      const type = Object.keys(store.openDialogs)[index] as AnalysisType;
      if (isOpen) {
        this.eventBus.emit('dialog:close', { type });
      }
    });
  }
  
  /**
   * Toggle dialog (open if closed, close if open)
   */
  toggleDialog(type: AnalysisType, data?: AnalysisItem): void {
    const store = useDialogStore.getState();
    
    if (store.openDialogs[type]) {
      this.closeDialog(type);
    } else if (data) {
      this.openDialog(type, data);
    }
  }
  
  /**
   * Get dialog state
   */
  getDialogState(type: AnalysisType) {
    const store = useDialogStore.getState();
    return store.dialogStates[type];
  }
  
  /**
   * Get all dialog states
   */
  getAllDialogStates() {
    const store = useDialogStore.getState();
    return store.dialogStates;
  }
  
  /**
   * Get open dialogs
   */
  getOpenDialogs(): AnalysisType[] {
    return dialogStoreUtils.getOpenDialogTypes();
  }
  
  /**
   * Update dialog data
   */
  updateDialogData(type: AnalysisType, data: AnalysisItem): void {
    const store = useDialogStore.getState();
    store.updateDialogData(type, data);
    
    // Emit event
    this.eventBus.emit('dialog:data-update', { type, data });
  }
  
  /**
   * Clear dialog data
   */
  clearDialogData(type: AnalysisType): void {
    const store = useDialogStore.getState();
    store.updateDialogData(type, null as unknown as AnalysisItem);
  }
  
  /**
   * Update settings
   */
  updateSettings(settings: Partial<DialogSettings>): void {
    const store = useDialogStore.getState();
    store.updateSettings(settings);
    
    // Emit event
    this.eventBus.emit('dialog:settings-update', settings);
  }
  
  /**
   * Get settings
   */
  getSettings() {
    const store = useDialogStore.getState();
    return store.settings;
  }
  
  /**
   * Subscribe to dialog changes
   */
  subscribe(callback: (state: DialogGlobalState) => void): () => void {
    return dialogStoreUtils.subscribe(callback);
  }
  
  /**
   * Unsubscribe from dialog changes
   */
  unsubscribe(_callback: (state: DialogGlobalState) => void): void {
    // This would be implemented by store subscription
    // Parameter is unused but required by interface
    void _callback;
    console.log('Unsubscribe called');
  }
}

// Global dialog manager instance
export const dialogManager = new DialogManagerServiceImpl();

/**
 * Dialog utilities for common operations
 */
export const dialogUtils = {
  /**
   * Type guard for analysis items
   */
  isValidAnalysisItem: (item: any): item is AnalysisItem => {
    return item &&
           typeof item === 'object' &&
           item !== null &&
           'analysisType' in item &&
           ['word', 'phrase', 'sentence', 'paragraph'].includes(item.analysisType);
  },
  
  /**
   * Get display text for analysis item
   */
  getDisplayText: (item: AnalysisItem): string => {
    switch (item.analysisType) {
      case 'word':
        return item.word || '';
      case 'phrase':
        return item.phrase || '';
      case 'sentence':
        return item.sentence || '';
      case 'paragraph':
        return item.paragraph || '';
      default:
        return '';
    }
  },
  
  /**
   * Get analysis type label
   */
  getAnalysisTypeLabel: (type: AnalysisType): string => {
    switch (type) {
      case 'word':
        return 'Word Analysis';
      case 'phrase':
        return 'Phrase Analysis';
      case 'sentence':
        return 'Sentence Analysis';
      case 'paragraph':
        return 'Paragraph Analysis';
      default:
        return 'Analysis';
    }
  },
  
  /**
   * Format analysis date
   */
  formatDate: (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  },
  
  /**
   * Generate unique ID for dialog instances
   */
  generateDialogId: (type: AnalysisType, data: AnalysisItem): string => {
    return `dialog-${type}-${data.id}-${Date.now()}`;
  },
  
  /**
   * Check if dialog should be fullscreen based on content
   */
  shouldUseFullscreen: (item: AnalysisItem): boolean => {
    switch (item.analysisType) {
      case 'paragraph':
        // Paragraphs might benefit from fullscreen
        return true;
      case 'sentence':
        // Long sentences might benefit from fullscreen
        return (item.sentence?.length || 0) > 100;
      default:
        return false;
    }
  },
  
  /**
   * Get recommended dialog size based on content
   */
  getRecommendedSize: (item: AnalysisItem): 'default' | 'large' | 'xlarge' | 'xxlarge' => {
    switch (item.analysisType) {
      case 'word':
        return 'default';
      case 'phrase':
        return 'large';
      case 'sentence':
        return 'large';
      case 'paragraph':
        return 'xlarge';
      default:
        return 'large';
    }
  },
  
  /**
   * Create dialog error
   */
  createError: (type: DialogErrorType, message: string, details?: unknown): DialogError => {
    return {
      type,
      message,
      code: type.toUpperCase(),
      details,
      timestamp: Date.now(),
    };
  },
  
  /**
   * Handle dialog errors
   */
  handleError: (error: DialogError, context: string): void => {
    console.error(`Dialog error in ${context}:`, error);
    
    // Emit error event
    dialogEventBus.emit('dialog:error', error);
    
    // Could integrate with error reporting service
    if (typeof window !== 'undefined' && 'errorReporting' in window) {
      (window as any).errorReporting?.report?.(error, context);
    }
  },
  
  /**
   * Validate dialog options
   */
  validateOptions: (options?: DialogOptions): boolean => {
    if (!options) return true;
    
    // Validate size
    if (options.size && !['default', 'large', 'xlarge', 'xxlarge', 'fullscreen'].includes(options.size)) {
      console.error('Invalid dialog size:', options.size);
      return false;
    }
    
    // Validate position
    if (options.position && (typeof options.position.x !== 'number' || typeof options.position.y !== 'number')) {
      console.error('Invalid dialog position:', options.position);
      return false;
    }
    
    return true;
  },
  
  /**
   * Merge dialog options with defaults
   */
  mergeOptions: (defaults: DialogOptions, options?: DialogOptions): DialogOptions => {
    return {
      size: defaults.size,
      enableResize: defaults.enableResize,
      enableFullscreen: defaults.enableFullscreen,
      position: defaults.position,
      ...options,
    };
  },
  
  /**
   * Check if dialog can be opened (rate limiting, etc.)
   */
  canOpenDialog: (type: AnalysisType): boolean => {
    // Check if dialog of this type is already open
    const openDialogs = dialogStoreUtils.getOpenDialogTypes();
    const isAlreadyOpen = openDialogs.includes(type);
    
    // Check rate limiting (max 3 dialogs at once)
    const hasReachedLimit = openDialogs.length >= 3;
    
    if (isAlreadyOpen) {
      console.warn(`Dialog of type ${type} is already open`);
      return false;
    }
    
    if (hasReachedLimit) {
      console.warn('Maximum number of open dialogs reached');
      return false;
    }
    
    return true;
  },
  
  /**
   * Get dialog z-index based on open order
   */
  getDialogZIndex: (type: AnalysisType): number => {
    const openDialogs = dialogStoreUtils.getOpenDialogTypes();
    const baseZIndex = 1000;
    const dialogIndex = openDialogs.indexOf(type);
    
    return baseZIndex + (dialogIndex * 10);
  },
  
  /**
   * Create dialog animation config
   */
  createAnimationConfig: () => {
    return {
      enter: 'fade-in 0.3s ease-out',
      exit: 'fade-out 0.2s ease-in',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    };
  },
};

/**
 * Dialog persistence utilities
 */
export const dialogPersistence = {
  /**
   * Save dialog state to localStorage
   */
  saveState: (state: DialogGlobalState): void => {
    try {
      localStorage.setItem('dialog-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save dialog state:', error);
    }
  },
  
  /**
   * Load dialog state from localStorage
   */
  loadState: (): DialogGlobalState | null => {
    try {
      const saved = localStorage.getItem('dialog-state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load dialog state:', error);
      return null;
    }
  },
  
  /**
   * Clear dialog state from localStorage
   */
  clearState: (): void => {
    try {
      localStorage.removeItem('dialog-state');
    } catch (error) {
      console.error('Failed to clear dialog state:', error);
    }
  },
  
  /**
   * Save dialog preferences
   */
  savePreferences: (preferences: Record<string, unknown>): void => {
    try {
      localStorage.setItem('dialog-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save dialog preferences:', error);
    }
  },
  
  /**
   * Load dialog preferences
   */
  loadPreferences: (): Record<string, unknown> => {
    try {
      const saved = localStorage.getItem('dialog-preferences');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load dialog preferences:', error);
      return {};
    }
  },
};

/**
 * Dialog analytics utilities
 */
export const dialogAnalytics = {
  /**
   * Track dialog open
   */
  trackDialogOpen: (type: AnalysisType, data: AnalysisItem): void => {
    console.log(`Dialog opened: ${type}`, data);
    
    // Could send to analytics service
    if (typeof window !== 'undefined' && 'analytics' in window) {
      (window as any).analytics?.track('dialog_open', {
        dialog_type: type,
        analysis_id: data.id,
        timestamp: Date.now(),
      });
    }
  },
  
  /**
   * Track dialog close
   */
  trackDialogClose: (type: AnalysisType, duration: number): void => {
    console.log(`Dialog closed: ${type}`, `Duration: ${duration}ms`);
    
    // Could send to analytics service
    if (typeof window !== 'undefined' && 'analytics' in window) {
      (window as any).analytics?.track('dialog_close', {
        dialog_type: type,
        duration_ms: duration,
        timestamp: Date.now(),
      });
    }
  },
  
  /**
   * Track dialog action
   */
  trackDialogAction: (type: AnalysisType, action: string, data?: unknown): void => {
    console.log(`Dialog action: ${type}`, action, data);
    
    // Could send to analytics service
    if (typeof window !== 'undefined' && 'analytics' in window) {
      (window as any).analytics?.track('dialog_action', {
        dialog_type: type,
        action,
        data,
        timestamp: Date.now(),
      });
    }
  },
  
  /**
   * Track dialog error
   */
  trackDialogError: (type: AnalysisType, error: DialogError): void => {
    console.log(`Dialog error: ${type}`, error);
    
    // Could send to analytics service
    if (typeof window !== 'undefined' && 'analytics' in window) {
      (window as any).analytics?.track('dialog_error', {
        dialog_type: type,
        error_type: error.type,
        error_message: error.message,
        timestamp: Date.now(),
      });
    }
  },
};

/**
 * Dialog testing utilities
 */
export const dialogTesting = {
  /**
   * Create mock analysis item for testing
   */
  createMockAnalysisItem: (type: AnalysisType, overrides?: Partial<AnalysisItem>): AnalysisItem => {
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
        } as AnalysisItem;
      case 'phrase':
        return {
          ...baseItem,
          analysisType: 'phrase',
          phrase: 'test phrase',
          naturalTranslation: 'test natural translation',
          literalMeaning: 'test literal meaning',
          ...overrides,
        } as AnalysisItem;
      case 'sentence':
        return {
          ...baseItem,
          analysisType: 'sentence',
          sentence: 'test sentence',
          naturalTranslation: 'test natural translation',
          mainIdea: 'test main idea',
          ...overrides,
        } as AnalysisItem;
      case 'paragraph':
        return {
          ...baseItem,
          analysisType: 'paragraph',
          paragraph: 'test paragraph',
          mainTopic: 'test topic',
          tone: 'neutral',
          ...overrides,
        } as AnalysisItem;
      default:
        return baseItem as AnalysisItem;
    }
  },
  
  /**
   * Create mock dialog state for testing
   */
  createMockDialogState: (overrides?: Partial<DialogGlobalState>): DialogGlobalState => {
    return {
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
      ...overrides,
    };
  },
};