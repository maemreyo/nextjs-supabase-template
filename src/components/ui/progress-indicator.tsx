import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  animated?: boolean;
}

export function ProgressIndicator({
  value,
  max = 100,
  className = '',
  label,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  animated = true
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: '',
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-yellow-500',
    destructive: '[&>div]:bg-red-500'
  };

  const getColorClass = () => {
    if (variant !== 'default') return variantClasses[variant];
    
    // Auto-determine color based on value
    if (value >= 80) return variantClasses.success;
    if (value >= 50) return variantClasses.warning;
    return variantClasses.destructive;
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-muted-foreground">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <Progress
        value={value}
        max={max}
        className={cn(
          sizeClasses[size],
          getColorClass(),
          animated && '[&>div]:transition-all duration-300 ease-in-out'
        )}
      />
    </div>
  );
}

interface StepProgressProps {
  steps: Array<{
    label: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>;
  className?: string;
}

export function StepProgress({ steps, className = '' }: StepProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                  step.status === 'completed' && 'bg-green-500 text-white',
                  step.status === 'active' && 'bg-primary text-primary-foreground',
                  step.status === 'error' && 'bg-red-500 text-white',
                  step.status === 'pending' && 'bg-muted text-muted-foreground'
                )}
              >
                {step.status === 'completed' ? '✓' : index + 1}
              </div>
              <span className="text-xs text-muted-foreground mt-1 text-center max-w-20">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  steps[index]?.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}