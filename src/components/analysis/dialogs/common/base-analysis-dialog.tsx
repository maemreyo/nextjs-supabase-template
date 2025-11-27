import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Maximize2, Minimize2, Download, Share2, Printer, Copy, Volume2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader as UIDialogHeader,
  DialogFooter as UIDialogFooter,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { DialogLoadingIndicator } from './dialog-loading-indicator';
import { DialogErrorHandler } from './dialog-error-handler';
import { cn } from '../../../../lib/utils';

// Enhanced BaseDialogProps interface
interface EnhancedBaseDialogProps extends BaseDialogProps {
  loadingConfig?: {
    showGlobalLoading: boolean;
    showActionLoading: boolean;
    customMessages?: Record<string, string>;
  };
}

/**
 * Base Analysis Dialog Component
 * Provides common functionality for all analysis dialog types
 */
export const BaseAnalysisDialog = ({
  open,
  onOpenChange,
  children,
  className,
  size = 'xxlarge',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
  type = 'word',
  loadingConfig = {
    showGlobalLoading: true,
    showActionLoading: true,
    customMessages: {}
  }
}: EnhancedBaseDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [isResizing, setIsResizing] = useState(false);
  const [dialogSize, setDialogSize] = useState<DialogSize>(size);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Get dialog state and actions - use: provided type for proper state management
  const { state, actions } = useDialogState(type); // Use dynamic type instead of hardcoded 'word'
  
  // Get enhanced loading state
  const { 
    isLoading, 
    error, 
    message,
    setGlobalLoading,
    setLocalLoading,
    setActionLoading,
    clearError,
    hasAnyLoading,
    primaryLoadingSource,
    loadingStates
  } = useDialogLoading(type);
  
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
        return 'max-w-8xl max-h-[95vh]';
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
    };
    
    dialog.addEventListener('keydown', handleFocusTrap);
    
    return () => {
      dialog.removeEventListener('keydown', handleFocusTrap);
    };
  }, [open]);
  
  // ⚠️ LƯU Ý: Radix UI Dialog đã có sẵn click outside detection
  // Custom logic này có thể gây conflict với built-in behavior
  // Nếu muốn giữ custom logic, uncomment code bên dưới
  
  /*
  // Handle click outside to close (CUSTOM - có thể conflict với Radix UI)
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const dialog = dialogRef.current;
      const target = event.target as Node;
      
      console.log('🐛 DEBUG: Click detected', {
        target: target,
        targetElement: target?.toString?.(),
        dialogExists: !!dialog,
        isInsideDialog: dialog?.contains(target),
        eventType: event.type,
        timestamp: new Date().toISOString()
      });
      
      // ✅ SỬA: Chỉ đóng dialog khi click BÊN NGOÀI!
      if (!dialog || !dialog.contains(target)) {
        console.log('🐛 DEBUG: Dialog closing due to OUTSIDE click', {
          reason: !dialog ? 'Dialog not found' : 'Click outside dialog',
          shouldClose: true,
          target: target?.toString?.()
        });
        onOpenChange(false);
      } else {
        console.log('🐛 DEBUG: Click inside dialog - dialog should stay open', {
          target: target?.toString?.()
        });
      }
    };
    
    console.log('🐛 DEBUG: Setting up click outside listener for dialog');
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      console.log('🐛 DEBUG: Cleaning up click outside listener');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]);
  */
  
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
  
  // Enhanced loading state calculation
  const shouldShowGlobalLoading = loadingConfig?.showGlobalLoading && isLoading;
  const shouldShowActionLoading = loadingConfig?.showActionLoading &&
    Object.values(loadingStates.actions || {}).some(action => action);
  
  // Enhanced error handling
  const handleRetry = useCallback(() => {
    clearError();
    // Trigger retry logic here
  }, [clearError]);
  
  const handleDismissError = useCallback(() => {
    clearError();
  }, [clearError]);
  
  // Render loading state
  if (shouldShowGlobalLoading) {
    return (
      <div className={dialogClasses}>
        <DialogLoadingIndicator
          type="global"
          message={loadingConfig?.customMessages?.global || message || undefined}
          overlay={true}
          size="lg"
        />
      </div>
    );
  }
  
  // Convert dialogSize to Dialog component size prop
  const getDialogSize = (): "default" | "large" | "xlarge" | "xxlarge" | "fullscreen" => {
    switch (dialogSize) {
      case 'default': return 'default';
      case 'large': return 'large';
      case 'xlarge': return 'xlarge';
      case 'xxlarge': return 'xxlarge';
      case 'fullscreen': return 'fullscreen';
      default: return 'large';
    }
  };

  // Debug: Log dialog render
  console.log('🐛 DEBUG: BaseAnalysisDialog render', {
    open,
    type,
    hasChildren: !!children,
    timestamp: new Date().toISOString()
  });

  // Render dialog content using Dialog component from UI library
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log('🐛 DEBUG: Dialog onOpenChange triggered', {
          fromOpen: open,
          toOpen: newOpen,
          trigger: 'UI Dialog component',
          timestamp: new Date().toISOString()
        });
        onOpenChange(newOpen);
      }}
    >
      <DialogPortal>
        <DialogOverlay
          className={animationClasses}
          onMouseDown={(e) => {
            console.log('🐛 DEBUG: DialogOverlay clicked', {
              target: e.target,
              timestamp: new Date().toISOString()
            });
          }}
        />
        <DialogContent
          ref={dialogRef}
          size={getDialogSize()}
          showCloseButton={showCloseButton}
          className={cn(
            animationClasses,
            {
              'pointer-events-auto': true,
            }
          )}
          style={{
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            console.log('🐛 DEBUG: DialogContent clicked', {
              target: e.target,
              isInsideContent: true,
              timestamp: new Date().toISOString()
            });
          }}
        >
          {/* Custom Dialog Header with Action Buttons */}
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
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
              
              {/* Export Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Export functionality would be implemented by specific dialogs
                  console.log('Export action triggered');
                }}
                aria-label="Export"
              >
                <Download className="h-5 w-5" />
              </Button>
              
              {/* Share Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Share functionality would be implemented by specific dialogs
                  console.log('Share action triggered');
                }}
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              {/* Print Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.print()}
                aria-label="Print"
              >
                <Printer className="h-5 w-5" />
              </Button>
              
              {/* Copy Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Copy functionality would be implemented by specific dialogs
                  console.log('Copy action triggered');
                }}
                aria-label="Copy"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Error State */}
          {error && !shouldShowGlobalLoading && (
            <div className="p-4 border-b">
              <DialogErrorHandler
                error={error}
                onRetry={handleRetry}
                onDismiss={handleDismissError}
              />
            </div>
          )}
          
          {/* Action Loading Indicators */}
          {shouldShowActionLoading && (
            <div className="flex gap-2 p-2 border-b">
              {Object.entries(loadingStates.actions || {}).map(([action, loading]) => (
                loading && (
                  <DialogLoadingIndicator
                    key={action}
                    type="action"
                    message={loadingConfig?.customMessages?.[action]}
                    size="sm"
                  />
                )
              ))}
            </div>
          )}
          
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
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

/**
 * Dialog Header Component - Re-export from UI library with enhanced functionality
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
    <UIDialogHeader className={cn('flex items-center justify-between', className)}>
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
    </UIDialogHeader>
  );
};

/**
 * Dialog Footer Component - Re-export from UI library with enhanced functionality
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
    <UIDialogFooter className={cn(
      position === 'left' && 'justify-start',
      position === 'center' && 'justify-center',
      position === 'right' && 'justify-end',
      className
    )}>
      {children}
    </UIDialogFooter>
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
        <Button
          key={index}
          variant={action.variant || 'default'}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
        >
          {action.loading && (
            <LoadingSpinner size="sm" className="mr-2" />
          )}
          
          {action.icon && !action.loading && (
            <span className="mr-2">{action.icon}</span>
          )}
          
          {!action.loading && action.label}
          
          {action.loading && 'Loading...'}
        </Button>
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
            <Button
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children || this.props.fallback;
  }
}

/**
 * Dialog Loading Skeleton Component - Using Dialog from UI library
 */
export const DialogLoadingSkeleton: React.FC = () => {
  return (
    <Dialog open={true}>
      <DialogPortal>
        <DialogOverlay className="bg-background/95 backdrop-blur-sm" />
        <DialogContent size="large" showCloseButton={false}>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-muted rounded-md w-3/4"></div>
              <div className="h-4 bg-muted rounded-md w-1/2"></div>
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-4 bg-muted rounded-md w-2/3"></div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

/**
 * Dialog Container Component for wrapping dialogs - Using Dialog from UI library
 */
interface DialogContainerProps {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DialogContainer: React.FC<DialogContainerProps> = ({
  children,
  className,
  open = true,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className={cn('bg-background/95 backdrop-blur-sm', className)} />
        <DialogContent className="rounded-lg">
          {children}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

// Export new components
export { DialogLoadingIndicator } from './dialog-loading-indicator';
export { DialogErrorHandler } from './dialog-error-handler';

// Re-export Dialog components from UI library for convenience
export {
  Dialog,
  DialogContent,
  DialogHeader as UIDialogHeader,
  DialogFooter as UIDialogFooter,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';