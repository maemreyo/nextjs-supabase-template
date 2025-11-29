import {
  AnalysisType,
  AnalysisItem,
  DialogError
} from '../types/dialog-types';

/**
 * Dialog analytics utilities
 */
export const dialogAnalytics = {
  /**
   * Track dialog open
   */
  trackDialogOpen: (type: AnalysisType, data: AnalysisItem): void => {
    
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