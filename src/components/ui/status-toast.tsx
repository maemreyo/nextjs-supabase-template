import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'error' | 'warning' | 'info';

interface StatusToastProps {
  type: StatusType;
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function StatusToast({
  type,
  title,
  description,
  duration = 5000,
  onClose,
  action,
  className = ''
}: StatusToastProps) {
  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-800 dark:text-green-200',
      descriptionColor: 'text-green-700 dark:text-green-300'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-200',
      descriptionColor: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      descriptionColor: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      descriptionColor: 'text-blue-700 dark:text-blue-300'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all',
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-medium', config.titleColor)}>
            {title}
          </h4>
          {description && (
            <p className={cn('text-sm mt-1', config.descriptionColor)}>
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'text-sm font-medium mt-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded',
                config.titleColor
              )}
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 rounded-sm p-1 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.iconColor
            )}
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatusToastContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StatusToastContainer({ 
  children, 
  className = '' 
}: StatusToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full',
        className
      )}
      aria-live="polite"
      aria-label="Thông báo"
    >
      {children}
    </div>
  );
}

// Hook for managing toasts
interface Toast {
  id: string;
  type: StatusType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useStatusToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((
    type: StatusType,
    title: string,
    description?: string,
    action?: Toast['action']
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, description, action };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, 5000);
    
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = React.useCallback((title: string, description?: string) => {
    return addToast('success', title, description);
  }, [addToast]);

  const error = React.useCallback((title: string, description?: string, action?: Toast['action']) => {
    return addToast('error', title, description, action);
  }, [addToast]);

  const warning = React.useCallback((title: string, description?: string) => {
    return addToast('warning', title, description);
  }, [addToast]);

  const info = React.useCallback((title: string, description?: string) => {
    return addToast('info', title, description);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}