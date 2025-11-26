import { useCallback } from 'react'
import { shallow } from 'zustand/shallow'
import { useDialogStore, dialogSelectors } from '@/stores/analysis-dialog-store'
import type { AnalysisType, AnalysisItem, DialogSettings } from '@/components/analysis/dialogs/types/dialog-types'

// Main hook for analysis dialog store
export function useAnalysisDialog() {
  return useDialogStore(
    useCallback(
      (state) => ({
        // Dialog states
        openDialogs: state.openDialogs,
        dialogData: state.dialogData,
        dialogStates: state.dialogStates,
        settings: state.settings,
        
        // Actions
        openDialog: state.openDialog,
        closeDialog: state.closeDialog,
        closeAllDialogs: state.closeAllDialogs,
        updateDialogData: state.updateDialogData,
        setDialogLoading: state.setDialogLoading,
        setDialogError: state.setDialogError,
        toggleFullscreen: state.toggleFullscreen,
        setDialogWidth: state.setDialogWidth,
        updateSettings: state.updateSettings,
      }),
      []
    )
  )
}

// Hook for specific dialog type
export function useDialog(type: AnalysisType) {
  return useDialogStore(
    useCallback(
      (state) => ({
        isOpen: dialogSelectors.isOpen(type)(state),
        data: dialogSelectors.getData(type)(state),
        state: dialogSelectors.getState(type)(state),
        isLoading: dialogSelectors.isLoading(type)(state),
        error: dialogSelectors.getError(type)(state),
        isFullscreen: dialogSelectors.isFullscreen(type)(state),
      }),
      [type]
    )
  )
}

// Hook for dialog actions
export function useDialogActions() {
  return useDialogStore(
    useCallback(
      (state) => ({
        openDialog: state.openDialog,
        closeDialog: state.closeDialog,
        closeAllDialogs: state.closeAllDialogs,
        updateDialogData: state.updateDialogData,
        setDialogLoading: state.setDialogLoading,
        setDialogError: state.setDialogError,
        toggleFullscreen: state.toggleFullscreen,
        setDialogWidth: state.setDialogWidth,
        updateSettings: state.updateSettings,
      }),
      []
    )
  )
}

// Hook for open dialogs list
export function useOpenDialogs() {
  return useDialogStore(
    useCallback(
      (state) => dialogSelectors.getOpenDialogs(state),
      []
    )
  )
}

// Hook for dialog settings
export function useDialogSettings() {
  return useDialogStore(
    useCallback(
      (state) => dialogSelectors.getSettings(state),
      []
    )
  )
}

// Initialization hook for analysis dialog store
export function useAnalysisDialogInit() {
  // The analysis-dialog-store is automatically initialized when imported
  // No additional initialization needed here since it uses zustand persist
  
  // We can add any setup logic here if needed in the future
  // For now, the store is ready to use immediately
}