import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { useSessionStore } from '@/hooks/stores/use-session-store';
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
    enabled = false, // Tắt auto-save theo mặc định
    debounceMs = 2000, // 2 seconds debounce
    intervalMs = 5 * 60 * 1000, // 5 minutes
    enableBeforeUnload = false, // Tắt beforeunload auto-save theo mặc định
    enableNavigationSave = false, // Tắt navigation save theo mặc định
    onSuccess,
    onError,
  } = options;

  const { saveAnalysis, isLoading, isSuccess, error, data } = useAnalysisSave({
    onSuccess: (data) => {
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
    // Force save should work even when auto-save is disabled
    // This allows manual save via button click
    
    // Use current session ID if not provided
    const sessionId = params.sessionId || currentSession?.id;
    
    if (!sessionId) {
    }

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }


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
      return;
    }

    // Use current session ID if not provided
    const sessionId = params.sessionId || currentSession?.id;
    
    if (!sessionId) {
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
      onError?.(error instanceof Error ? error : new Error('Periodic save failed'));
    }
  }, [enabled, currentSession?.id, updateSession, onError]);

  // Setup periodic auto-save - DISABLED
  useEffect(() => {
    // Periodic auto-save đã bị vô hiệu hóa để tránh spam
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return;
  }, []);

  // Handle beforeunload event - DISABLED AUTO-SAVE BUT KEEP WARNING
  useEffect(() => {
    // Beforeunload auto-save đã bị vô hiệu hóa
    // Chỉ hiển thị cảnh báo mà không tự động lưu
    if (!enableBeforeUnload || !enabled || !currentSession?.id) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current || pendingSaveRef.current) {
        
        // Show browser warning without auto-saving
        const message = 'Bạn có các thay đổi chưa được lưu. Mọi thay đổi sẽ bị mất nếu bạn rời đi. Bạn có chắc muốn rời đi?';
        e.preventDefault();
        e.returnValue = message;
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableBeforeUnload, enabled, currentSession?.id]);

  // Handle navigation away - DISABLED
  useEffect(() => {
    // Navigation auto-save đã bị vô hiệu hóa
    return;
  }, []);

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

        try {
          if (currentSession) {
            await updateSession(currentSession.id, pendingUpdatesRef.current);
            pendingUpdatesRef.current = {};
          }
        } catch (error) {
        }
      }
    }, 1000); // 1 second debounce
  }, [currentSession, updateSession]);

  // Force update immediately
  const forceUpdate = useCallback(async (updates: Record<string, any>) => {
    if (!currentSession) {
      return;
    }

    // Clear any pending debounce
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }


    try {
      await updateSession(currentSession.id, updates);
      pendingUpdatesRef.current = {};
    } catch (error) {
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