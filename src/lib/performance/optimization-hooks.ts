/**
 * Performance Optimization Hooks
 * Provides React hooks for performance optimization, memory management, and rendering optimization
 */

import { useCallback, useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { debounce, throttle } from 'lodash-es';

// Virtual scrolling hook for large lists
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollToIndex?: number;
}

interface VirtualScrollResult {
  visibleItems: {
    index: number;
    offsetTop: number;
    data: any;
  }[];
  totalHeight: number;
  scrollTop: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5, scrollToIndex: initialScrollToIndex } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return Array.from(
      { length: visibleRange.endIndex - visibleRange.startIndex + 1 },
      (_, index) => {
        const itemIndex = visibleRange.startIndex + index;
        return {
          index: itemIndex,
          offsetTop: itemIndex * itemHeight,
          data: items[itemIndex]
        };
      }
    );
  }, [visibleRange, items, itemHeight]);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const targetScrollTop = index * itemHeight;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [itemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (initialScrollToIndex !== undefined && containerRef.current) {
      scrollToIndex(initialScrollToIndex);
    }
  }, [initialScrollToIndex, scrollToIndex]);

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    scrollToIndex,
    containerRef: containerRef as React.RefObject<HTMLDivElement>
  };
}

// Intersection observer hook for lazy loading
interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<Element>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<Element>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, root, rootMargin, hasIntersected]);

  const shouldRender = freezeOnceVisible ? hasIntersected || isIntersecting : isIntersecting;
  
  return [ref as React.RefObject<Element>, shouldRender];
}

// Resize observer hook for responsive components
export function useResizeObserver<T extends Element>(
  callback: (entries: ResizeObserverEntry[]) => void
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      callbackRef.current(entries);
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  return ref as React.RefObject<T>;
}

// Memory leak prevention hook
export function useAsyncEffect(
  effect: () => Promise<void> | Promise<() => void>,
  deps: React.DependencyList
): void {
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    effect().then((result) => {
      if (!cancelled) {
        if (typeof result === 'function') {
          cleanup = result;
        }
      }
    });

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, deps);
}

// Optimized event listener hook
export function useEventListener(
  eventName: string,
  handler: EventListener,
  element: EventTarget = window,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event: Event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled value hook
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setInterval(() => {
      const now = Date.now();
      if (now - lastExecuted.current >= delay) {
        setThrottledValue(value);
        lastExecuted.current = now;
      }
    }, 16); // Check every frame

    return () => {
      clearInterval(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

// Optimized pagination hook
interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  maxVisiblePages?: number;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  currentPageItems: number;
  startIndex: number;
  endIndex: number;
  visiblePages: number[];
  canGoToPrev: boolean;
  canGoToNext: boolean;
  goToPage: (page: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

export function usePagination(
  options: UsePaginationOptions
): UsePaginationResult {
  const { totalItems, itemsPerPage, initialPage = 1, maxVisiblePages = 5 } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);
  
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  
  const endIndex = useMemo(() => Math.min(startIndex + itemsPerPage, totalItems), [startIndex, itemsPerPage, totalItems]);
  
  const currentPageItems = useMemo(() => endIndex - startIndex, [startIndex, endIndex]);

  const visiblePages = useMemo(() => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  const canGoToPrev = useMemo(() => currentPage > 1, [currentPage]);
  const canGoToNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNext = useCallback(() => {
    if (canGoToNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [canGoToNext]);

  const goToPrev = useCallback(() => {
    if (canGoToPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [canGoToPrev]);

  const goToFirst = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    currentPageItems,
    startIndex,
    endIndex,
    visiblePages,
    canGoToPrev,
    canGoToNext,
    goToPage,
    goToNext,
    goToPrev,
    goToFirst,
    goToLast
  };
}

// Optimized search hook
export function useOptimizedSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  options: {
    debounceMs?: number;
    minQueryLength?: number;
  } = {}
): [T[], string, (query: string) => void] {
  const { debounceMs = 300, minQueryLength = 1 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);

  const debouncedQuery = useDebouncedValue(query, debounceMs);

  useEffect(() => {
    if (debouncedQuery.length < minQueryLength) {
      setResults(items);
      return;
    }

    const filtered = items.filter(item => searchFn(item, debouncedQuery));
    setResults(filtered);
  }, [debouncedQuery, items, searchFn, minQueryLength]);

  return [results, query, setQuery];
}

// Performance monitoring hook
interface PerformanceMetrics {
  renderCount: number;
  renderTime: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

export function usePerformanceMonitor(componentName: string): PerformanceMetrics {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef(0);

  useLayoutEffect(() => {
    const startTime = performance.now();
    renderCount.current++;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.current.push(renderTime);
      lastRenderTime.current = renderTime;

      // Keep only last 10 renders for average
      if (renderTimes.current.length > 10) {
        renderTimes.current = renderTimes.current.slice(-10);
      }

      const averageRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
      
    };
  });

  const averageRenderTime = useMemo(() => {
    if (renderTimes.current.length === 0) return 0;
    return renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;
  }, []);

  return {
    renderCount: renderCount.current,
    renderTime: lastRenderTime.current,
    lastRenderTime: lastRenderTime.current,
    averageRenderTime
  };
}

// Optimized image loading hook
export function useOptimizedImage(src: string): {
  isLoading: boolean;
  error: string | null;
  imageSrc: string | null;
  retry: () => void;
} {
  const [state, setState] = useState({
    isLoading: true,
    error: null as string | null,
    imageSrc: null as string | null
  });

  const loadAttempts = useRef(0);
  const maxRetries = 3;

  const loadImage = useCallback(() => {
    if (loadAttempts.current >= maxRetries) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Max retries reached' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const img = new Image();
    img.onload = () => {
      setState({
        isLoading: false,
        error: null,
        imageSrc: src
      });
    };
    img.onerror = () => {
      loadAttempts.current++;
      if (loadAttempts.current < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, loadAttempts.current) * 1000;
        setTimeout(loadImage, delay);
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load image' }));
      }
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    loadAttempts.current = 0;
    loadImage();
  }, [loadImage]);

  const retry = useCallback(() => {
    loadAttempts.current = 0;
    loadImage();
  }, [loadImage]);

  return {
    ...state,
    retry
  };
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useMemo(
    () => debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as unknown as T,
    [delay]
  );
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  return useMemo(
    () => throttle((...args: Parameters<T>) => callbackRef.current(...args), delay) as unknown as T,
    [delay]
  );
}

// Optimized array operations hook
export function useOptimizedArray<T>(initialArray: T[]): {
  array: T[];
  addItem: (item: T) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, item: T) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  clearArray: () => void;
} {
  const [array, setArray] = useState(initialArray);

  const addItem = useCallback((item: T) => {
    setArray(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((prevItem, i) => i === index ? item : prevItem));
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setArray(prev => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      if (removed !== undefined) {
        result.splice(toIndex, 0, removed);
      }
      return result;
    });
  }, []);

  const clearArray = useCallback(() => {
    setArray([]);
  }, []);

  return {
    array,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    clearArray
  };
}

// Memory optimization hook for large datasets
export function useMemoryOptimizedData<T>(
  data: T[],
  options: {
    chunkSize?: number;
    maxChunks?: number;
  } = {}
): {
  visibleData: T[];
  loadMore: () => void;
  hasMore: boolean;
  reset: () => void;
} {
  const { chunkSize = 50, maxChunks = 10 } = options;
  
  const [visibleChunks, setVisibleChunks] = useState(1);
  const totalChunks = Math.ceil(data.length / chunkSize);

  const visibleData = useMemo(() => {
    const endIndex = Math.min(visibleChunks * chunkSize, data.length);
    return data.slice(0, endIndex);
  }, [data, visibleChunks, chunkSize]);

  const hasMore = visibleChunks < totalChunks && visibleChunks < maxChunks;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleChunks(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setVisibleChunks(1);
  }, []);

  return {
    visibleData,
    loadMore,
    hasMore,
    reset
  };
}