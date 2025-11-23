import React from 'react';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'default' | 'blur' | 'dark';
}

export function LoadingOverlay({
  isLoading,
  children,
  className = '',
  spinnerSize = 'md',
  text,
  variant = 'default'
}: LoadingOverlayProps) {
  const variantClasses = {
    default: 'bg-white/80 dark:bg-gray-900/80',
    blur: 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm',
    dark: 'bg-gray-900/90'
  };

  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center z-50',
          variantClasses[variant]
        )}>
          <LoadingSpinner size={spinnerSize} text={text} />
        </div>
      )}
    </div>
  );
}

interface LoadingCardProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  text?: string;
  minHeight?: string;
}

export function LoadingCard({
  isLoading,
  children,
  className = '',
  spinnerSize = 'md',
  text,
  minHeight = '200px'
}: LoadingCardProps) {
  return (
    <div 
      className={cn('relative rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      style={{ minHeight }}
    >
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg">
          <LoadingSpinner size={spinnerSize} text={text} />
        </div>
      )}
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  spinnerSize?: 'sm' | 'md';
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  children,
  disabled = false,
  className = '',
  spinnerSize = 'sm',
  loadingText
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        'px-4 py-2',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        className
      )}
      disabled={disabled || isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <LoadingSpinner 
            size={spinnerSize} 
            text={loadingText || 'Đang xử lý...'}
            variant="primary"
          />
        </>
      ) : (
        children
      )}
    </button>
  );
}