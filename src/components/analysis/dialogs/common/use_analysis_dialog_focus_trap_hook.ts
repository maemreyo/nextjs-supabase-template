import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook để quản lý focus trap trong dialog
 * @param open - Trạng thái mở/đóng của dialog
 * @param dialogRef - Reference đến dialog element
 */
export const useAnalysisDialogFocusTrap = (
  open: boolean,
  dialogRef: RefObject<HTMLDivElement | null>
): void => {
  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      
      const dialog = dialogRef.current;
      if (!dialog) return;
      
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (document.activeElement === lastElement && event.shiftKey) {
          firstElement.focus();
        } else if (document.activeElement === firstElement && !event.shiftKey) {
          lastElement.focus();
        } else {
          // If focus is not on first/last, move to next/prev based on shiftKey
          const currentIndex = Array.from(focusableElements).indexOf(
            document.activeElement as HTMLElement
          );
          
          if (currentIndex !== -1) {
            const nextIndex = event.shiftKey 
              ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
              : (currentIndex + 1) % focusableElements.length;
            (focusableElements[nextIndex] as HTMLElement).focus();
          } else {
            // If focus is outside the dialog, focus first element
            firstElement.focus();
          }
        }
      }
    }
  }, [dialogRef]);

  useEffect(() => {
    if (!open) return;
    
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    // Focus first focusable element
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
    
    // Add event listener for focus trap
    dialog.addEventListener('keydown', handleFocusTrap);
    
    return () => {
      dialog.removeEventListener('keydown', handleFocusTrap);
    };
  }, [open, dialogRef, handleFocusTrap]);
};