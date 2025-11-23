import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { useSessionStore } from '@/stores/session-store';
import { useSessionData } from '@/hooks/useSessionData';
import { usePathname, useRouter } from 'next/navigation';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

interface AutoSaveParams {
  type: 'word' | 'sentence' | 'paragraph';
  text: string;
  analysisData: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  sessionId?: string;
}

interface UseSessionAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  intervalMs?: number;
  enableBeforeUnload?: boolean;
  enableNavigationSave?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveStatus {
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  pendingChanges: boolean;
  saveCount: number;
  nextAutoSave: Date | null;
}

/**
 * Hook để tự động lưu kết quả phân tích vào session hiện tại
 * Hỗ trợ debounce để tránh lưu quá nhiều lần
 */
export function useSessionAutoSave(options: UseSessionAutoSaveOptions = {}) {
  const {
    enabled = true,
    debounceMs = 2000, // 2 seconds debounce
    intervalMs = 5 * 60 * 1000, // 5 minutes
    enableBeforeUnload = true,
    enableNavigationSave = true,
    onSuccess,
    onError,
  } = options;

  const { saveAnalysis, isLoading, isSuccess, error, data } = useAnalysisSave({
    onSuccess: (data) => {
      console.log('🔍 [DEBUG] useSessionAutoSave - Analysis saved successfully', data);
      setAutoSaveStatus(prev => ({
        ...prev,
        isAutoSaving: false,
        lastSavedAt: new Date(),
        pendingChanges: false,
        saveCount: prev.saveCount + 1,
      }));
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] useSessionAutoSave - Failed to save analysis', error);
      setAutoSaveStatus(prev => ({
        ...prev,
        isAutoSaving: false,
      }));
      onError?.(error);
    }
  });

  const { currentSession, updateSession } = useSessionStore();
  const pathname = usePathname();
  const router = useRouter();
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<AutoSaveParams | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const lastSaveTimeRef = useRef<Date | null>(null);
  const nextAutoSaveTimeRef = useRef<Date | null>(null);
  
  // Auto-save status state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    isAutoSaving: false,
    lastSavedAt: null,
    pendingChanges: false,
    saveCount: 0,
    nextAutoSave: null,
  });

  // Force save immediately (without debounce)
  const forceSave = useCallback((params: AutoSaveParams) => {
    if (!enabled) {
      console.log('🔍 [DEBUG] useSessionAutoSave - Auto-save disabled');
      return;
    }

    // Use current session ID if not provided
    const sessionId = params.sessionId || currentSession?.id;
    
    if (!sessionId) {
      console.log('🔍 [DEBUG] useSessionAutoSave - No session ID available, skipping force save');
      return;
    }

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    console.log('🔍 [DEBUG] useSessionAutoSave - Executing force save', {
      type: params.type,
      textLength: params.text.length,
      sessionId,
    });

    saveAnalysis({
      type: params.type,
      text: params.text,
      analysisData: params.analysisData,
      sessionId,
    });

    pendingSaveRef.current = null;
  }, [enabled, currentSession?.id, saveAnalysis]);

  // Auto-save function with debounce
  const autoSave = useCallback((params: AutoSaveParams) => {
    if (!enabled) {
      console.log('🔍 [DEBUG] useSessionAutoSave - Auto-save disabled');
      return;
    }

    // Use current session ID if not provided
    const sessionId = params.sessionId || currentSession?.id;
    
    if (!sessionId) {
      console.log('🔍 [DEBUG] useSessionAutoSave - No session ID available, skipping auto-save');
      return;
    }

    // Store the latest params
    pendingSaveRef.current = {
      ...params,
      sessionId,
    };

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        console.log('🔍 [DEBUG] useSessionAutoSave - Executing auto-save', {
          type: pendingSaveRef.current.type,
          textLength: pendingSaveRef.current.text.length,
          sessionId: pendingSaveRef.current.sessionId,
        });

        saveAnalysis({
          type: pendingSaveRef.current.type,
          text: pendingSaveRef.current.text,
          analysisData: pendingSaveRef.current.analysisData,
          sessionId: pendingSaveRef.current.sessionId,
        });

        pendingSaveRef.current = null;
      }
    }, debounceMs);
  }, [enabled, currentSession?.id, saveAnalysis, debounceMs]);

  // Periodic auto-save function
  const performPeriodicSave = useCallback(async () => {
    if (!enabled || !currentSession?.id || !hasUnsavedChangesRef.current) {
      return;
    }

    // Don't save if we saved recently (within the last minute)
    if (lastSaveTimeRef.current &&
        (Date.now() - lastSaveTimeRef.current.getTime()) < 60 * 1000) {
      return;
    }

    console.log('🔍 [DEBUG] useSessionAutoSave - Performing periodic save', {
      sessionId: currentSession.id,
      hasPendingSave: !!pendingSaveRef.current,
    });

    // Update session's last_accessed_at to mark activity
    try {
      await updateSession(currentSession.id, {
        last_accessed_at: new Date().toISOString(),
      });
      
      lastSaveTimeRef.current = new Date();
      hasUnsavedChangesRef.current = false;
      
      setAutoSaveStatus(prev => ({
        ...prev,
        lastSavedAt: lastSaveTimeRef.current,
        pendingChanges: false,
        saveCount: prev.saveCount + 1,
      }));
    } catch (error) {
      console.error('🔍 [DEBUG] useSessionAutoSave - Periodic save failed', error);
      onError?.(error instanceof Error ? error : new Error('Periodic save failed'));
    }
  }, [enabled, currentSession?.id, updateSession, onError]);

  // Setup periodic auto-save
  useEffect(() => {
    if (!enabled || !currentSession?.id || intervalMs <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculate next auto-save time
    const updateNextAutoSaveTime = () => {
      nextAutoSaveTimeRef.current = new Date(Date.now() + intervalMs);
      setAutoSaveStatus(prev => ({
        ...prev,
        nextAutoSave: nextAutoSaveTimeRef.current,
      }));
    };

    updateNextAutoSaveTime();

    intervalRef.current = setInterval(() => {
      performPeriodicSave();
      updateNextAutoSaveTime();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, currentSession?.id, intervalMs, performPeriodicSave]);

  // Handle beforeunload event
  useEffect(() => {
    if (!enableBeforeUnload || !enabled || !currentSession?.id) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current || pendingSaveRef.current) {
        console.log('🔍 [DEBUG] useSessionAutoSave - Before unload detected, showing warning');
        
        // Force save any pending changes
        if (pendingSaveRef.current) {
          saveAnalysis({
            type: pendingSaveRef.current.type,
            text: pendingSaveRef.current.text,
            analysisData: pendingSaveRef.current.analysisData,
            sessionId: pendingSaveRef.current.sessionId,
          });
        }

        // Show browser warning
        e.preventDefault();
        e.returnValue = 'Bạn có các thay đổi chưa được lưu. Bạn có chắc muốn rời đi?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableBeforeUnload, enabled, currentSession?.id, saveAnalysis]);

  // Handle navigation away
  useEffect(() => {
    if (!enableNavigationSave || !enabled || !currentSession?.id) {
      return;
    }

    const currentPath = pathname;
    
    // Check if we're navigating away from analysis page
    const isAnalysisPage = currentPath.includes('/analysis');
    
    return () => {
      const newPath = pathname;
      
      // If we navigated away from analysis page and have unsaved changes
      if (isAnalysisPage && newPath !== currentPath &&
          (hasUnsavedChangesRef.current || pendingSaveRef.current)) {
        console.log('🔍 [DEBUG] useSessionAutoSave - Navigation away detected, saving changes');
        
        // Force save any pending changes
        if (pendingSaveRef.current) {
          saveAnalysis({
            type: pendingSaveRef.current.type,
            text: pendingSaveRef.current.text,
            analysisData: pendingSaveRef.current.analysisData,
            sessionId: pendingSaveRef.current.sessionId,
          });
        }
      }
    };
  }, [enableNavigationSave, enabled, currentSession?.id, pathname, saveAnalysis]);

  // Enhanced auto-save that marks content as changed
  const enhancedAutoSave = useCallback((params: AutoSaveParams) => {
    hasUnsavedChangesRef.current = true;
    setAutoSaveStatus(prev => ({
      ...prev,
      pendingChanges: true,
    }));
    
    autoSave(params);
  }, [autoSave]);

  // Enhanced force-save that marks content as changed
  const enhancedForceSave = useCallback((params: AutoSaveParams) => {
    hasUnsavedChangesRef.current = true;
    setAutoSaveStatus(prev => ({
      ...prev,
      pendingChanges: true,
      isAutoSaving: true,
    }));
    
    // Call the original forceSave function
    forceSave(params);
  }, [forceSave]);

  // Cancel pending save
  const cancelPendingSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    pendingSaveRef.current = null;
    console.log('🔍 [DEBUG] useSessionAutoSave - Pending save cancelled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    autoSave: enhancedAutoSave,
    forceSave: enhancedForceSave,
    cancelPendingSave,
    isSaving: isLoading,
    isSuccess,
    error,
    lastSaveData: data,
    hasPendingSave: !!pendingSaveRef.current,
    autoSaveStatus,
    hasUnsavedChanges: hasUnsavedChangesRef.current,
    markAsChanged: useCallback(() => {
      hasUnsavedChangesRef.current = true;
      setAutoSaveStatus(prev => ({
        ...prev,
        pendingChanges: true,
      }));
    }, []),
    markAsSaved: useCallback(() => {
      hasUnsavedChangesRef.current = false;
      setAutoSaveStatus(prev => ({
        ...prev,
        pendingChanges: false,
        lastSavedAt: new Date(),
      }));
    }, []),
  };
}

/**
 * Hook để tự động cập nhật session khi có thay đổi
 */
export function useSessionAutoUpdate() {
  const { currentSession, updateSession } = useSessionStore();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Record<string, any>>({});

  // Auto-update session with debounce
  const autoUpdate = useCallback((updates: Record<string, any>) => {
    if (!currentSession) {
      console.log('🔍 [DEBUG] useSessionAutoUpdate - No current session, skipping update');
      return;
    }

    // Store the latest updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Set new timeout
    updateTimeoutRef.current = setTimeout(async () => {
      if (Object.keys(pendingUpdatesRef.current).length > 0) {
        console.log('🔍 [DEBUG] useSessionAutoUpdate - Executing auto-update', {
          sessionId: currentSession.id,
          updates: pendingUpdatesRef.current,
        });

        try {
          await updateSession(currentSession.id, pendingUpdatesRef.current);
          pendingUpdatesRef.current = {};
        } catch (error) {
          console.error('🔍 [DEBUG] useSessionAutoUpdate - Failed to update session', error);
        }
      }
    }, 1000); // 1 second debounce
  }, [currentSession, updateSession]);

  // Force update immediately
  const forceUpdate = useCallback(async (updates: Record<string, any>) => {
    if (!currentSession) {
      console.log('🔍 [DEBUG] useSessionAutoUpdate - No current session, skipping force update');
      return;
    }

    // Clear any pending debounce
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    console.log('🔍 [DEBUG] useSessionAutoUpdate - Executing force update', {
      sessionId: currentSession.id,
      updates,
    });

    try {
      await updateSession(currentSession.id, updates);
      pendingUpdatesRef.current = {};
    } catch (error) {
      console.error('🔍 [DEBUG] useSessionAutoUpdate - Failed to force update session', error);
      throw error;
    }
  }, [currentSession, updateSession]);

  // Cancel pending update
  const cancelPendingUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    pendingUpdatesRef.current = {};
    console.log('🔍 [DEBUG] useSessionAutoUpdate - Pending update cancelled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    autoUpdate,
    forceUpdate,
    cancelPendingUpdate,
    hasPendingUpdate: Object.keys(pendingUpdatesRef.current).length > 0,
  };
}