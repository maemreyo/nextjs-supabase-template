import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DialogStore,
  DialogGlobalState,
  DialogState,
  DialogSettings,
  AnalysisType,
  AnalysisItem
} from '../components/analysis/dialogs/types/dialog-types';

// Initial dialog states
const initialDialogStates: Record<AnalysisType, DialogState> = {
  word: {
    loading: false,
    error: null,
    fullscreen: false,
    lastUpdated: Date.now(),
    fetching: {
      fullData: false,
      relatedData: false,
    },
    actions: {},
  },
  phrase: {
    loading: false,
    error: null,
    fullscreen: false,
    lastUpdated: Date.now(),
    fetching: {
      fullData: false,
      relatedData: false,
    },
    actions: {},
  },
  sentence: {
    loading: false,
    error: null,
    fullscreen: false,
    lastUpdated: Date.now(),
    fetching: {
      fullData: false,
      relatedData: false,
    },
    actions: {},
  },
  paragraph: {
    loading: false,
    error: null,
    fullscreen: false,
    lastUpdated: Date.now(),
    fetching: {
      fullData: false,
      relatedData: false,
    },
    actions: {},
  },
};

// Initial dialog data
const initialDialogData: Record<AnalysisType, AnalysisItem | null> = {
  word: null,
  phrase: null,
  sentence: null,
  paragraph: null,
};

// Initial dialog open states
const initialOpenDialogs: Record<AnalysisType, boolean> = {
  word: false,
  phrase: false,
  sentence: false,
  paragraph: false,
};

// Initial settings
const initialSettings: DialogSettings = {
  enableAnimations: true,
  enableKeyboardShortcuts: true,
  defaultDialogSize: 'large',
  enableResize: true,
  enableFullscreen: true,
};

// Helper function to safely access dialog states
const getDialogState = (states: Record<AnalysisType, DialogState>, type: AnalysisType): DialogState => {
  return states[type] ?? initialDialogStates[type];
};

// Helper function to safely access dialog data
const getDialogData = (data: Record<AnalysisType, AnalysisItem | null>, type: AnalysisType): AnalysisItem | null => {
  return data[type] || null;
};

// Helper function to safely access dialog open state
const getDialogOpenState = (openDialogs: Record<AnalysisType, boolean>, type: AnalysisType): boolean => {
  return openDialogs[type] || false;
};

// Create the Zustand store
export const useDialogStore = create<DialogStore>()(
  persist(
    (set, get) => ({
      // Initial state
      openDialogs: initialOpenDialogs,
      dialogData: initialDialogData,
      dialogStates: initialDialogStates,
      settings: initialSettings,
      
      // Actions
      openDialog: (type: AnalysisType, data: AnalysisItem) => {
        console.log('🐛 DEBUG: Store openDialog called', {
          type,
          hasData: !!data,
          timestamp: new Date().toISOString()
        });
        
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          console.log('🐛 DEBUG: Store openDialog setting state', {
            type,
            wasOpen: state.openDialogs[type],
            isOpening: true,
            timestamp: new Date().toISOString()
          });
          
          return {
            ...state,
            openDialogs: { ...state.openDialogs, [type]: true },
            dialogData: { ...state.dialogData, [type]: data },
            dialogStates: {
              ...state.dialogStates,
              [type]: {
                ...currentDialogState,
                loading: true,
                error: null,
                lastUpdated: Date.now()
              }
            },
          };
        });
      },
      
      closeDialog: (type: AnalysisType) => {
        console.log('🐛 DEBUG: Store closeDialog called', {
          type,
          timestamp: new Date().toISOString()
        });
        
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          console.log('🐛 DEBUG: Store closeDialog setting state', {
            type,
            wasOpen: state.openDialogs[type],
            isClosing: true,
            timestamp: new Date().toISOString()
          });
          
          return {
            ...state,
            openDialogs: { ...state.openDialogs, [type]: false },
            dialogStates: {
              ...state.dialogStates,
              [type]: {
                ...currentDialogState,
                loading: false,
                error: null,
                lastUpdated: Date.now()
              }
            },
          };
        });
      },
      
      closeAllDialogs: () => {
        set((state) => ({
          ...state,
          openDialogs: {
            word: false,
            phrase: false,
            sentence: false,
            paragraph: false,
          },
        }));
      },
      
      updateDialogData: (type: AnalysisType, data: AnalysisItem) => {
        set((state) => ({
          ...state,
          dialogData: { ...state.dialogData, [type]: data },
        }));
      },
      
      setDialogLoading: (type: AnalysisType, loading: boolean | Partial<DialogState>) => {
       
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          if (typeof loading === 'boolean') {
            // Backward compatibility
            console.log('🐛 DEBUG: Store setDialogLoading (boolean)', {
              type,
              fromLoading: currentDialogState.loading,
              toLoading: loading,
              timestamp: new Date().toISOString()
            });
            
            return {
              ...state,
              dialogStates: {
                ...state.dialogStates,
                [type]: {
                  ...currentDialogState,
                  loading,
                  lastUpdated: Date.now()
                }
              },
            };
          } else {
            // New partial state update
            console.log('🐛 DEBUG: Store setDialogLoading (partial)', {
              type,
              partialState: loading,
              timestamp: new Date().toISOString()
            });
            
            return {
              ...state,
              dialogStates: {
                ...state.dialogStates,
                [type]: {
                  ...currentDialogState,
                  ...loading,
                  lastUpdated: Date.now()
                }
              },
            };
          }
        });
      },
      
      setDialogError: (type: AnalysisType, error: string | null) => {
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          return {
            ...state,
            dialogStates: {
              ...state.dialogStates,
              [type]: {
                ...currentDialogState,
                error,
                lastUpdated: Date.now()
              }
            },
          };
        });
      },
      
      toggleFullscreen: (type: AnalysisType) => {
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          return {
            ...state,
            dialogStates: {
              ...state.dialogStates,
              [type]: {
                ...currentDialogState,
                fullscreen: !currentDialogState.fullscreen,
                lastUpdated: Date.now()
              }
            },
          };
        });
      },
      
      setDialogWidth: (type: AnalysisType, width: number) => {
        set((state) => {
          const currentDialogState = getDialogState(state.dialogStates, type);
          
          return {
            ...state,
            dialogStates: {
              ...state.dialogStates,
              [type]: {
                ...currentDialogState,
                resizedWidth: width,
                lastUpdated: Date.now()
              }
            },
          };
        });
      },
      
      updateSettings: (newSettings: Partial<DialogSettings>) => {
        set((state) => ({
          ...state,
          settings: { ...state.settings, ...newSettings },
        }));
      },
    }),
    {
      name: 'dialog-store',
      partialize: (state) => ({
        openDialogs: state.openDialogs,
        settings: state.settings,
      }),
    }
  )
);

// Selectors for optimized state access
export const dialogSelectors = {
  isOpen: (type: AnalysisType) => (state: DialogGlobalState) => getDialogOpenState(state.openDialogs, type),
  getData: (type: AnalysisType) => (state: DialogGlobalState) => getDialogData(state.dialogData, type),
  getState: (type: AnalysisType) => (state: DialogGlobalState) => getDialogState(state.dialogStates, type),
  isLoading: (type: AnalysisType) => (state: DialogGlobalState) => getDialogState(state.dialogStates, type)?.loading || false,
  getError: (type: AnalysisType) => (state: DialogGlobalState) => getDialogState(state.dialogStates, type)?.error || null,
  isFullscreen: (type: AnalysisType) => (state: DialogGlobalState) => getDialogState(state.dialogStates, type)?.fullscreen || false,
  getOpenDialogs: (state: DialogGlobalState) => {
    return Object.entries(state.openDialogs)
      .filter(([_, open]) => open)
      .map(([type]) => type as AnalysisType);
  },
  getSettings: (state: DialogGlobalState) => state.settings,
};

// Utility functions for store operations
export const dialogStoreUtils = {
  // Get current store state
  getState: () => useDialogStore.getState(),
  
  // Subscribe to store changes
  subscribe: (callback: (state: DialogGlobalState) => void) => {
    return useDialogStore.subscribe(callback);
  },
  
  // Reset store to initial state
  reset: () => {
    useDialogStore.setState({
      openDialogs: initialOpenDialogs,
      dialogData: initialDialogData,
      dialogStates: initialDialogStates,
      settings: initialSettings,
    });
  },
  
  // Reset specific dialog
  resetDialog: (type: AnalysisType) => {
    useDialogStore.setState((state) => ({
      ...state,
      openDialogs: { ...state.openDialogs, [type]: false },
      dialogData: { ...state.dialogData, [type]: null },
      dialogStates: { 
        ...state.dialogStates, 
        [type]: initialDialogStates[type] 
      },
    }));
  },
  
  // Check if any dialog is open
  hasOpenDialogs: () => {
    const state = useDialogStore.getState();
    return Object.values(state.openDialogs).some(open => open);
  },
  
  // Get count of open dialogs
  getOpenDialogCount: () => {
    const state = useDialogStore.getState();
    return Object.values(state.openDialogs).filter(open => open).length;
  },
  
  // Get all open dialog types
  getOpenDialogTypes: (): AnalysisType[] => {
    const state = useDialogStore.getState();
    return Object.entries(state.openDialogs)
      .filter(([_, open]) => open)
      .map(([type]) => type as AnalysisType);
  },
  
  // Close all dialogs except specified type
  closeAllExcept: (exceptType: AnalysisType) => {
    const state = useDialogStore.getState();
    const newOpenDialogs: Record<AnalysisType, boolean> = { ...state.openDialogs };
    
    (Object.keys(newOpenDialogs) as AnalysisType[]).forEach(type => {
      if (type !== exceptType) {
        newOpenDialogs[type] = false;
      }
    });
    
    useDialogStore.setState({ openDialogs: newOpenDialogs });
  },
  
  // Toggle dialog (open if closed, close if open)
  toggleDialog: (type: AnalysisType, data?: AnalysisItem) => {
    const state = useDialogStore.getState();
    
    if (getDialogOpenState(state.openDialogs, type)) {
      useDialogStore.getState().closeDialog(type);
    } else if (data) {
      useDialogStore.getState().openDialog(type, data);
    }
  },
  
  // Set multiple dialog states at once
  setMultipleDialogStates: (states: Partial<Record<AnalysisType, Partial<DialogState>>>) => {
    const currentState = useDialogStore.getState();
    const newDialogStates: Record<AnalysisType, DialogState> = { ...currentState.dialogStates };
    
    (Object.keys(states) as AnalysisType[]).forEach(type => {
    const stateUpdate = states[type];
    if (stateUpdate) {
      const currentState = newDialogStates[type] || initialDialogStates[type];
      newDialogStates[type] = {
        ...currentState,
        loading: stateUpdate.loading ?? currentState.loading,
        error: stateUpdate.error ?? currentState.error,
        fullscreen: stateUpdate.fullscreen ?? currentState.fullscreen,
        resizedWidth: stateUpdate.resizedWidth ?? currentState.resizedWidth,
        position: stateUpdate.position ?? currentState.position,
        lastUpdated: Date.now(),
      };
    }
  });
    
    useDialogStore.setState({ dialogStates: newDialogStates });
  },
  
  // Batch update dialog data
  updateMultipleDialogData: (data: Partial<Record<AnalysisType, AnalysisItem>>) => {
    const currentState = useDialogStore.getState();
    useDialogStore.setState({
      dialogData: { ...currentState.dialogData, ...data },
    });
  },
};

// Export types for external use
export type { DialogStore, DialogGlobalState, DialogState, DialogSettings };