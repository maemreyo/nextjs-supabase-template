import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  maxItems?: number;
  showHomeIcon?: boolean;
}

export function Breadcrumb({
  items,
  className,
  maxItems = 5,
  showHomeIcon = true
}: BreadcrumbProps) {
  // If there are too many items, truncate the middle ones
  const getVisibleItems = () => {
    if (items.length <= maxItems) {
      return items;
    }

    // Always show first item, last 2 items, and truncate the middle
    const firstItem = items[0];
    const lastItems = items.slice(-2);
    const truncatedCount = items.length - 3; // first + last 2 items
    
    return [
      firstItem,
      {
        label: `...${truncatedCount} mục...`,
        isActive: false,
        icon: null
      },
      ...lastItems
    ];
  };

  const visibleItems = getVisibleItems();

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {visibleItems.map((item, index) => {
        if (!item) return null;
        
        const isLast = index === visibleItems.length - 1;
        const isTruncated = item.label.startsWith('...');
        
        return (
          <React.Fragment key={index}>
            {index > 0 && !isTruncated && (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            
            <div className="flex items-center">
              {showHomeIcon && index === 0 && (
                <Home className="h-4 w-4 mr-1 flex-shrink-0" />
              )}
              
              {item.href && !item.isActive && !isTruncated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-sm font-normal hover:text-foreground"
                  asChild
                >
                  <a href={item.href} className="flex items-center">
                    {item.icon}
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                      {item.label}
                    </span>
                  </a>
                </Button>
              ) : (
                <span
                  className={cn(
                    "flex items-center",
                    item.isActive ? "text-foreground font-medium" : "text-muted-foreground",
                    isTruncated && "text-xs italic"
                  )}
                >
                  {item.icon}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Responsive breadcrumb that collapses on mobile
export function ResponsiveBreadcrumb(props: BreadcrumbProps) {
  return (
    <div className="hidden sm:block">
      <Breadcrumb {...props} />
    </div>
  );
}

// Mobile breadcrumb that shows simplified version
export function MobileBreadcrumb(props: BreadcrumbProps) {
  const { items } = props;
  
  // On mobile, only show the last 2 items
  const mobileItems = items.slice(-2);
  
  return (
    <div className="sm:hidden">
      <Breadcrumb 
        {...props} 
        items={mobileItems}
        maxItems={3}
        showHomeIcon={false}
      />
    </div>
  );
}