import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader as UIDialogHeader,
  DialogFooter as UIDialogFooter,
  DialogPortal,
  DialogOverlay,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BaseDialogProps,
  DialogSize,
  AnalysisType,
  ExportFormat
} from '../types/dialog-types';
import { useDialogState } from '../hooks/use-dialog-state';
import { useDialogKeyboard } from '../hooks/use-dialog-keyboard';
import { useDialogLoading } from '../hooks/use-dialog-loading';
import { DialogLoadingIndicator } from './dialog-loading-indicator';
import { AnalysisDialogErrorDisplaySectionComponent } from './analysis_dialog_error_display_section_component';
import { AnalysisDialogActionLoadingIndicatorsComponent } from './analysis_dialog_action_loading_indicators_component';
import { AnalysisDialogHeaderWithIconTitleAndActionsComponent } from './analysis_dialog_header_with_icon_title_and_actions_component';
import { AnalysisDialogContentOverflowWrapperComponent } from './analysis_dialog_content_overflow_wrapper_component';
import { useAnalysisDialogSizeClasses } from './use_analysis_dialog_size_classes_hook';
import { useAnalysisDialogAnimationClasses } from './use_analysis_dialog_animation_classes_hook';
import { useAnalysisDialogFullscreenToggle } from './use_analysis_dialog_fullscreen_toggle_hook';
import { useAnalysisDialogFocusTrap } from './use_analysis_dialog_focus_trap_hook';
import { useAnalysisDialogResizing } from './use_analysis_dialog_resizing_hook';
import { cn } from '../../../../lib/utils';

// Enhanced BaseDialogProps interface
interface EnhancedBaseDialogProps extends BaseDialogProps {
  loadingConfig?: {
    showGlobalLoading: boolean;
    showActionLoading: boolean;
    customMessages?: Record<string, string>;
  };
  // Action handlers for header buttons
  onExport?: (analysis: any, format?: ExportFormat) => void;
  onShare?: (analysis: any) => void;
  onPrint?: (analysis: any) => void;
  onCopy?: (text: string) => void;
  // Analysis data to pass to action handlers
  analysis?: any;
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
  size = 'large',
  showCloseButton = true,
  resizable = true,
  fullscreen = false,
  type = 'word',
  title,
  subtitle,
  icon,
  loadingConfig = {
    showGlobalLoading: true,
    showActionLoading: true,
    customMessages: {}
  },
  onExport,
  onShare,
  onPrint,
  onCopy,
  analysis
}: EnhancedBaseDialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useAnalysisDialogFullscreenToggle(fullscreen);
  
  // Focus trap hook
  useAnalysisDialogFocusTrap(open, dialogRef);
  const [dialogSize, setDialogSize] = useState<DialogSize>(size);
  
  // Resizing hook
  const { resizeHandle } = useAnalysisDialogResizing({
    resizable,
    dialogRef,
    isFullscreen
  });
  
  // Get dialog state and actions - use: provided type for proper state management
  const { state, actions } = useDialogState(type); // Use dynamic type instead of hardcoded 'word'
  
  // Get enhanced loading state
  const {
    isLoading,
    error,
    message,
    clearError,
    loadingStates
  } = useDialogLoading(type);
  
  // Keyboard shortcuts
  useDialogKeyboard({
    isOpen: open,
    onClose: () => onOpenChange(false),
    onFullscreen: toggleFullscreen,
    onPrint: () => window.print(),
    onShare: () => {
      // Share functionality would be implemented by specific dialogs
      console.log('Share action triggered');
    },
  });
  
  // Handle dialog size changes
  useEffect(() => {
    if (dialogSize !== size) {
      setDialogSize(size);
    }
  }, [size, dialogSize]);
  
  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen(); // Exit fullscreen
        } else {
          onOpenChange(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen, onOpenChange, toggleFullscreen]);
  
  // Dialog size classes using custom hook
  const sizeClasses = useAnalysisDialogSizeClasses(dialogSize);
  
  // Animation classes using custom hook
  const animationClasses = useAnalysisDialogAnimationClasses(
    state.dialogState.loading,
    state.dialogState.error
  );
  
  
  
  // ⚠️ LƯU Ý: Radix UI Dialog đã có sẵn click outside detection
  // Custom logic này có thể gây conflict với built-in behavior
  // Nếu muốn giữ custom logic, uncomment code bên dưới
  
  // Combine all classes (not used in current implementation, keeping for potential future use)
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
  
  // Enhanced error handling
  const handleRetry = useCallback(() => {
    clearError();
    // Trigger retry logic here
  }, [clearError]);
  
  const handleDismissError = useCallback(() => {
    clearError();
  }, [clearError]);
  
  // Convert dialogSize to Dialog component size prop
  const getDialogSize = (): "default" | "large" | "xlarge" | "xxlarge" | "xxxlarge" | "ultra" | "mega" | "ultra-wide" | "fullscreen" => {
    const size = isFullscreen ? 'fullscreen' : dialogSize;
    console.log('🐛 DEBUG: getDialogSize called', {
      dialogSize,
      isFullscreen,
      finalSize: size,
      timestamp: new Date().toISOString()
    });
    
    switch (size) {
      case 'default': return 'default';
      case 'large': return 'large';
      case 'xlarge': return 'xlarge';
      case 'xxlarge': return 'xxlarge';
      case 'xxxlarge': return 'xxxlarge';
      case 'ultra': return 'ultra';
      case 'mega': return 'mega';
      case 'ultra-wide': return 'ultra-wide';
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
  // Memoize the onOpenChange handler to prevent unnecessary re-renders
  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('🐛 DEBUG: Dialog onOpenChange triggered', {
      fromOpen: open,
      toOpen: newOpen,
      trigger: 'UI Dialog component',
      timestamp: new Date().toISOString()
    });
    onOpenChange(newOpen);
  }, [open, onOpenChange]);
  
  // Render loading state - moved after all hooks to maintain Rules of Hooks
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

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogPortal>
        <DialogOverlay
          className={animationClasses}
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
        >
          {/* Screen reader only title for accessibility */}
          <DialogTitle className="sr-only">{title || 'Analysis'}</DialogTitle>
          
          {/* Custom Dialog Header with Action Buttons */}
          <AnalysisDialogHeaderWithIconTitleAndActionsComponent
            title={title || "Analysis"}
            subtitle={subtitle}
            icon={icon}
            isFullscreen={isFullscreen}
            onFullscreenToggle={toggleFullscreen}
            onExport={onExport}
            onShare={onShare}
            onPrint={onPrint}
            onCopy={onCopy}
            analysis={analysis}
          />
          
          {/* Error State */}
          <AnalysisDialogErrorDisplaySectionComponent
            error={error}
            shouldShowGlobalLoading={shouldShowGlobalLoading}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
          
          {/* Action Loading Indicators */}
          <AnalysisDialogActionLoadingIndicatorsComponent
            loadingStatesActions={loadingStates.actions}
            customMessages={loadingConfig?.customMessages}
            showActionLoading={loadingConfig?.showActionLoading}
          />
          
          {/* Resize Handle */}
          {resizeHandle}
          
          {/* Dialog Content */}
          <AnalysisDialogContentOverflowWrapperComponent>
            {children}
          </AnalysisDialogContentOverflowWrapperComponent>
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
export { AnalysisDialogActionLoadingIndicatorsComponent } from './analysis_dialog_action_loading_indicators_component';

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