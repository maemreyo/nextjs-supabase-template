import { useEffect, useCallback } from 'react';
import { useDialogState } from './use-dialog-state';
import { 
  UseDialogKeyboardProps, 
  KeyboardShortcuts, 
  AnalysisType 
} from '../types/dialog-types';

/**
 * Hook for dialog keyboard shortcuts
 * @param props - Keyboard hook props
 * @returns Keyboard shortcuts object
 */
export const useDialogKeyboard = ({ 
  isOpen, 
  onClose, 
  onFullscreen, 
  onExport, 
  onPrint, 
  onShare 
}: UseDialogKeyboardProps): KeyboardShortcuts => {
  const { actions } = useDialogState('word'); // Default type, will be overridden
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    // Handle shortcuts based on key combinations
    switch (event.key) {
      case 'Escape':
        // Close dialog or exit fullscreen
        if (event.shiftKey) {
          // Shift+Escape: Exit fullscreen
          onFullscreen?.();
        } else {
          // Escape: Close dialog
          onClose();
        }
        break;
        
      case 'f':
      case 'F':
        // Ctrl/Cmd+F: Toggle fullscreen
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onFullscreen?.();
        }
        break;
        
      case 'p':
      case 'P':
        // Ctrl/Cmd+P: Print
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onPrint?.();
        }
        break;
        
      case 'e':
      case 'E':
        // Ctrl/Cmd+E: Export
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExport?.('json'); // Default to JSON
        }
        break;
        
      case 's':
      case 'S':
        // Ctrl/Cmd+S: Share
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onShare?.();
        }
        break;
        
      case 'c':
      case 'C':
        // Ctrl/Cmd+Shift+C: Copy
        if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
          event.preventDefault();
          // Copy functionality would be handled by the dialog actions
        }
        break;
        
      case '1':
        // Ctrl/Cmd+1: Export as PDF
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExport?.('pdf');
        }
        break;
        
      case '2':
        // Ctrl/Cmd+2: Export as CSV
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExport?.('csv');
        }
        break;
        
      case '3':
        // Ctrl/Cmd+3: Export as TXT
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExport?.('txt');
        }
        break;
        
      case '4':
        // Ctrl/Cmd+4: Export as HTML
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onExport?.('html');
        }
        break;
        
      case 'Enter':
        // Enter: Confirm action (context dependent)
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
          // Could trigger default action
          event.preventDefault();
        }
        break;
        
      case 'Tab':
        // Tab: Navigate between dialog elements
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Focus management would be handled by the dialog component
        }
        break;
        
      case 'ArrowUp':
      case 'ArrowUp':
        // Up arrow: Navigate up
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Navigation would be handled by the dialog component
        }
        break;
        
      case 'ArrowDown':
      case 'ArrowDown':
        // Down arrow: Navigate down
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Navigation would be handled by the dialog component
        }
        break;
        
      case 'Home':
        // Home: Go to first element
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Navigation would be handled by the dialog component
        }
        break;
        
      case 'End':
        // End: Go to last element
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Navigation would be handled by the dialog component
        }
        break;
        
      case 'PageUp':
        // Page Up: Scroll up
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Scroll would be handled by the dialog component
        }
        break;
        
      case 'PageDown':
        // Page Down: Scroll down
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Scroll would be handled by the dialog component
        }
        break;
    }
  }, [isOpen, onClose, onFullscreen, onExport, onPrint, onShare]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    if (!isOpen) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);
  
  // Return keyboard shortcuts object for external use
  const shortcuts: KeyboardShortcuts = {
    escape: () => onClose(),
    ctrlF: () => onFullscreen?.(),
    ctrlP: () => onPrint?.(),
    ctrlE: () => onExport?.('json'),
    ctrlS: () => onShare?.(),
    ctrlShiftC: () => {
      // Copy functionality - would need access to clipboard API
      if (navigator.clipboard) {
        // This would be implemented by the specific dialog
        console.log('Copy shortcut triggered');
      }
    },
  };
  
  return shortcuts;
};

/**
 * Hook for global keyboard shortcuts (works across all dialogs)
 * @returns Global keyboard shortcuts utilities
 */
export const useGlobalDialogShortcuts = () => {
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Global shortcuts that work regardless of which dialog is open
    
    // Ctrl/Cmd+D: Close all dialogs
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      // This would close all open dialogs
      console.log('Close all dialogs shortcut triggered');
    }
    
    // Ctrl/Cmd+Shift+D: Reset all dialogs
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      // This would reset all dialog states
      console.log('Reset all dialogs shortcut triggered');
    }
    
    // F11: Toggle fullscreen for current dialog
    if (event.key === 'F11') {
      event.preventDefault();
      // This would toggle fullscreen for the active dialog
      console.log('Toggle fullscreen shortcut triggered');
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);
  
  return {
    closeAll: () => console.log('Close all dialogs'),
    resetAll: () => console.log('Reset all dialogs'),
    toggleFullscreen: () => console.log('Toggle fullscreen'),
  };
};

/**
 * Hook for accessibility keyboard navigation
 * @param dialogRef - Reference to dialog element
 * @returns Accessibility utilities
 */
export const useDialogAccessibility = (dialogRef: React.RefObject<HTMLElement>) => {
  const handleAccessibilityKeyDown = useCallback((event: KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    switch (event.key) {
      case 'Tab':
        // Ensure focus stays within dialog
        if (!event.shiftKey) {
          // Moving forward
          const focusableElements = dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        } else {
          // Moving backward (Shift+Tab)
          const focusableElements = dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        }
        break;
        
      case 'Enter':
      case ' ':
        // Space or Enter: Activate focused element
        if (event.target === dialog || dialog.contains(event.target as Node)) {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.tagName === 'BUTTON') {
            event.preventDefault();
            activeElement.click();
          }
        }
        break;
    }
  }, [dialogRef]);
  
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    dialog.addEventListener('keydown', handleAccessibilityKeyDown);
    
    return () => {
      dialog.removeEventListener('keydown', handleAccessibilityKeyDown);
    };
  }, [dialogRef, handleAccessibilityKeyDown]);
  
  return {
    trapFocus: () => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      
      if (firstElement) {
        setTimeout(() => firstElement.focus(), 0);
      }
    },
  };
};

/**
 * Hook for keyboard shortcut help
 * @param showHelp - Whether to show help
 * @returns Help utilities
 */
export const useKeyboardHelp = (showHelp: boolean = false) => {
  const shortcuts = [
    { key: 'Escape', description: 'Close dialog', category: 'Dialog Control' },
    { key: 'Ctrl/Cmd+F', description: 'Toggle fullscreen', category: 'Dialog Control' },
    { key: 'Ctrl/Cmd+P', description: 'Print content', category: 'Export' },
    { key: 'Ctrl/Cmd+E', description: 'Export as JSON', category: 'Export' },
    { key: 'Ctrl/Cmd+S', description: 'Share content', category: 'Share' },
    { key: 'Ctrl/Cmd+Shift+C', description: 'Copy content', category: 'Share' },
    { key: 'Ctrl/Cmd+1', description: 'Export as PDF', category: 'Export' },
    { key: 'Ctrl/Cmd+2', description: 'Export as CSV', category: 'Export' },
    { key: 'Ctrl/Cmd+3', description: 'Export as TXT', category: 'Export' },
    { key: 'Ctrl/Cmd+4', description: 'Export as HTML', category: 'Export' },
    { key: 'Ctrl/Cmd+D', description: 'Close all dialogs', category: 'Global' },
    { key: 'Ctrl/Cmd+Shift+D', description: 'Reset all dialogs', category: 'Global' },
    { key: 'F11', description: 'Toggle fullscreen', category: 'Global' },
    { key: 'Tab', description: 'Navigate between elements', category: 'Accessibility' },
    { key: 'Enter/Space', description: 'Activate focused element', category: 'Accessibility' },
  ];
  
  const filteredShortcuts = showHelp 
    ? shortcuts 
    : [];
  
  return {
    shortcuts: filteredShortcuts,
    showHelp: () => {
      console.table(shortcuts);
    },
    getCategoryShortcuts: (category: string) => {
      return shortcuts.filter(shortcut => shortcut.category === category);
    },
  };
};