import { useCallback } from 'react';
import { toast } from 'sonner';
import { AnalysisItem, AnalysisType, isWordAnalysis, isPhraseAnalysis, isSentenceAnalysis, isParagraphAnalysis } from '../../../types/analysis-types';
import { ExportFormat } from '../../types/dialog-types';

interface UseAnalysisActionsProps {
  analysis: AnalysisItem;
  dialogType: AnalysisType;
  setActionLoading: (action: string, loading: boolean) => void;
  onExport?: (analysis: AnalysisItem, format: ExportFormat) => void;
  onShare?: (analysis: AnalysisItem) => void;
  onPrint?: (analysis: AnalysisItem) => void;
  onCopy?: (text: string) => void;
}

interface UseAnalysisActionsReturn {
  onCopy: (text: string) => Promise<void>;
  onPrint: () => Promise<void>;
  onShare: () => Promise<void>;
  onExport: (format: ExportFormat) => Promise<void>;
}

/**
 * Shared hook for analysis dialog actions (copy, print, share, export)
 * Eliminates code duplication across word/phrase/sentence/paragraph dialogs
 */
export const useAnalysisActions = ({
  analysis,
  dialogType,
  setActionLoading,
  onExport,
  onShare,
  onPrint,
  onCopy
}: UseAnalysisActionsProps): UseAnalysisActionsReturn => {
  
  // Format analysis as text based on type
  const formatAnalysisAsText = useCallback((analysisData: AnalysisItem): string => {
    const timestamp = new Date().toLocaleString();
    
    switch (analysisData.analysisType) {
      case 'word':
        const wordAnalysis = analysisData;
        let wordContent = `WORD ANALYSIS REPORT\n`;
        wordContent += `========================\n\n`;
        wordContent += `Word: ${wordAnalysis.word}\n`;
        wordContent += `Generated: ${timestamp}\n\n`;
        
        if (wordAnalysis.definition) {
          wordContent += `DEFINITION:\n${wordAnalysis.definition}\n\n`;
        }
        
        if (wordAnalysis.translation) {
          wordContent += `TRANSLATION:\n${wordAnalysis.translation}\n\n`;
        }
        
        if (wordAnalysis.ipa) {
          wordContent += `PRONUNCIATION (IPA):\n${wordAnalysis.ipa}\n\n`;
        }
        
        if (wordAnalysis.pos) {
          wordContent += `PART OF SPEECH:\n${wordAnalysis.pos}\n\n`;
        }
        
        if (wordAnalysis.cefr) {
          wordContent += `CEFR LEVEL:\n${wordAnalysis.cefr}\n\n`;
        }
        
        if (wordAnalysis.contextMeaning) {
          wordContent += `CONTEXT MEANING:\n${wordAnalysis.contextMeaning}\n\n`;
        }
        
        if (wordAnalysis.exampleSentence) {
          wordContent += `EXAMPLE SENTENCE:\n${wordAnalysis.exampleSentence}\n\n`;
        }
        
        if (wordAnalysis.exampleTranslation) {
          wordContent += `EXAMPLE TRANSLATION:\n${wordAnalysis.exampleTranslation}\n\n`;
        }
        
        wordContent += `\n--- End of Report ---`;
        return wordContent;
        
      case 'phrase':
        const phraseAnalysis = analysisData;
        let phraseContent = `PHRASE ANALYSIS REPORT\n`;
        phraseContent += `========================\n\n`;
        phraseContent += `Phrase: ${phraseAnalysis.phrase}\n`;
        phraseContent += `Generated: ${timestamp}\n\n`;
        
        if (phraseAnalysis.literalMeaning) {
          phraseContent += `LITERAL MEANING:\n${phraseAnalysis.literalMeaning}\n\n`;
        }
        
        if (phraseAnalysis.naturalTranslation) {
          phraseContent += `NATURAL TRANSLATION:\n${phraseAnalysis.naturalTranslation}\n\n`;
        }
        
        if (phraseAnalysis.vietnameseTranslation) {
          phraseContent += `VIETNAMESE TRANSLATION:\n${phraseAnalysis.vietnameseTranslation}\n\n`;
        }
        
        if (phraseAnalysis.partOfSpeech) {
          phraseContent += `PART OF SPEECH:\n${phraseAnalysis.partOfSpeech}\n\n`;
        }
        
        if (phraseAnalysis.usageExamples && phraseAnalysis.usageExamples.length > 0) {
          phraseContent += `USAGE EXAMPLES:\n`;
          phraseAnalysis.usageExamples.forEach((example, index) => {
            phraseContent += `${index + 1}. ${example}\n`;
          });
          phraseContent += '\n';
        }
        
        phraseContent += `\n--- End of Report ---`;
        return phraseContent;
        
      case 'sentence':
        const sentenceAnalysis = analysisData;
        let sentenceContent = `SENTENCE ANALYSIS REPORT\n`;
        sentenceContent += `===========================\n\n`;
        sentenceContent += `Sentence: ${sentenceAnalysis.sentence}\n`;
        sentenceContent += `Generated: ${timestamp}\n\n`;
        
        if (sentenceAnalysis.naturalTranslation) {
          sentenceContent += `NATURAL TRANSLATION:\n${sentenceAnalysis.naturalTranslation}\n\n`;
        }
        
        if (sentenceAnalysis.literalTranslation) {
          sentenceContent += `LITERAL TRANSLATION:\n${sentenceAnalysis.literalTranslation}\n\n`;
        }
        
        if (sentenceAnalysis.mainIdea) {
          sentenceContent += `MAIN IDEA:\n${sentenceAnalysis.mainIdea}\n\n`;
        }
        
        if (sentenceAnalysis.subject) {
          sentenceContent += `SUBJECT:\n${sentenceAnalysis.subject}\n\n`;
        }
        
        if (sentenceAnalysis.mainVerb) {
          sentenceContent += `MAIN VERB:\n${sentenceAnalysis.mainVerb}\n\n`;
        }
        
        if (sentenceAnalysis.object) {
          sentenceContent += `OBJECT:\n${sentenceAnalysis.object}\n\n`;
        }
        
        if (sentenceAnalysis.function) {
          sentenceContent += `FUNCTION:\n${sentenceAnalysis.function}\n\n`;
        }
        
        if (sentenceAnalysis.sentenceType) {
          sentenceContent += `SENTENCE TYPE:\n${sentenceAnalysis.sentenceType}\n\n`;
        }
        
        sentenceContent += `\n--- End of Report ---`;
        return sentenceContent;
        
      case 'paragraph':
        const paragraphAnalysis = analysisData;
        let paragraphContent = `PARAGRAPH ANALYSIS REPORT\n`;
        paragraphContent += `============================\n\n`;
        paragraphContent += `Paragraph: ${paragraphAnalysis.paragraph}\n`;
        paragraphContent += `Generated: ${timestamp}\n\n`;
        
        if (paragraphAnalysis.mainTopic) {
          paragraphContent += `MAIN TOPIC:\n${paragraphAnalysis.mainTopic}\n\n`;
        }
        
        if (paragraphAnalysis.tone) {
          paragraphContent += `TONE:\n${paragraphAnalysis.tone}\n\n`;
        }
        
        if (paragraphAnalysis.targetAudience) {
          paragraphContent += `TARGET AUDIENCE:\n${paragraphAnalysis.targetAudience}\n\n`;
        }
        
        if (paragraphAnalysis.type) {
          paragraphContent += `TYPE:\n${paragraphAnalysis.type}\n\n`;
        }
        
        if (paragraphAnalysis.vocabularyLevel) {
          paragraphContent += `VOCABULARY LEVEL:\n${paragraphAnalysis.vocabularyLevel}\n\n`;
        }
        
        if (paragraphAnalysis.sentimentLabel) {
          paragraphContent += `SENTIMENT:\n${paragraphAnalysis.sentimentLabel}\n\n`;
        }
        
        if (paragraphAnalysis.sentimentIntensity) {
          paragraphContent += `Intensity: ${paragraphAnalysis.sentimentIntensity}\n\n`;
        }
        
        if (paragraphAnalysis.sentimentJustification) {
          paragraphContent += `Justification: ${paragraphAnalysis.sentimentJustification}\n\n`;
        }
        
        if (paragraphAnalysis.keywords && paragraphAnalysis.keywords.length > 0) {
          paragraphContent += `KEYWORDS:\n`;
          paragraphAnalysis.keywords.forEach((keyword, index) => {
            paragraphContent += `${index + 1}. ${keyword}\n`;
          });
          paragraphContent += '\n';
        }
        
        paragraphContent += `\n--- End of Report ---`;
        return paragraphContent;
        
      default:
        return `ANALYSIS REPORT\n================\n\nGenerated: ${timestamp}\n\n--- End of Report ---`;
    }
  }, []);

  // Download file helper
  const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Handle copy action
  const handleCopy = useCallback(async (text: string) => {
    try {
      setActionLoading('copy', true);
      
      // If custom copy handler is provided, use it
      if (onCopy) {
        await onCopy(text);
      } else {
        // Default copy implementation
        await navigator.clipboard.writeText(text);
      }
      
      toast.success('Đã sao chép thành công');
    } catch (error) {
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    } finally {
      setActionLoading('copy', false);
    }
  }, [setActionLoading, onCopy]);

  // Handle print action
  const handlePrint = useCallback(async () => {
    try {
      setActionLoading('print', true);
      
      // If custom print handler is provided, use it
      if (onPrint) {
        await onPrint(analysis);
      } else {
        // Default print implementation
        const printContent = formatAnalysisAsText(analysis);
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
          let primaryText = '';
          if (isWordAnalysis(analysis)) {
            primaryText = analysis.word;
          } else if (isPhraseAnalysis(analysis)) {
            primaryText = analysis.phrase;
          } else if (isSentenceAnalysis(analysis)) {
            primaryText = analysis.sentence;
          } else if (isParagraphAnalysis(analysis)) {
            primaryText = analysis.paragraph;
          }
          const title = `${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Analysis: ${
            dialogType === 'word' ? primaryText :
            dialogType === 'sentence' ? primaryText.substring(0, 30) + '...' :
            dialogType === 'paragraph' ? primaryText.substring(0, 30) + '...' :
            primaryText
          }`;
          
          printWindow.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                  h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                  h2 { color: #555; margin-top: 20px; }
                  pre { white-space: pre-wrap; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
                </style>
              </head>
              <body>
                <pre>${printContent}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        } else {
          throw new Error('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
        }
      }
      
      toast.success('Đã gửi đến máy in');
    } catch (error) {
      toast.error('Không thể in. Vui lòng thử lại.');
    } finally {
      setActionLoading('print', false);
    }
  }, [setActionLoading, onPrint, analysis, formatAnalysisAsText, dialogType]);

  // Handle share action
  const handleShare = useCallback(async () => {
    try {
      setActionLoading('share', true);
      
      // If custom share handler is provided, use it
      if (onShare) {
        await onShare(analysis);
      } else {
        // Default share implementation
        let primaryText = '';
        if (isWordAnalysis(analysis)) {
          primaryText = analysis.word;
        } else if (isPhraseAnalysis(analysis)) {
          primaryText = analysis.phrase;
        } else if (isSentenceAnalysis(analysis)) {
          primaryText = analysis.sentence;
        } else if (isParagraphAnalysis(analysis)) {
          primaryText = analysis.paragraph;
        }
        let shareText = '';
        
        switch (analysis.analysisType) {
          case 'word':
            const wordAnalysis = analysis;
            shareText = `Word: "${wordAnalysis.word}"\nDefinition: ${wordAnalysis.definition || 'N/A'}\nTranslation: ${wordAnalysis.translation || 'N/A'}`;
            break;
          case 'phrase':
            const phraseAnalysis = analysis;
            shareText = `Phrase: "${phraseAnalysis.phrase}"\nLiteral Meaning: ${phraseAnalysis.literalMeaning || 'N/A'}\nNatural Translation: ${phraseAnalysis.naturalTranslation || 'N/A'}`;
            break;
          case 'sentence':
            const sentenceAnalysis = analysis;
            shareText = `Sentence: "${sentenceAnalysis.sentence}"\nTranslation: ${sentenceAnalysis.naturalTranslation || 'N/A'}\nMain Idea: ${sentenceAnalysis.mainIdea || 'N/A'}`;
            break;
          case 'paragraph':
            const paragraphAnalysis = analysis;
            shareText = `Paragraph: "${paragraphAnalysis.paragraph.substring(0, 100)}..."\nMain Topic: ${paragraphAnalysis.mainTopic || 'N/A'}\nSentiment: ${paragraphAnalysis.sentimentLabel || 'N/A'}`;
            break;
          default:
            shareText = primaryText;
        }
        
        const shareUrl = window.location.href;
        
        if (navigator.share) {
          // Use Web Share API if available
          try {
            await navigator.share({
              title: `${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Analysis: ${
                dialogType === 'word' ? primaryText :
                dialogType === 'sentence' ? primaryText.substring(0, 30) + '...' :
                dialogType === 'paragraph' ? primaryText.substring(0, 30) + '...' :
                primaryText
              }`,
              text: shareText,
              url: shareUrl
            });
          } catch (error) {
            // If user cancels or Web Share API fails, fallback to clipboard
            await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
            toast.success('Đã sao chép link chia sẻ vào clipboard');
          }
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
          toast.success('Đã sao chép link chia sẻ vào clipboard');
        }
      }
      
      toast.success('Đã chia sẻ thành công');
    } catch (error) {
      toast.error('Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setActionLoading('share', false);
    }
  }, [setActionLoading, onShare, analysis, dialogType]);

  // Handle export action
  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      setActionLoading('export', true);
      
      // If custom export handler is provided, use it
      if (onExport) {
        await onExport(analysis, format);
      } else {
        // Default export implementation
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        let primaryText = '';
        if (isWordAnalysis(analysis)) {
          primaryText = analysis.word;
        } else if (isPhraseAnalysis(analysis)) {
          primaryText = analysis.phrase;
        } else if (isSentenceAnalysis(analysis)) {
          primaryText = analysis.sentence;
        } else if (isParagraphAnalysis(analysis)) {
          primaryText = analysis.paragraph;
        }
        const sanitizedText = primaryText.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `${dialogType}-analysis-${sanitizedText}-${timestamp}`;
        
        switch (format) {
          case 'txt':
            const textContent = formatAnalysisAsText(analysis);
            downloadFile(textContent, `${filename}.txt`, 'text/plain');
            break;
          case 'json':
            const jsonContent = JSON.stringify(analysis, null, 2);
            downloadFile(jsonContent, `${filename}.json`, 'application/json');
            break;
          case 'pdf':
            // For PDF, we'll use a simple text fallback for now
            // In a real implementation, you would use a library like jsPDF
            const pdfContent = formatAnalysisAsText(analysis);
            downloadFile(pdfContent, `${filename}.pdf`, 'application/pdf');
            break;
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
        
        toast.success(`Đã xuất thành công ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Không thể xuất dữ liệu. Vui lòng thử lại.');
    } finally {
      setActionLoading('export', false);
    }
  }, [setActionLoading, onExport, analysis, formatAnalysisAsText, dialogType, downloadFile]);

  return {
    onCopy: handleCopy,
    onPrint: handlePrint,
    onShare: handleShare,
    onExport: handleExport
  };
};