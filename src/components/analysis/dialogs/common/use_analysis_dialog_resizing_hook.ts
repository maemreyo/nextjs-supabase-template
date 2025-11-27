import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '../../../../lib/utils';

interface UseAnalysisDialogResizingProps {
  resizable: boolean;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
}

export const useAnalysisDialogResizing = (props: UseAnalysisDialogResizingProps) => {
  const { resizable, dialogRef, isFullscreen } = props;
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize functionality
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizable) return;
    
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    const rect = dialog.getBoundingClientRect();
    const newWidth = event.clientX - rect.left;
    
    // Update width in state (would be handled by parent component)
    console.log('Dialog resized to:', newWidth);
  }, [isResizing, resizable, dialogRef]);

  // Handle mouse events for resizing
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !resizable) return;
    
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('resize-handle')) {
        handleResizeStart();
      }
    };
    
    const handleMouseUp = () => {
      handleResizeEnd();
    };
    
    dialog.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      dialog.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dialogRef, resizable, isResizing, handleResizeStart, handleResizeEnd, handleMouseMove]);

  // Resize handle component
  const resizeHandle = React.createElement(
    'div',
    {
      className: cn(
        'absolute right-2 top-2 w-4 h-4 bg-accent cursor-ew-resize hover:bg-accent/80 rounded-sm flex items-center justify-center',
        {
          'hidden': !resizable || isFullscreen
        }
      ),
      onMouseDown: handleResizeStart
    },
    React.createElement(
      'div',
      {
        className: 'w-1 h-4 bg-border'
      }
    )
  );

  return {
    isResizing,
    resizeHandle
  };
};