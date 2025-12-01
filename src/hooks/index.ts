// Export all hooks from the hooks directory
export * from './use-auth';
export * from './use-supabase-query';
export * from './useAIService';
export * from './useAIUsageOptimized';
export * from './useAnalysisActions';
export * from './useAnalysisLogic';
export * from './useAnalysisPageLogic';
export * from './useAnalysisSave';
export * from './useDeleteAnalysis';
export * from './useEditorState';
export * from './useKeyboardShortcuts';
export * from './useNotifications';
export * from './useOptimizedAnalysis';
/*
 * DEPRECATED: Các hooks này đã được thay thế bởi hệ thống highlights mới
 * Giữ lại để tham khảo, có thể khôi phục sau này nếu cần
 *
 * These hooks have been replaced by the new highlights system
 * Kept for reference, can be restored later if needed
 */
// export * from './useParagraphAnalysis';
// export * from './useParagraphAnalyses';
// export * from './usePhraseAnalysis';
// export * from './usePhraseAnalyses';
// export * from './useSavedAnalyses';
// export * from './useSavedAnalysisDetail';
// export * from './useSentenceAnalysis';
// export * from './useSentenceAnalyses';
export * from './useSessionAutoSave';
export * from './useSessionData';
export * from './useSessionPageHandling';
export * from './useSessionPageHandlers';
export * from './useSessions';
export * from './useTipTapAutoSave';
export * from './useTipTapEditor';
export * from './useTipTapSelection';
// export * from './useWordAnalysis';
export { useHighlights, type Highlight, type CreateHighlightData, type UpdateHighlightData, type HighlightFilters } from './useHighlights';
// export * from './useWordAnalyses';