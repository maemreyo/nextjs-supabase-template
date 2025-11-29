import React, { useMemo, useCallback } from 'react';
import { AnalysisType, AnalysisItem, ExportFormat } from '../types/dialog-types';
import { WordAnalysis, PhraseAnalysis, SentenceAnalysis, ParagraphAnalysis } from '../../types/analysis-types';
import { WordAnalysisDialog } from '../word/word-analysis-dialog';
import { PhraseAnalysisDialog } from '../phrase/phrase-analysis-dialog';
import { SentenceAnalysisDialog } from '../sentence/sentence-analysis-dialog';
import { ParagraphAnalysisDialog } from '../paragraph/paragraph-analysis-dialog';
import { useDialogState } from '../hooks/use-dialog-state';

/**
 * Dynamic Analysis Dialog Renderer Component
 * 
 * Component này chịu trách nhiệm:
 * - Nhận type và data từ DialogRoot
 * - Switch trên type để render corresponding dialog component
 * - Quản lý state cho từng dialog type
 * - Truyền đúng props vào từng dialog component
 */
interface DynamicAnalysisDialogProps {
  type: AnalysisType;
  data: AnalysisItem | null;
  zIndex?: number;
}

export const DynamicAnalysisDialog: React.FC<DynamicAnalysisDialogProps> = ({
  type,
  data,
  zIndex = 1000
}) => {
  
  // Lấy state và actions cho dialog type hiện tại
  const { state, actions } = useDialogState(type);

  // Memoize the onOpenChange handler to prevent unnecessary re-renders
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      actions.close();
    }
  }, [state.isOpen, actions.close]);

  // Common props cho tất cả dialog types
  const commonDialogProps = useMemo(() => {
    return {
      open: state.isOpen,
      onOpenChange: handleOpenChange,
      analysis: data,
      className: 'pointer-events-auto', // Enable pointer events cho dialog content
      style: { zIndex } // Set z-index cho dialog
    };
  }, [state.isOpen, handleOpenChange, data, zIndex]);

  // Switch trên type để render corresponding dialog
  switch (type) {
    case 'word':
      return (
        <WordAnalysisDialog
          {...commonDialogProps}
          analysis={data as WordAnalysis | null}
          onPronounce={(word: string) => {
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(wordAnalysis: WordAnalysis) => {
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: WordAnalysis, format: ExportFormat) => {
            // Implement export logic
          }}
        />
      );

    case 'phrase':
      return (
        <PhraseAnalysisDialog
          {...commonDialogProps}
          analysis={data as PhraseAnalysis}
          onPronounce={(phrase: string) => {
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(phraseAnalysis: PhraseAnalysis) => {
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: PhraseAnalysis, format: ExportFormat) => {
            // Implement export logic
          }}
        />
      );

    case 'sentence':
      return (
        <SentenceAnalysisDialog
          {...commonDialogProps}
          analysis={data as SentenceAnalysis | null}
          onPronounce={(sentence: string) => {
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(sentenceAnalysis: SentenceAnalysis) => {
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: SentenceAnalysis, format: ExportFormat) => {
            // Implement export logic
          }}
        />
      );

    case 'paragraph':
      return (
        <ParagraphAnalysisDialog
          {...commonDialogProps}
          analysis={data as ParagraphAnalysis | null}
          onPronounce={(paragraph: string) => {
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(paragraphAnalysis: ParagraphAnalysis) => {
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: ParagraphAnalysis, format: ExportFormat) => {
            // Implement export logic
          }}
        />
      );

    default:
      return null;
  }
};

export default DynamicAnalysisDialog;