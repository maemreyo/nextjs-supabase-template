"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  scrollHideDelay?: number
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, scrollHideDelay = 100, ...props }, ref) => {
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, scrollHideDelay);
      };

      const currentRef = scrollAreaRef.current;
      if (currentRef) {
        currentRef.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
          currentRef.removeEventListener('scroll', handleScroll);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
      }
    }, [scrollHideDelay]);

    React.useImperativeHandle(ref, () => scrollAreaRef.current!);

    return (
      <div
        ref={scrollAreaRef}
        className={cn(
          "relative overflow-auto",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border scrollbar-thumb-hover:border-foreground/20",
          "scrollbar-width-thin",
          isScrolling && "scrollbar-thumb-visible",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }