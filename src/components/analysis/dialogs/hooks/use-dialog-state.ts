import { useCallback, useMemo } from 'react';
import { useDialogStore } from '../../../../stores/analysis-dialog-store';
import {
  UseDialogStateReturn,
  AnalysisType,
  AnalysisItem
} from '../types/dialog-types';

/**
 * Hook for managing dialog state
 * @param type - The analysis type
 * @returns Dialog state and actions
 */
export const useDialogState = (type: AnalysisType): UseDialogStateReturn => {
  const store = useDialogStore();
  
  const state = useMemo(() => {
    console.log('🐛 DEBUG: useDialogState useMemo recalculating', {
      type,
      isOpen: store.openDialogs[type],
      hasData: !!store.dialogData[type],
      dialogState: store.dialogStates[type],
      timestamp: new Date().toISOString()
    });
    
    return {
      isOpen: store.openDialogs[type],
      data: store.dialogData[type],
      dialogState: store.dialogStates[type],
    };
  }, [
    store.openDialogs[type],
    store.dialogData[type],
    store.dialogStates[type]
  ]);
  
  const actions = useMemo(() => {
    console.log('🐛 DEBUG: useDialogState actions useMemo recalculating', {
      type,
      timestamp: new Date().toISOString()
    });
    
    return {
      open: (data: AnalysisItem) => store.openDialog(type, data),
      close: () => store.closeDialog(type),
      updateData: (data: AnalysisItem) => store.updateDialogData(type, data),
      setLoading: (loading: boolean) => store.setDialogLoading(type, loading),
      setError: (error: string | null) => store.setDialogError(type, error),
      toggleFullscreen: () => store.toggleFullscreen(type),
      setWidth: (width: number) => store.setDialogWidth(type, width),
    };
  }, [store]);
  
  return { state, actions };
};

/**
 * Hook for getting all open dialogs
 * @returns Array of open dialog types
 */
export const useOpenDialogs = (): AnalysisType[] => {
  const store = useDialogStore();
  
  return useMemo(() => {
    return Object.entries(store.openDialogs)
      .filter(([_, open]) => open)
      .map(([type]) => type as AnalysisType);
  }, [store.openDialogs]);
};

/**
 * Hook for checking if any dialog is open
 * @returns Boolean indicating if any dialog is open
 */
export const useHasOpenDialogs = (): boolean => {
  const openDialogs = useOpenDialogs();
  
  return useMemo(() => openDialogs.length > 0, [openDialogs]);
};

/**
 * Hook for getting dialog count
 * @returns Number of open dialogs
 */
export const useOpenDialogCount = (): number => {
  const openDialogs = useOpenDialogs();
  
  return useMemo(() => openDialogs.length, [openDialogs]);
};

/**
 * Hook for getting dialog settings
 * @returns Dialog settings
 */
export const useDialogSettings = () => {
  const store = useDialogStore();
  
  return useMemo(() => store.settings, [store.settings]);
};

/**
 * Hook for getting specific dialog state
 * @param type - The analysis type
 * @returns Dialog state for the specified type
 */
export const useSpecificDialogState = (type: AnalysisType) => {
  const store = useDialogStore();
  
  return useMemo(() => ({
    isOpen: store.openDialogs[type],
    data: store.dialogData[type],
    loading: store.dialogStates[type]?.loading || false,
    error: store.dialogStates[type]?.error || null,
    fullscreen: store.dialogStates[type]?.fullscreen || false,
    resizedWidth: store.dialogStates[type]?.resizedWidth,
    lastUpdated: store.dialogStates[type]?.lastUpdated || Date.now(),
    position: store.dialogStates[type]?.position,
  }), [
    store.openDialogs[type],
    store.dialogData[type],
    store.dialogStates[type]?.loading,
    store.dialogStates[type]?.error,
    store.dialogStates[type]?.fullscreen,
    store.dialogStates[type]?.resizedWidth,
    store.dialogStates[type]?.lastUpdated,
    store.dialogStates[type]?.position,
  ]);
};

/**
 * Hook for dialog manager functionality
 * @returns Dialog manager actions
 */
export const useDialogManager = () => {
  const store = useDialogStore();
  
  const actions = useMemo(() => ({
    openDialog: (type: AnalysisType, data: AnalysisItem) => store.openDialog(type, data),
    closeDialog: (type: AnalysisType) => store.closeDialog(type),
    closeAllDialogs: () => store.closeAllDialogs(),
    toggleDialog: (type: AnalysisType, data?: AnalysisItem) => {
      if (store.openDialogs[type]) {
        store.closeDialog(type);
      } else if (data) {
        store.openDialog(type, data);
      }
    },
    resetDialog: (type: AnalysisType) => {
      store.closeDialog(type);
      store.updateDialogData(type, null as any);
      store.setDialogError(type, null);
      store.setDialogLoading(type, false);
    },
    resetAllDialogs: () => {
      store.closeAllDialogs();
      // Reset all dialog data and states
      (Object.keys(store.dialogData) as AnalysisType[]).forEach(type => {
        store.updateDialogData(type, null as any);
        store.setDialogError(type, null);
        store.setDialogLoading(type, false);
      });
    },
    updateSettings: (settings: Partial<typeof store.settings>) => store.updateSettings(settings),
  }), [store]);
  
  return actions;
};

/**
 * Hook for dialog persistence
 * @returns Persistence utilities
 */
export const useDialogPersistence = () => {
  const store = useDialogStore();
  
  const utils = useMemo(() => ({
    exportState: () => ({
      openDialogs: store.openDialogs,
      dialogData: store.dialogData,
      dialogStates: store.dialogStates,
      settings: store.settings,
    }),
    importState: (state: Partial<typeof store>) => {
      if (state.openDialogs) useDialogStore.setState({ openDialogs: state.openDialogs });
      if (state.dialogData) useDialogStore.setState({ dialogData: state.dialogData });
      if (state.dialogStates) useDialogStore.setState({ dialogStates: state.dialogStates });
      if (state.settings) store.updateSettings(state.settings);
    },
    clearState: () => {
      store.closeAllDialogs();
      (Object.keys(store.dialogData) as AnalysisType[]).forEach(type => {
        store.updateDialogData(type, null as any);
      });
    },
  }), [store]);
  
  return utils;
};

/**
 * Hook for dialog analytics
 * @returns Analytics utilities
 */
export const useDialogAnalytics = () => {
  const openDialogs = useOpenDialogs();
  const store = useDialogStore();
  
  const analytics = useMemo(() => ({
    getOpenDialogTypes: () => openDialogs,
    getOpenDialogCount: () => openDialogs.length,
    hasOpenDialogs: () => openDialogs.length > 0,
    getDialogMetrics: () => {
      const metrics: Record<AnalysisType, {
        openCount: number;
        lastOpened?: Date;
        errorCount: number;
      }> = {} as any;
      
      (Object.keys(store.dialogStates) as AnalysisType[]).forEach(type => {
        const state = store.dialogStates[type];
        metrics[type] = {
          openCount: store.openDialogs[type] ? 1 : 0,
          lastOpened: state?.lastUpdated ? new Date(state.lastUpdated) : undefined,
          errorCount: state?.error ? 1 : 0,
        };
      });
      
      return metrics;
    },
  }), [openDialogs, store.dialogStates]);
  
  return analytics;
};