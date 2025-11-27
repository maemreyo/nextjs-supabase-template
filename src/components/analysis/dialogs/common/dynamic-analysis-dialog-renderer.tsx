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
  console.log('🐛 DEBUG: DynamicAnalysisDialog render', {
    type,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : null,
    zIndex,
    timestamp: new Date().toISOString()
  });
  
  // Lấy state và actions cho dialog type hiện tại
  const { state, actions } = useDialogState(type);

  // Memoize the onOpenChange handler to prevent unnecessary re-renders
  const handleOpenChange = useCallback((open: boolean) => {
    console.log('🐛 DEBUG: DynamicAnalysisDialog onOpenChange', {
      type,
      fromOpen: state.isOpen,
      toOpen: open,
      timestamp: new Date().toISOString()
    });
    
    if (!open) {
      actions.close();
    }
  }, [state.isOpen, actions.close]);

  // Common props cho tất cả dialog types
  const commonDialogProps = useMemo(() => {
    console.log('🐛 DEBUG: DynamicAnalysisDialog commonDialogProps recalculating', {
      type,
      isOpen: state.isOpen,
      hasData: !!data,
      zIndex,
      timestamp: new Date().toISOString()
    });
    
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
            console.log('Pronounce word:', word);
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(wordAnalysis: WordAnalysis) => {
            console.log('Add to vocabulary:', wordAnalysis);
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: WordAnalysis, format: ExportFormat) => {
            console.log('Export word analysis:', analysis, format);
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
            console.log('Pronounce phrase:', phrase);
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(phraseAnalysis: PhraseAnalysis) => {
            console.log('Add to vocabulary:', phraseAnalysis);
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: PhraseAnalysis, format: ExportFormat) => {
            console.log('Export phrase analysis:', analysis, format);
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
            console.log('Pronounce sentence:', sentence);
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(sentenceAnalysis: SentenceAnalysis) => {
            console.log('Add to vocabulary:', sentenceAnalysis);
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: SentenceAnalysis, format: ExportFormat) => {
            console.log('Export sentence analysis:', analysis, format);
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
            console.log('Pronounce paragraph:', paragraph);
            // Implement pronunciation logic
          }}
          onAddToVocabulary={(paragraphAnalysis: ParagraphAnalysis) => {
            console.log('Add to vocabulary:', paragraphAnalysis);
            // Implement add to vocabulary logic
          }}
          onExport={(analysis: ParagraphAnalysis, format: ExportFormat) => {
            console.log('Export paragraph analysis:', analysis, format);
            // Implement export logic
          }}
        />
      );

    default:
      console.warn('Unknown dialog type:', type);
      return null;
  }
};

export default DynamicAnalysisDialog;