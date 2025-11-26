import {
  DialogGlobalState
} from '../types/dialog-types';

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