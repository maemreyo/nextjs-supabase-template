import {
  DialogManagerService,
  DialogEventType,
  AnalysisType,
  AnalysisItem,
  DialogOptions,
  DialogSettings,
  DialogGlobalState
} from '../types/dialog-types';
import { dialogStoreUtils } from '@/hooks/stores/analysis-dialog-store';
import { dialogEventBus } from './dialog-event-bus';
import { dialogUtils } from './dialog-utilities';

/**
 * Dialog Manager Service Implementation
 */
class DialogManagerServiceImpl implements DialogManagerService {
  private eventBus = dialogEventBus;
  
  /**
   * Open a dialog with data and options
   */
  openDialog(type: AnalysisType, data: AnalysisItem, options?: DialogOptions): void {
    const store = dialogStoreUtils.getState();
    
    // Update store
    store.openDialog(type, data);
    
    // Apply options if provided
    if (options) {
      if (options.size) {
        // Size would be handled by dialog component
      }
      
      if (options.enableResize !== undefined) {
        // Resize setting would be handled by dialog component
      }
      
      if (options.enableFullscreen !== undefined) {
        // Fullscreen setting would be handled by dialog component
      }
      
      if (options.position) {
        store.setDialogWidth(type, options.position.x);
        // Position would be handled by dialog component
      }
    }
    
    // Emit event
    this.eventBus.emit('dialog:open', { type, data });
  }
  
  /**
   * Close a dialog
   */
  closeDialog(type: AnalysisType): void {
    const store = dialogStoreUtils.getState();
    store.closeDialog(type);
    
    // Emit event
    this.eventBus.emit('dialog:close', { type });
  }
  
  /**
   * Close all dialogs
   */
  closeAllDialogs(): void {
    const store = dialogStoreUtils.getState();
    store.closeAllDialogs();
    
    // Emit event (could add batch event in future)
    Object.entries(store.openDialogs).forEach(([type, isOpen]) => {
      if (isOpen) {
        this.eventBus.emit('dialog:close', { type: type as AnalysisType });
      }
    });
  }
  
  /**
   * Toggle dialog (open if closed, close if open)
   */
  toggleDialog(type: AnalysisType, data?: AnalysisItem): void {
    const store = dialogStoreUtils.getState();
    
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
    const store = dialogStoreUtils.getState();
    return store.dialogStates[type];
  }
  
  /**
   * Get all dialog states
   */
  getAllDialogStates() {
    const store = dialogStoreUtils.getState();
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
    const store = dialogStoreUtils.getState();
    store.updateDialogData(type, data);
    
    // Emit event
    this.eventBus.emit('dialog:data-update', { type, data });
  }
  
  /**
   * Clear dialog data
   */
  clearDialogData(type: AnalysisType): void {
    const store = dialogStoreUtils.getState();
    store.updateDialogData(type, null as unknown as AnalysisItem);
  }
  
  /**
   * Update settings
   */
  updateSettings(settings: Partial<DialogSettings>): void {
    const store = dialogStoreUtils.getState();
    store.updateSettings(settings);
    
    // Emit event
    this.eventBus.emit('dialog:settings-update', settings);
  }
  
  /**
   * Get settings
   */
  getSettings() {
    const store = dialogStoreUtils.getState();
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
  }
}

// Global dialog manager instance
export const dialogManager = new DialogManagerServiceImpl();

// Re-export utilities from modular files
export { dialogEventBus } from './dialog-event-bus';
export { dialogUtils } from './dialog-utilities';
export { dialogPersistence } from './dialog-persistence';
export { dialogAnalytics } from './dialog-analytics';
export { dialogTesting } from './dialog-testing';