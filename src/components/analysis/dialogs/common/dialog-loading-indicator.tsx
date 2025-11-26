import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DialogLoadingIndicatorProps {
  type: 'global' | 'local' | 'action';
  message?: string;
  overlay?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DialogLoadingIndicator: React.FC<DialogLoadingIndicatorProps> = ({
  type,
  message,
  overlay = false,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  const typeColors = {
    global: 'text-blue-600 border-blue-600',
    local: 'text-green-600 border-green-600',
    action: 'text-orange-600 border-orange-600'
  };
  
  const defaultMessages = {
    global: 'Đang tải...',
    local: 'Đang tải dữ liệu...',
    action: 'Đang xử lý...'
  };
  
  const displayMessage = message || defaultMessages[type];
  
  const content = (
    <div className={cn(
      'flex items-center gap-2',
      typeColors[type],
      className
    )}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      <span className="text-sm font-medium">{displayMessage}</span>
    </div>
  );
  
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
        <div className="bg-background border rounded-lg shadow-lg p-4">
          {content}
        </div>
      </div>
    );
  }
  
  return content;
};