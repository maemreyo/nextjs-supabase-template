import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
  position?: 'top' | 'bottom';
}

export function OfflineIndicator({
  className = '',
  showRetryButton = true,
  onRetry,
  position = 'top'
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (isOnline) {
    return null;
  }

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0'
  };

  return (
    <div className={cn(
      'fixed z-50 p-3 bg-background border-b shadow-sm',
      positionClasses[position],
      className
    )}>
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
        <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800 dark:text-orange-200">
            Bạn đang offline. Một số tính năng có thể không hoạt động.
          </span>
          {showRetryButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-4 h-7"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')} />
              Thử lại
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  variant?: 'badge' | 'icon' | 'full';
}

export function ConnectionStatus({
  className = '',
  showText = true,
  variant = 'badge'
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center', className)}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium',
        isOnline 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
        className
      )}>
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {showText && (
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
      {showText && (
        <span className="text-sm text-muted-foreground">
          {isOnline ? 'Đã kết nối' : 'Mất kết nối'}
        </span>
      )}
    </div>
  );
}

// Hook for connection status
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    setIsOnline(navigator.onLine);

    // Try to get connection type if available
    const getConnectionType = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');
      }
    };

    getConnectionType();

    const handleOnline = () => {
      setIsOnline(true);
      getConnectionType();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlow: connectionType === 'slow-2g' || connectionType === '2g' || connectionType === '3g'
  };
}