import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  disabled?: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export function RetryButton({
  onRetry,
  className = '',
  variant = 'outline',
  size = 'default',
  children,
  disabled = false,
  maxRetries = 3,
  retryDelay = 1000,
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (isRetrying || (maxRetries > 0 && retryCount >= maxRetries)) {
      return;
    }

    setIsRetrying(true);
    setLastError(null);

    try {
      await onRetry();
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setLastError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Auto-retry if configured and under max retries
      if (retryDelay > 0 && retryCount < maxRetries - 1) {
        setTimeout(() => {
          handleRetry();
        }, retryDelay);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = maxRetries === 0 || retryCount < maxRetries;
  const showRetryCount = maxRetries > 0 && retryCount > 0;

  return (
    <div className="space-y-2">
      {lastError && (
        <Alert variant="destructive" className="text-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lastError}
            {showRetryCount && (
              <span className="block mt-1">
                Đã thử lại {retryCount}/{maxRetries} lần
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        onClick={handleRetry}
        disabled={disabled || isRetrying || !canRetry}
        variant={variant}
        size={size}
        className={cn('relative', className)}
      >
        <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
        {children || (isRetrying ? 'Đang thử lại...' : 'Thử lại')}
        
        {showRetryCount && (
          <span className="ml-2 text-xs opacity-70">
            ({retryCount}/{maxRetries})
          </span>
        )}
      </Button>
      
      {!canRetry && (
        <p className="text-xs text-muted-foreground text-center">
          Đã đạt đến số lần thử lại tối đa ({maxRetries})
        </p>
      )}
    </div>
  );
}

interface RetryButtonInlineProps {
  onRetry: () => Promise<void> | void;
  error?: string | null;
  isRetrying?: boolean;
  className?: string;
}

export function RetryButtonInline({
  onRetry,
  error,
  isRetrying = false,
  className = '',
}: RetryButtonInlineProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
      >
        <RefreshCw className={cn('h-3 w-3 mr-1', isRetrying && 'animate-spin')} />
        Thử lại
      </Button>
    </div>
  );
}