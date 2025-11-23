import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  icon?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseNotificationsReturn {
  success: (message: string, options?: NotificationOptions) => void;
  error: (message: string, options?: NotificationOptions) => void;
  info: (message: string, options?: NotificationOptions) => void;
  warning: (message: string, options?: NotificationOptions) => void;
  loading: (message: string, options?: NotificationOptions) => void;
  dismiss: () => void;
  isLoading: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [isLoading, setIsLoading] = useState(false);

  const success = useCallback((message: string, options: NotificationOptions = {}) => {
    toast.success(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      description: options.description,
      icon: options.icon,
      action: options.action,
    });
  }, []);

  const error = useCallback((message: string, options: NotificationOptions = {}) => {
    toast.error(message, {
      duration: options.duration || 6000,
      position: options.position || 'top-right',
      description: options.description,
      icon: options.icon,
      action: options.action,
    });
  }, []);

  const info = useCallback((message: string, options: NotificationOptions = {}) => {
    toast.info(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      description: options.description,
      icon: options.icon,
      action: options.action,
    });
  }, []);

  const warning = useCallback((message: string, options: NotificationOptions = {}) => {
    toast.warning(message, {
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      description: options.description,
      icon: options.icon,
      action: options.action,
    });
  }, []);

  const loading = useCallback((message: string, options: NotificationOptions = {}) => {
    setIsLoading(true);
    toast.loading(message, {
      duration: options.duration || 0, // Loading toasts don't auto-dismiss
      position: options.position || 'top-right',
      description: options.description,
      icon: options.icon,
    });
  }, []);

  const dismiss = useCallback(() => {
    toast.dismiss();
    setIsLoading(false);
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    isLoading,
  };
}

export type { NotificationOptions, UseNotificationsReturn };