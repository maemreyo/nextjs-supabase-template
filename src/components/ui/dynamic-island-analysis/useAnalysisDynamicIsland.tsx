import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, BookOpen, Sparkles, FileText, Hash } from 'lucide-react';
import type { DynamicIslandAnalysisProps, AnalysisItem, StatusState } from './types';
import type { UseAnalysisDynamicIslandReturn } from './useAnalysisDynamicIsland.types';

export const useAnalysisDynamicIsland = (props: DynamicIslandAnalysisProps): UseAnalysisDynamicIslandReturn => {
  const [queue, setQueue] = useState<AnalysisItem[]>([]);
  const [current, setCurrent] = useState<AnalysisItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const dismissCurrent = useCallback(() => {
    setIsExpanded(false);
    setTimeout(() => setCurrent(null), 300);
  }, []);

  // Helper function to get the appropriate icon based on analysis type
  const getIconForType = (type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    switch (type) {
      case 'word':
        return <Hash size={16} />;
      case 'phrase':
        return <Sparkles size={16} />;
      case 'sentence':
        return <FileText size={16} />;
      case 'paragraph':
        return <BookOpen size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Sync props to items
  useEffect(() => {
    // If not visible, don't process anything
    if (props.isVisible === false) {
      setCurrent(null);
      setQueue([]);
      return;
    }

    if (props.isAnalyzing) {
      // Create loading item
      const loadingItem: AnalysisItem = {
        id: `loading-${Date.now()}`,
        state: 'loading',
        title: 'Analyzing...',
        icon: <Loader2 size={16} className="animate-spin" />,
        variant: 'info',
        duration: 0, // no auto dismiss
        progress: props.progress,
      };
      setQueue([loadingItem]);
    } else if (props.analysisResult) {
      // Success item with data
      const successItem: AnalysisItem = {
        id: `success-${Date.now()}`,
        state: 'success',
        title: props.analysisResult.type.charAt(0).toUpperCase() + props.analysisResult.type.slice(1),
        icon: getIconForType(props.analysisResult.type),
        variant: 'success',
        analysisData: { 
          type: props.analysisResult.type, 
          data: props.analysisResult.data 
        },
        duration: props.defaultDuration || 5000,
        action: { label: 'View Details', onClick: props.onViewDetails },
      };
      setQueue([successItem]);
    } else if (props.error) {
      // Error item
      const errorItem: AnalysisItem = {
        id: `error-${Date.now()}`,
        state: 'error',
        title: 'Error',
        description: props.error,
        icon: <AlertCircle size={16} />,
        variant: 'error',
        duration: props.defaultDuration || 5000,
      };
      setQueue([errorItem]);
    } else {
      // Idle: special, no queue
      setCurrent(null);
      setQueue([]);
    }
  }, [
    props.isVisible, 
    props.isAnalyzing, 
    props.analysisResult, 
    props.error, 
    props.progress, 
    props.onViewDetails, 
    props.defaultDuration
  ]);

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      if (next) {
        setCurrent(next);
        setQueue(rest);
        
        // Auto-expand for new items (except idle)
        if (props.autoExpand !== false && next.state !== 'idle') {
          const timer = setTimeout(() => setIsExpanded(true), 100);
          return () => clearTimeout(timer);
        }
      }
    }
    return undefined;
  }, [current, queue, props.autoExpand]);

  // Auto dismiss
  useEffect(() => {
    if (current?.duration && current.duration > 0 && isExpanded) {
      const timer = setTimeout(dismissCurrent, current.duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [current, isExpanded, dismissCurrent]);

  return {
    current,
    isExpanded,
    queueLength: queue.length,
    dismissCurrent,
    setIsExpanded,
    // for idle guide toggle
    toggleGuide: () => {}, // placeholder for now
  };
};