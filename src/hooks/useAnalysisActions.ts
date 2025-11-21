import { useCallback } from 'react';
import { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

type AnalysisType = 'word' | 'sentence' | 'paragraph';

interface AnalysisMetadata {
  [key: string]: any;
  exportedAt?: string;
  printedAt?: string;
  sharedAt?: string;
}

interface UseAnalysisActionsProps {
  analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: AnalysisType;
  contentRef: React.RefObject<HTMLDivElement>;
  metadata?: AnalysisMetadata;
}

interface ExportOptions {
  includeMetadata?: boolean;
  filename?: string;
}

interface PrintOptions {
  title?: string;
  includeStyles?: boolean;
  customStyles?: string;
}

interface ShareResult {
  success: boolean;
  method: 'share' | 'clipboard' | 'error';
  message?: string;
}

export function useAnalysisActions({
  analysis,
  analysisType,
  contentRef,
  metadata = {}
}: UseAnalysisActionsProps) {

  const handleExport = useCallback((options: ExportOptions = {}) => {
    if (!analysis) {
      console.warn('No analysis data available for export');
      return;
    }

    const {
      includeMetadata = true,
      filename
    } = options;

    try {
      const exportData = {
        analysis,
        ...(includeMetadata && {
          metadata: {
            ...metadata,
            analysisType,
            exportedAt: new Date().toISOString()
          }
        })
      };

      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `analysis-${analysisType}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Analysis exported successfully: ${a.download}`);
    } catch (error) {
      console.error('Error exporting analysis:', error);
      throw new Error('Failed to export analysis');
    }
  }, [analysis, analysisType, metadata]);

  const handlePrint = useCallback((options: PrintOptions = {}) => {
    if (!contentRef.current) {
      console.warn('No content reference available for printing');
      return;
    }

    const {
      title = `Analysis Report - ${analysisType.toUpperCase()}`,
      includeStyles = true,
      customStyles = ''
    } = options;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }

      let styles = '';
      if (includeStyles) {
        styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            } catch (e) {
              console.warn('Could not access stylesheet:', e);
              return '';
            }
          })
          .join('\n');
      }

      const defaultStyles = `
        body { 
          font-family: system-ui, -apple-system, sans-serif; 
          padding: 40px; 
          color: #000; 
          line-height: 1.5;
          max-width: 100%;
        }
        .no-print { display: none !important; }
        .print-break { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; }
        h1 { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .content { margin-top: 20px; }
        @media print {
          body { padding: 20px; }
          h1 { page-break-after: avoid; }
        }
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>${styles}</style>
            <style>${defaultStyles}</style>
            <style>${customStyles}</style>
            <meta charset="utf-8">
          </head>
          <body>
            <h1>${title}</h1>
            <div class="content">
              ${contentRef.current.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  // Uncomment the line below to close the window after printing
                  // window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      console.log('Print window opened successfully');
    } catch (error) {
      console.error('Error preparing print:', error);
      throw new Error('Failed to prepare print view');
    }
  }, [contentRef, analysisType]);

  const handleShare = useCallback(async (): Promise<ShareResult> => {
    if (!analysis) {
      return {
        success: false,
        method: 'error',
        message: 'No analysis data available for sharing'
      };
    }

    try {
      // Create summary text based on analysis type
      let shareText = '';
      let shareTitle = `AI Analysis Result - ${analysisType}`;
      
      if (analysisType === 'word') {
        const wordAnalysis = analysis as WordAnalysis;
        shareText = `Word: ${wordAnalysis.meta.word} (${wordAnalysis.meta.pos})\nMeaning: ${wordAnalysis.definitions.vietnamese_translation}\nCEFR Level: ${wordAnalysis.meta.cefr}`;
      } else if (analysisType === 'sentence') {
        const sentenceAnalysis = analysis as SentenceAnalysis;
        shareText = `Sentence Analysis:\nMain Idea: ${sentenceAnalysis.semantics.main_idea}\nTranslation: ${sentenceAnalysis.translation.natural}\nComplexity: ${sentenceAnalysis.meta.complexity_level}`;
      } else if (analysisType === 'paragraph') {
        const paragraphAnalysis = analysis as ParagraphAnalysis;
        shareText = `Paragraph Analysis:\nTopic: ${paragraphAnalysis.content_analysis.main_topic}\nLogic Score: ${paragraphAnalysis.coherence_and_cohesion.logic_score}/100\nType: ${paragraphAnalysis.meta.type}`;
      }

      // Try Web Share API first (mobile-friendly)
      if (navigator.share && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText
          });
          return {
            success: true,
            method: 'share',
            message: 'Shared successfully using Web Share API'
          };
        } catch (shareError) {
          // User cancelled or share failed, fall back to clipboard
          console.log('Web Share API failed or cancelled, falling back to clipboard:', shareError);
        }
      }

      // Fallback to clipboard
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareText);
        return {
          success: true,
          method: 'clipboard',
          message: 'Analysis copied to clipboard'
        };
      }

      // Final fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return {
          success: true,
          method: 'clipboard',
          message: 'Analysis copied to clipboard (legacy method)'
        };
      } catch (clipboardError) {
        document.body.removeChild(textArea);
        throw clipboardError;
      }
    } catch (error) {
      console.error('Error sharing analysis:', error);
      return {
        success: false,
        method: 'error',
        message: error instanceof Error ? error.message : 'Failed to share analysis'
      };
    }
  }, [analysis, analysisType]);

  return {
    handleExport,
    handlePrint,
    handleShare
  };
}

export type { 
  UseAnalysisActionsProps, 
  ExportOptions, 
  PrintOptions, 
  ShareResult, 
  AnalysisMetadata 
};