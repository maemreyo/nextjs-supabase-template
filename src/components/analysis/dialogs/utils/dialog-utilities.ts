import {
  AnalysisType,
  AnalysisItem,
  DialogOptions,
  DialogError,
  DialogErrorType
} from '../types/dialog-types';
import { dialogStoreUtils } from '@/hooks/stores/analysis-dialog-store';

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
    
    // Emit error event
    // Will be imported from dialog-event-bus to avoid circular dependency
    import('./dialog-event-bus').then(({ dialogEventBus }) => {
      dialogEventBus.emit('dialog:error', error);
    });
    
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
      return false;
    }
    
    // Validate position
    if (options.position && (typeof options.position.x !== 'number' || typeof options.position.y !== 'number')) {
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
      return false;
    }
    
    if (hasReachedLimit) {
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