import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useDialogStore } from '../../../../stores/analysis-dialog-store';
import { AnalysisType } from '../types/dialog-types';

/**
 * Interface cho loading state phân cấp
 */
interface DialogLoadingState {
  // Global loading state
  isLoading: boolean;
  error: string | null;
  message: string | null;
  
  // Local loading states
  fetching: {
    fullData: boolean;
    relatedData: boolean;
  };
  
  // Action-specific loading states
  actions: {
    pronunciation: boolean;
    addToVocabulary: boolean;
    share: boolean;
    export: boolean;
    analyze: boolean;
    print: boolean;
    copy: boolean;
    edit: boolean;
  };
  
  // Metadata
  lastUpdated: number;
  source: 'global' | 'local' | 'action';
}

/**
 * Return type cho useDialogLoading hook
 */
interface UseDialogLoadingReturn {
  // Global state
  isLoading: boolean;
  error: string | null;
  message: string | null;
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setLocalLoading: (key: string, loading: boolean) => void;
  setActionLoading: (action: string, loading: boolean) => void;
  clearError: () => void;
  
  // Computed states
  hasAnyLoading: boolean;
  primaryLoadingSource: string;
  loadingStates: DialogLoadingState;
}

/**
 * Hook quản lý loading state nhất quán cho dialog
 */
export const useDialogLoading = (type: AnalysisType): UseDialogLoadingReturn => {
  const store = useDialogStore();
  
  // Use ref to maintain stable store reference
  const storeRef = useRef(store);
  storeRef.current = store;
  
  // Global loading state
  const isLoading = useMemo(() => 
    store.dialogStates[type]?.loading || false, 
    [store.dialogStates, type]
  );
  
  const error = useMemo(() => 
    store.dialogStates[type]?.error || null, 
    [store.dialogStates, type]
  );
  
  const message = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return null;
    
    // Determine message based on source and context
    if (state.error) return state.error;
    if (state.loading) return 'Đang tải...';
    if (state.fetching?.fullData) return 'Đang tải dữ liệu đầy đủ...';
    if (state.actions?.pronunciation) return 'Đang phát âm...';
    if (state.actions?.addToVocabulary) return 'Đang thêm vào từ vựng...';
    if (state.actions?.share) return 'Đang chia sẻ...';
    if (state.actions?.export) return 'Đang xuất...';
    if (state.actions?.analyze) return 'Đang phân tích...';
    if (state.actions?.print) return 'Đang in...';
    if (state.actions?.copy) return 'Đang sao chép...';
    if (state.actions?.edit) return 'Đang chỉnh sửa...';
    
    return null;
  }, [store.dialogStates, type]);
  
  // Set global loading
  const setGlobalLoading = useCallback((loading: boolean, message?: string) => {
    storeRef.current.setDialogLoading(type, loading);
    
    // Update message if provided
    if (message && loading) {
      // Could store message in state if needed
      console.log(`[${type}] Loading message: ${message}`);
    }
  }, [type]);
  
  // Set local loading
  const setLocalLoading = useCallback((key: string, loading: boolean) => {
    const currentState = storeRef.current.dialogStates[type];
    if (!currentState) return;
    
    storeRef.current.setDialogLoading(type, {
      ...currentState,
      fetching: {
        ...currentState.fetching,
        [key]: loading
      }
    } as any);
  }, [type]);
  
  // Set action loading
  const setActionLoading = useCallback((action: string, loading: boolean) => {
    const currentState = storeRef.current.dialogStates[type];
    if (!currentState) return;
    
    storeRef.current.setDialogLoading(type, {
      ...currentState,
      actions: {
        ...currentState.actions,
        [action]: loading
      }
    } as any);
  }, [type]);
  
  // Clear error
  const clearError = useCallback(() => {
    storeRef.current.setDialogError(type, null);
  }, [type]);
  
  // Computed states
  const hasAnyLoading = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return false;
    
    return (
      state.loading ||
      state.fetching?.fullData ||
      state.fetching?.relatedData ||
      Object.values(state.actions || {}).some(actionLoading => actionLoading)
    );
  }, [store.dialogStates, type]);
  
  const primaryLoadingSource = useMemo(() => {
    const state = store.dialogStates[type];
    if (!state) return 'none';
    
    if (state.loading) return 'global';
    if (state.fetching?.fullData) return 'local';
    if (state.fetching?.relatedData) return 'local';
    
    const activeActions = Object.entries(state.actions || {})
      .filter(([_, loading]) => loading)
      .map(([action]) => action);
    
    return activeActions.length > 0 ? `action:${activeActions[0]}` : 'none';
  }, [store.dialogStates, type]);
  
  // Complete loading state object
  const loadingStates: DialogLoadingState = useMemo(() => {
    const state = store.dialogStates[type];
    return {
      isLoading: state?.loading || false,
      error: state?.error || null,
      message: state?.error || null,
      fetching: {
        fullData: state?.fetching?.fullData || false,
        relatedData: state?.fetching?.relatedData || false,
      },
      actions: {
        pronunciation: state?.actions?.pronunciation || false,
        addToVocabulary: state?.actions?.addToVocabulary || false,
        share: state?.actions?.share || false,
        export: state?.actions?.export || false,
        analyze: state?.actions?.analyze || false,
        print: state?.actions?.print || false,
        copy: state?.actions?.copy || false,
        edit: state?.actions?.edit || false,
      },
      lastUpdated: state?.lastUpdated || Date.now(),
      source: primaryLoadingSource === 'global' ? 'global' :
              primaryLoadingSource === 'local' ? 'local' : 'action'
    };
  }, [store.dialogStates, type, primaryLoadingSource]);
  
  // Auto-clear loading when data is available
  useEffect(() => {
    console.log('🐛 DEBUG: useDialogLoading useEffect [type] triggered', {
      type,
      timestamp: new Date().toISOString(),
      state: storeRef.current.dialogStates[type],
      data: storeRef.current.dialogData[type]
    });
    
    const state = storeRef.current.dialogStates[type];
    if (!state) return;
    
    // Clear global loading if we have data and no active actions
    const hasData = !!storeRef.current.dialogData[type];
    const hasActiveActions = Object.values(state.actions || {}).some(loading => loading);
    
    console.log('🐛 DEBUG: useDialogLoading auto-clear check', {
      type,
      hasData,
      hasActiveActions,
      isLoading: state.loading,
      shouldClear: hasData && !hasActiveActions && state.loading
    });
    
    if (hasData && !hasActiveActions && state.loading) {
      console.log('🐛 DEBUG: useDialogLoading auto-clearing loading state', { type });
      storeRef.current.setDialogLoading(type, false);
    }
  }, [type, storeRef.current.dialogStates[type]?.loading, storeRef.current.dialogData[type]]); // Fixed dependencies
  
  // Auto-clear loading on error
  useEffect(() => {
    console.log('🐛 DEBUG: useDialogLoading error useEffect [type] triggered', {
      type,
      timestamp: new Date().toISOString(),
      state: store.dialogStates[type]
    });
    
    const state = store.dialogStates[type];
    if (state?.error) {
      console.log('🐛 DEBUG: useDialogLoading auto-clearing on error', { type, error: state.error });
      // Clear all loading states when there's an error
      storeRef.current.setDialogLoading(type, {
        ...state,
        loading: false,
        fetching: {
          fullData: false,
          relatedData: false,
        },
        actions: {}
      } as any);
    }
  }, [type, store.dialogStates[type]?.error]); // Fixed dependencies
  
  return {
    isLoading,
    error,
    message,
    setGlobalLoading,
    setLocalLoading,
    setActionLoading,
    clearError,
    hasAnyLoading,
    primaryLoadingSource,
    loadingStates
  };
};