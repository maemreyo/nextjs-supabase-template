import React from 'react';
import { AnalysisType, AnalysisItem } from '../../types/analysis-types';
import { ExportFormat } from '../types/dialog-types';
import { dialogManager } from './dialog-service';

// Dialog components imports
import { WordAnalysisDialog } from '../word/word-analysis-dialog';
import { PhraseAnalysisDialog } from '../phrase/phrase-analysis-dialog';
import { SentenceAnalysisDialog } from '../sentence/sentence-analysis-dialog';
import { ParagraphAnalysisDialog } from '../paragraph/paragraph-analysis-dialog';

/**
 * Dialog dispatcher - maps analysis types to appropriate dialog components
 * and provides a unified interface for opening dialogs
 */
export class DialogDispatcher {
  /**
   * Open view details dialog for an analysis item
   */
  static openViewDetails(analysis: AnalysisItem, options?: {
    size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
    enableFullscreen?: boolean;
  }) {
    dialogManager.openDialog(analysis.analysisType, analysis, {
      mode: 'view',
      size: options?.size || this.getRecommendedSize(analysis),
      enableFullscreen: options?.enableFullscreen ?? true,
    });
  }

  /**
   * Open edit dialog for an analysis item
   */
  static openEditDialog(analysis: AnalysisItem, options?: {
    size?: 'default' | 'large' | 'xlarge' | 'xxlarge' | 'fullscreen';
  }) {
    dialogManager.openDialog(analysis.analysisType, analysis, {
      mode: 'edit',
      size: options?.size || this.getRecommendedSize(analysis),
    });
  }

  /**
   * Open export dialog for an analysis item
   */
  static openExportDialog(analysis: AnalysisItem, format?: ExportFormat) {
    dialogManager.openDialog(analysis.analysisType, analysis, {
      mode: 'export',
      format: format || 'json',
      size: 'default',
    });
  }

  /**
   * Add item to vocabulary
   */
  static addToVocabulary(analysis: AnalysisItem) {
    // This would typically trigger a vocabulary dialog or direct API call
    dialogManager.openDialog(analysis.analysisType, analysis, {
      mode: 'view',
      size: 'default',
    });
    
    // Emit custom event for vocabulary addition
    const event = new CustomEvent('analysis:add-to-vocabulary', {
      detail: { analysis, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Open practice dialog for an analysis item
   */
  static openPracticeDialog(analysis: AnalysisItem) {
    // This would typically trigger a practice dialog or redirect to practice page
    dialogManager.openDialog(analysis.analysisType, analysis, {
      mode: 'view', // Use 'view' mode since 'practice' is not in DialogOptions type
      size: this.getRecommendedSize(analysis),
    });
    
    // Emit custom event for practice
    const event = new CustomEvent('analysis:practice', {
      detail: { analysis, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get recommended dialog size based on analysis type and content
   */
  static getRecommendedSize(analysis: AnalysisItem): 'default' | 'large' | 'xlarge' | 'xxlarge' {
    switch (analysis.analysisType) {
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
  }

  /**
   * Get dialog component for a specific analysis type
   */
  static getDialogComponent(type: AnalysisType): React.ComponentType<any> {
    switch (type) {
      case 'word':
        return WordAnalysisDialog;
      case 'phrase':
        return PhraseAnalysisDialog;
      case 'sentence':
        return SentenceAnalysisDialog;
      case 'paragraph':
        return ParagraphAnalysisDialog;
      default:
        return WordAnalysisDialog; // Fallback
    }
  }

  /**
   * Check if dialog system is available and enabled
   */
  static isDialogSystemEnabled(): boolean {
    // Check for feature flag or environment variable
    if (typeof window !== 'undefined') {
      const isEnabled = window.localStorage.getItem('dialog-system-enabled');
      // Set default to 'true' if not set
      if (isEnabled === null) {
        window.localStorage.setItem('dialog-system-enabled', 'true');
        return true;
      }
      return isEnabled !== 'false';
    }
    return true; // Default to enabled on server-side
  }

  /**
   * Enable or disable dialog system
   */
  static setDialogSystemEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dialog-system-enabled', enabled.toString());
    }
  }

  /**
   * Handle fallback behavior when dialog system is disabled
   */
  static handleFallback(action: string, analysis: AnalysisItem, originalHandler?: Function) {
    
    // Try to call original handler if provided
    if (originalHandler && typeof originalHandler === 'function') {
      originalHandler(analysis);
      return;
    }

    // Default fallback behaviors
    switch (action) {
      case 'view':
        break;
      case 'edit':
        break;
      case 'export':
        break;
      case 'vocabulary':
        break;
      case 'practice':
        break;
      default:
    }
  }
}

/**
 * Hook for using dialog dispatcher with error handling
 */
export const useDialogDispatcher = () => {
  const isDialogSystemEnabled = DialogDispatcher.isDialogSystemEnabled();

  const openViewDetails = (analysis: AnalysisItem, options?: any, fallbackHandler?: Function) => {
    if (isDialogSystemEnabled) {
      try {
        DialogDispatcher.openViewDetails(analysis, options);
      } catch (error) {
        DialogDispatcher.handleFallback('view', analysis, fallbackHandler);
      }
    } else {
      DialogDispatcher.handleFallback('view', analysis, fallbackHandler);
    }
  };

  const openEditDialog = (analysis: AnalysisItem, options?: any, fallbackHandler?: Function) => {
    if (isDialogSystemEnabled) {
      try {
        DialogDispatcher.openEditDialog(analysis, options);
      } catch (error) {
        DialogDispatcher.handleFallback('edit', analysis, fallbackHandler);
      }
    } else {
      DialogDispatcher.handleFallback('edit', analysis, fallbackHandler);
    }
  };

  const openExportDialog = (analysis: AnalysisItem, format?: ExportFormat, fallbackHandler?: Function) => {
    if (isDialogSystemEnabled) {
      try {
        DialogDispatcher.openExportDialog(analysis, format);
      } catch (error) {
        DialogDispatcher.handleFallback('export', analysis, fallbackHandler);
      }
    } else {
      DialogDispatcher.handleFallback('export', analysis, fallbackHandler);
    }
  };

  const addToVocabulary = (analysis: AnalysisItem, fallbackHandler?: Function) => {
    if (isDialogSystemEnabled) {
      try {
        DialogDispatcher.addToVocabulary(analysis);
      } catch (error) {
        DialogDispatcher.handleFallback('vocabulary', analysis, fallbackHandler);
      }
    } else {
      DialogDispatcher.handleFallback('vocabulary', analysis, fallbackHandler);
    }
  };

  const openPracticeDialog = (analysis: AnalysisItem, fallbackHandler?: Function) => {
    if (isDialogSystemEnabled) {
      try {
        DialogDispatcher.openPracticeDialog(analysis);
      } catch (error) {
        DialogDispatcher.handleFallback('practice', analysis, fallbackHandler);
      }
    } else {
      DialogDispatcher.handleFallback('practice', analysis, fallbackHandler);
    }
  };

  return {
    openViewDetails,
    openEditDialog,
    openExportDialog,
    addToVocabulary,
    openPracticeDialog,
    isDialogSystemEnabled,
  };
};

export default DialogDispatcher;