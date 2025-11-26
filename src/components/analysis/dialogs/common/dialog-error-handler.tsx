import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface DialogErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

export const DialogErrorHandler: React.FC<DialogErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  className
}) => {
  if (!error) return null;
  
  return (
    <Alert className={cn('border-destructive/50 bg-destructive/5', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2">
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};