import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Maximize2, Minimize2, Download, Share2, Printer, Copy, Volume2 } from 'lucide-react';
import { 
  BaseDialogProps, 
  DialogSize, 
  AnalysisType, 
  AnalysisItem,
  DialogError,
  DialogErrorType 
} from '../types/dialog-types';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogKeyboard } from '../hooks/use-dialog-keyboard';
import { cn } from '../../../../lib/utils';

/**
 * Base Analysis Dialog Component
 * Provides common functionality for all analysis dialog types
 */
export const BaseAnalysisDialog = ({
  open,
  onOpenChange,
  children,
  className,
  size = 'large',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
  type = 'word',
}: BaseDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [isResizing, setIsResizing] = useState(false);
  const [dialogSize, setDialogSize] = useState<DialogSize>(size);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Get dialog state and actions - use the provided type for proper state management
  const { state, actions } = useDialogState(type); // Use dynamic type instead of hardcoded 'word'
  
  // Keyboard shortcuts
  const shortcuts = useDialogKeyboard({
    isOpen: open,
    onClose: () => onOpenChange(false),
    onFullscreen: () => setIsFullscreen(prev => !prev),
    onPrint: () => window.print(),
    onShare: () => {
      // Share functionality would be implemented by specific dialogs
      console.log('Share action triggered');
    },
  });
  
  // Handle fullscreen state changes
  useEffect(() => {
    if (isFullscreen !== fullscreen) {
      setIsFullscreen(fullscreen);
    }
  }, [isFullscreen, fullscreen]);
  
  // Handle dialog size changes
  useEffect(() => {
    if (dialogSize !== size) {
      setDialogSize(size);
    }
  }, [dialogSize, size]);
  
  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onOpenChange(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen, onOpenChange]);
  
  // Dialog size classes
  const sizeClasses = useMemo(() => {
    switch (dialogSize) {
      case 'default':
        return 'max-w-md max-h-[80vh]';
      case 'large':
        return 'max-w-2xl max-h-[85vh]';
      case 'xlarge':
        return 'max-w-4xl max-h-[90vh]';
      case 'xxlarge':
        return 'max-w-6xl max-h-[95vh]';
      case 'fullscreen':
        return 'w-full h-full';
      default:
        return 'max-w-2xl max-h-[85vh]';
    }
  }, [dialogSize]);
  
  // Animation classes
  const animationClasses = useMemo(() => {
    if (state.dialogState.loading) {
      return 'animate-pulse';
    }
    if (state.dialogState.error) {
      return 'animate-shake';
    }
    return '';
  }, [state.dialogState.loading, state.dialogState.error]);
  
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
  }, [isResizing, resizable]);
  
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
  
  // Handle focus management
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
    
    // Trap focus within dialog
    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        
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
          }
        }
      }
    }
    
    dialog.addEventListener('keydown', handleFocusTrap);
    
    return () => {
      dialog.removeEventListener('keydown', handleFocusTrap);
    };
  }, [open]);
  
  // Handle click outside to close
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);
  
  // Combine all classes
  const dialogClasses = useMemo(() => {
    return cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'p-4 bg-background/95 backdrop-blur-sm',
      'transition-all duration-300 ease-in-out',
      animationClasses,
      sizeClasses,
      {
        'w-full': isFullscreen,
        'max-w-screen': !isFullscreen,
      },
      className
    );
  }, [className, animationClasses, sizeClasses, isFullscreen]);
  
  // Render loading state
  // if (state.dialogState.loading) {
  //   return (
  //     <div className={dialogClasses}>
  //       <div className="flex items-center justify-center min-h-[200px]">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
  //         <p className="mt-4 text-muted-foreground">Loading analysis...</p>
  //       </div>
  //     </div>
  //   );
  // }
  
  // Render error state
  if (state.dialogState.error) {
    return (
      <div className={dialogClasses}>
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="mb-4 text-destructive">
              <X className="h-6 w-6 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{state.dialogState.error}</p>
            <button
              onClick={() => actions.setError(null)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render dialog content
  return (
    <div className={dialogClasses}>
      <div
        ref={dialogRef}
        className={cn(
          'relative bg-background rounded-lg shadow-lg border',
          {
            'w-full': isFullscreen,
            'max-w-screen': !isFullscreen,
          }
        )}
        style={{
          width: isFullscreen ? '100vw' : undefined,
          height: isFullscreen ? '100vh' : undefined,
          left: !isFullscreen && position.x !== 0 ? position.x : undefined,
          top: !isFullscreen && position.y !== 0 ? position.y : undefined,
        }}
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
              {/* Icon would be based on analysis type */}
              <div className="text-primary font-bold">A</div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Analysis</h2>
              <p className="text-sm text-muted-foreground">Loading content...</p>
            </div>
          </div>
          
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            
            {/* Export Button */}
            <button
              onClick={() => {
                // Export functionality would be implemented by specific dialogs
                console.log('Export action triggered');
              }}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Export"
            >
              <Download className="h-5 w-5" />
            </button>
            
            {/* Share Button */}
            <button
              onClick={() => {
                // Share functionality would be implemented by specific dialogs
                console.log('Share action triggered');
              }}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
            
            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Print"
            >
              <Printer className="h-5 w-5" />
            </button>
            
            {/* Copy Button */}
            <button
              onClick={() => {
                // Copy functionality would be implemented by specific dialogs
                console.log('Copy action triggered');
              }}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Copy"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Resize Handle */}
        {resizable && !isFullscreen && (
          <div
            className="absolute right-2 top-2 w-4 h-4 bg-accent cursor-ew-resize hover:bg-accent/80 rounded-sm flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <div className="w-1 h-4 bg-border"></div>
          </div>
        )}
        
        {/* Dialog Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Dialog Header Component
 */
interface DialogHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

/**
 * Dialog Footer Component
 */
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'center' | 'right';
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className,
  position = 'right',
}) => {
  return (
    <div className={cn('flex items-center justify-between p-4 border-t', className)}>
      <div className={cn(
        'flex-1',
        position === 'left' && 'justify-start',
        position === 'center' && 'justify-center',
        position === 'right' && 'justify-end'
      )}>
        {children}
      </div>
    </div>
  );
};

/**
 * Dialog Actions Component
 */
interface DialogActionsProps {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'outline' | 'destructive' | 'ghost';
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  }>;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export const DialogActions: React.FC<DialogActionsProps> = ({
  actions,
  layout = 'horizontal',
  className,
}) => {
  return (
    <div className={cn(
      'flex gap-2',
      layout === 'vertical' ? 'flex-col' : 'flex-row',
      className
    )}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          className={cn(
            'px-3 py-2 rounded-md text-sm font-medium transition-colors',
            action.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            action.variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            action.variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            (action.disabled || action.loading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {action.loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
          )}
          
          {action.icon && !action.loading && (
            <span className="mr-2">{action.icon}</span>
          )}
          
          {!action.loading && action.label}
          
          {action.loading && 'Loading...'}
        </button>
      ))}
    </div>
  );
};

/**
 * Error Boundary Component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class DialogErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dialog Error Boundary caught an error:', error, errorInfo);
    
    this.setState(DialogErrorBoundary.getDerivedStateFromError(error));
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center">
            <div className="mb-4 text-destructive">
              <X className="h-6 w-6 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children || this.props.fallback;
  }
}

/**
 * Dialog Loading Skeleton Component
 */
export const DialogLoadingSkeleton: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-lg border max-w-2xl w-full max-h-[85vh]">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-muted rounded-md w-3/4"></div>
            <div className="h-4 bg-muted rounded-md w-1/2"></div>
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dialog Container Component for wrapping dialogs
 */
interface DialogContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContainer: React.FC<DialogContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', className)}>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg">
        {children}
      </div>
    </div>
  );
};