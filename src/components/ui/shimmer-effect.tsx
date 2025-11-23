import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  rounded?: string | boolean;
}

export function Shimmer({
  className = '',
  variant = 'default',
  width,
  height,
  rounded = false
}: ShimmerProps) {
  const variantClasses = {
    default: 'bg-muted',
    card: 'bg-card',
    text: 'bg-muted rounded',
    circle: 'bg-muted rounded-full',
    rect: 'bg-muted'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (typeof rounded === 'string') {
    style.borderRadius = rounded;
  } else if (rounded) {
    style.borderRadius = '0.375rem';
  }

  return (
    <div
      className={cn(
        'animate-pulse',
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

interface ShimmerCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
  showButton?: boolean;
  avatarSize?: number;
}

export function ShimmerCard({
  className = '',
  showAvatar = true,
  lines = 3,
  showButton = true,
  avatarSize = 40
}: ShimmerCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <Shimmer variant="circle" width={avatarSize} height={avatarSize} />
          <div className="flex-1 space-y-2">
            <Shimmer variant="text" width="60%" height={16} />
            <Shimmer variant="text" width="40%" height={14} />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            variant="text"
            width={i === lines - 1 ? '80%' : '100%'}
            height={16}
          />
        ))}
      </div>
      
      {showButton && (
        <div className="flex justify-end pt-2">
          <Shimmer variant="rect" width={80} height={32} rounded={true} />
        </div>
      )}
    </div>
  );
}

interface ShimmerListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
  children?: (index: number) => React.ReactNode;
}

export function ShimmerList({
  count = 3,
  className = '',
  itemClassName = '',
  children
}: ShimmerListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={itemClassName}>
          {children ? children(index) : <ShimmerCard />}
        </div>
      ))}
    </div>
  );
}

interface ShimmerTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function ShimmerTable({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true
}: ShimmerTableProps) {
  return (
    <div className={cn('w-full', className)}>
      {showHeader && (
        <div className="flex space-x-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Shimmer
              key={`header-${i}`}
              variant="text"
              width={i === 0 ? '30%' : '20%'}
              height={16}
            />
          ))}
        </div>
      )}
      
      <div className="space-y-2 py-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Shimmer
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={colIndex === 0 ? '25%' : '20%'}
                height={14}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ShimmerGridProps {
  cols?: number;
  rows?: number;
  className?: string;
  itemClassName?: string;
  children?: (index: number) => React.ReactNode;
}

export function ShimmerGrid({
  cols = 3,
  rows = 2,
  className = '',
  itemClassName = '',
  children
}: ShimmerGridProps) {
  const totalItems = cols * rows;
  
  return (
    <div 
      className={cn(
        'grid gap-4',
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols}`,
        className
      )}
    >
      {Array.from({ length: totalItems }).map((_, index) => (
        <div key={index} className={itemClassName}>
          {children ? children(index) : <ShimmerCard />}
        </div>
      ))}
    </div>
  );
}