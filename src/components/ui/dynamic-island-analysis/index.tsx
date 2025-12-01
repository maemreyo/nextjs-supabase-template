import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalysisDynamicIsland } from './useAnalysisDynamicIsland';
import { CompactView } from './CompactView';
import { ExpandedView } from './ExpandedView';
import type { DynamicIslandAnalysisProps, AnalysisItem } from './types';
import type { UseAnalysisDynamicIslandReturn } from './useAnalysisDynamicIsland.types';
import { analysisLogger } from '@/services/logger';

// Check for reduced motion preference
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const variantStyles: Record<string, string> = {
  default: 'bg-black/90 border-white/10',
  success: 'bg-green-900/90 border-green-700/50',
  error: 'bg-red-900/90 border-red-700/50',
  info: 'bg-blue-900/90 border-blue-700/50',
  loading: 'bg-blue-900/90 border-blue-700/50',
};

const DynamicIslandAnalysis: React.FC<DynamicIslandAnalysisProps> = ({
  position = 'top',
  className = '',
  ...props
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC OR RETURNS
  
  const hookResult = useAnalysisDynamicIsland(props);
  const {
    current,
    isExpanded,
    dismissCurrent,
    toggleGuide,
    setIsExpanded
  } = hookResult as unknown as UseAnalysisDynamicIslandReturn;
  
  // New states for drag/collapse
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  
  // State for idle/collapsed popover
  const [showPopover, setShowPopover] = useState(false);
  
  // Refs
  const popoverRef = useRef<HTMLDivElement>(null);
  const statusBarRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  
  // Throttle function for performance
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);
  
  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (current && current.state !== 'loading') {
      setIsDragging(true);
      setStartY(e.clientY);
    }
  }, [current]);
  
  const handleMouseMove = useCallback(throttle((e: MouseEvent) => {
    if (isDragging) {
      setCurrentY(e.clientY);
    }
  }, 16), [isDragging, throttle]);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      const diff = currentY - startY;
      if (diff > 50) {
        setIsCollapsed(true);
        setIsExpanded(false);
      }
      setIsDragging(false);
      setCurrentY(0);
      setStartY(0);
    }
  }, [isDragging, currentY, startY]);
  
  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (current && current.state !== 'loading' && e.touches[0]) {
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
    }
  }, [current]);
  
  const handleTouchMove = useCallback(throttle((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      setCurrentY(e.touches[0].clientY);
    }
  }, 16), [isDragging, throttle]);
  
  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      const diff = currentY - startY;
      if (diff > 50) {
        setIsCollapsed(true);
        setIsExpanded(false);
      }
      setIsDragging(false);
      setCurrentY(0);
      setStartY(0);
    }
  }, [isDragging, currentY, startY]);
  
  // Keyboard handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isExpanded) {
        setIsExpanded(false);
      } else if (showPopover) {
        setShowPopover(false);
      } else if (current) {
        dismissCurrent();
      }
    }
    
    if (e.key === 'Enter' && current && !isExpanded && !isCollapsed) {
      setIsExpanded(true);
    }
  }, [isExpanded, showPopover, current, dismissCurrent, setIsExpanded, isCollapsed]);
  
  // Focus trap for expanded state
  const trapFocus = useCallback(() => {
    if (!islandRef.current || !isExpanded) return;
    
    const focusableElements = islandRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    focusableElementsRef.current = Array.from(focusableElements);
    
    if (focusableElementsRef.current.length > 0 && focusableElementsRef.current[0]) {
      focusableElementsRef.current[0].focus();
    }
  }, [isExpanded]);
  
  // Handle mouse events on document
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  
  // Keyboard events
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Focus trap effect
  useEffect(() => {
    if (isExpanded) {
      trapFocus();
    }
  }, [isExpanded, trapFocus]);
  
  // Popover auto-hide timer
  useEffect(() => {
    if (showPopover) {
      timerRef.current = setTimeout(() => {
        setShowPopover(false);
      }, 5000);
      
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
    return undefined;
  }, [showPopover]);
  
  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    };
    
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [showPopover]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Reset local states when island is not visible or current is null
  useEffect(() => {
    if (!props.isVisible || current === null) {
      analysisLogger.debug('DynamicIsland state reset triggered', {
        isVisible: props.isVisible,
        hasCurrent: !!current,
        isExpanded,
        isCollapsed,
        showPopover,
        isDragging
      });
      
      // Reset all local states to prevent stuck states
      setIsCollapsed(false);
      setShowPopover(false);
      setIsDragging(false);
      setIsExpanded(false);
      
      analysisLogger.debug('DynamicIsland local states reset', {
        isCollapsed: false,
        showPopover: false,
        isDragging: false,
        isExpanded: false
      });
    }
  }, [props.isVisible, current, isExpanded, isCollapsed, showPopover, isDragging]);
  
  // Memoize drag calculations for performance - MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const dragCalculations = React.useMemo(() => {
    const transform = isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : '';
    const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(currentY - startY) / 100) : 1;
    return { transform, opacity };
  }, [isDragging, currentY, startY]);
  
  // Check if analyzing
  const isAnalyzing = props.isAnalyzing || (current?.state === 'loading');
  
  const positionClass = position === 'top' ? 'top-6' : 'bottom-6';
  const variantClass = current ? variantStyles[current.variant || 'default'] : variantStyles['default'];

  // Log state changes for debugging
  useEffect(() => {
    analysisLogger.debug('DynamicIsland state', {
      isVisible: props.isVisible,
      hasCurrent: !!current,
      isExpanded,
      isCollapsed,
      showPopover,
      isDragging,
      queueLength: 0 // Will be implemented later
    });
  }, [props.isVisible, current, isExpanded, isCollapsed, showPopover, isDragging]);

  // SINGLE RETURN WITH CONDITIONAL RENDERING - NO EARLY RETURNS
  return (
    <>
      {/* Conditionally render based on visibility */}
      {props.isVisible && (
        <>
          {/* If collapsed, show collapsed indicator */}
          {isCollapsed ? (
            <>
              <div
                className="fixed bottom-6 right-6 z-50 bg-black rounded-full p-3 cursor-pointer shadow-2xl hover:scale-110 transition-transform"
                onClick={() => {
                  setIsCollapsed(false);
                  if (!props.isAnalyzing) {
                    setIsExpanded(true);
                  }
                }}
              >
                <ChevronUp className="h-5 w-5 text-white" />
              </div>
              
              {/* Popover for collapsed/idle state */}
              {showPopover && (
                <div
                  ref={popoverRef}
                  className="fixed top-20 right-6 z-60 animate-in slide-in-from-bottom-5 max-w-xs"
                >
                  <div className="bg-black rounded-2xl p-4 shadow-2xl border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        <h3 className="text-white font-medium">Hướng dẫn phân tích</h3>
                      </div>
                      <button
                        onClick={() => setShowPopover(false)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-4">
                      Chọn văn bản để phân tích chi tiết. Hệ thống sẽ tự động nhận diện và phân tích các từ, cụm từ, câu và đoạn văn.
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Tự động ẩn sau 5s</span>
                      <button
                        onClick={() => setShowPopover(false)}
                        className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1 rounded-lg transition-colors"
                      >
                        Đã hiểu
                      </button>
                    </div>
                    
                    {/* Arrow pointing down */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black rotate-45 border-r border-b border-white/10"></div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* If no current analysis, show idle indicator */}
              {!current ? (
                <>
                  <div className="fixed top-4 right-4 z-50">
                    <div
                      ref={statusBarRef}
                      className="bg-black rounded-full shadow-2xl backdrop-blur border-zinc-800/50 p-3 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        if (!props.isAnalyzing) {
                          setShowPopover(true);
                        }
                      }}
                    >
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 animate-pulse relative flex items-center justify-center">
                        <ChevronDown className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Popover for idle state */}
                  {showPopover && (
                    <div
                      ref={popoverRef}
                      className="fixed top-20 right-6 z-60 animate-in slide-in-from-bottom-5 max-w-xs"
                    >
                      <div className="bg-black rounded-2xl p-4 shadow-2xl border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-400" />
                            <h3 className="text-white font-medium">Hướng dẫn phân tích</h3>
                          </div>
                          <button
                            onClick={() => setShowPopover(false)}
                            className="text-white/60 hover:text-white transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <p className="text-white/80 text-sm mb-4">
                          Chọn văn bản để phân tích chi tiết. Hệ thống sẽ tự động nhận diện và phân tích các từ, cụm từ, câu và đoạn văn.
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Tự động ẩn sau 5s</span>
                          <button
                            onClick={() => setShowPopover(false)}
                            className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1 rounded-lg transition-colors"
                          >
                            Đã hiểu
                          </button>
                        </div>
                        
                        {/* Arrow pointing down */}
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-black rotate-45 border-r border-b border-white/10"></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Main dynamic island component */
                <motion.div
                  ref={islandRef}
                  className={`fixed ${positionClass} left-1/2 -translate-x-1/2 z-50 ${className}`}
                  initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? -20 : 20 }}
                  animate={{ opacity: dragCalculations.opacity, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? -20 : 20 }}
                  transition={prefersReducedMotion() ? { duration: 0.1 } : { type: 'spring', stiffness: 300, damping: 25 }}
                  style={{ transform: dragCalculations.transform }}
                  role="status"
                  aria-live="polite"
                  aria-expanded={isExpanded}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isExpanded && !isCollapsed) {
                      setIsExpanded(true);
                    }
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={() => {
                    if (isDragging) {
                      setIsDragging(false);
                      setCurrentY(0);
                      setStartY(0);
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onMouseEnter={() => {
                    if (props.expandOnHover && !isExpanded && !isCollapsed && !isDragging && !isAnalyzing) {
                      setIsExpanded(true);
                    }
                  }}
                >
                  <motion.div
                    layout
                    className={`${variantClass} backdrop-blur-xl border shadow-2xl overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    animate={{
                      width: isExpanded ? '380px' : '120px',
                      height: isExpanded ? 'auto' : '37px',
                      borderRadius: isExpanded ? '24px' : '20px',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <AnimatePresence mode="wait">
                      {!isExpanded ? (
                        <CompactView key="compact" item={current} queueLength={0} /> // queue later
                      ) : (
                        <ExpandedView key="expanded" item={current} onDismiss={dismissCurrent} />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default DynamicIslandAnalysis;