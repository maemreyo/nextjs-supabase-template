import { useCallback, useState } from 'react';
import { useDialogState } from './use-dialog-state';
import { 
  UseDialogActionsReturn, 
  AnalysisType, 
  AnalysisItem, 
  ExportFormat 
} from '../types/dialog-types';

/**
 * Hook for dialog actions
 * @param type - The analysis type
 * @param analysis - The analysis item
 * @returns Dialog actions and loading/error states
 */
export const useDialogActions = (type: AnalysisType, analysis: AnalysisItem): UseDialogActionsReturn => {
  const { actions } = useDialogState(type);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  
  const handleExport = useCallback(async (format: ExportFormat) => {
    const loadingKey = `export-${format}`;
    
    try {
      setLoading(prev => ({ ...prev, [loadingKey]: true }));
      
      // Create export data based on analysis type
      const exportData = createExportData(analysis, format);
      
      // Trigger download
      await downloadFile(exportData, format, analysis);
      
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    } catch (err) {
      const errorMessage = `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(prev => ({ ...prev, [loadingKey]: null }));
      setError(prev => ({ ...prev, export: errorMessage }));
      
    }
  }, [analysis, type, actions]);
  
  const handleShare = useCallback(async () => {
    const loadingKey = 'share';
    
    try {
      setLoading(prev => ({ ...prev, [loadingKey]: true }));
      
      // Create share data
      const shareData = createShareData(analysis);
      
      // Try native share API first
      if (navigator.share && 'canShare' in navigator && (navigator as any).canShare({ data: shareData })) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.text);
        
        // Show success message
        showSuccessMessage('Content copied to clipboard!');
      }
      
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
      setError(prev => ({ ...prev, share: null }));
    } catch (err) {
      const errorMessage = `Share failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(prev => ({ ...prev, share: errorMessage }));
      
    }
  }, [analysis, type]);
  
  const handlePrint = useCallback(() => {
    try {
      // Create print content
      const printContent = createPrintContent(analysis);
      
      // Create new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      const errorMessage = `Print failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(prev => ({ ...prev, print: errorMessage }));
      
    }
  }, [analysis, type]);
  
  const handleCopy = useCallback(async () => {
    try {
      // Get text content based on analysis type
      const textToCopy = getTextContent(analysis);
      
      await navigator.clipboard.writeText(textToCopy);
      
      // Show success message
      showSuccessMessage('Content copied to clipboard!');
    } catch (err) {
      const errorMessage = `Copy failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(prev => ({ ...prev, copy: errorMessage }));
      
    }
  }, [analysis, type]);
  
  const handlePronounce = useCallback((text?: string) => {
    if (!text) return;
    
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      const errorMessage = `Pronunciation failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(prev => ({ ...prev, pronounce: errorMessage }));
      
    }
  }, []);
  
  return {
    actions: {
      handleExport,
      handleShare,
      handlePrint,
      handleCopy,
      handlePronounce,
    },
    loading,
    error,
  };
};

/**
 * Create export data based on analysis type and format
 */
const createExportData = (analysis: AnalysisItem, format: ExportFormat): any => {
  switch (format) {
    case 'json':
      return JSON.stringify(analysis, null, 2);
    case 'csv':
      return createCSVData(analysis);
    case 'txt':
      return createTextData(analysis);
    case 'html':
      return createHTMLData(analysis);
    case 'pdf':
      return createPDFData(analysis);
    default:
      return analysis;
  }
};

/**
 * Create share data based on analysis type
 */
const createShareData = (analysis: AnalysisItem): ShareData => {
  const text = getTextContent(analysis);
  const title = getAnalysisTitle(analysis);
  
  return {
    title: `${title} - Analysis`,
    text: text,
    url: window.location.href,
  };
};

/**
 * Create print content based on analysis type
 */
const createPrintContent = (analysis: AnalysisItem): string => {
  const title = getAnalysisTitle(analysis);
  const content = createPrintableContent(analysis);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
          .metadata { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
          ${content}
        </div>
      </body>
    </html>
  `;
};

/**
 * Get text content based on analysis type
 */
const getTextContent = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return `Word: ${analysis.word}\nTranslation: ${analysis.translation || ''}\nDefinition: ${analysis.definition || ''}`;
    case 'phrase':
      return `Phrase: ${analysis.phrase}\nTranslation: ${analysis.naturalTranslation || ''}\nMeaning: ${analysis.literalMeaning || ''}`;
    case 'sentence':
      return `Sentence: ${analysis.sentence}\nTranslation: ${analysis.naturalTranslation || ''}\nMain Idea: ${analysis.mainIdea || ''}`;
    case 'paragraph':
      return `Paragraph: ${analysis.paragraph}\nMain Topic: ${analysis.mainTopic || ''}\nTone: ${analysis.tone || ''}`;
    default:
      return JSON.stringify(analysis, null, 2);
  }
};

/**
 * Get analysis title based on type
 */
const getAnalysisTitle = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return `Word Analysis: ${analysis.word}`;
    case 'phrase':
      return `Phrase Analysis: ${analysis.phrase}`;
    case 'sentence':
      return `Sentence Analysis: ${analysis.sentence}`;
    case 'paragraph':
      return `Paragraph Analysis`;
    default:
      return 'Analysis';
  }
};

/**
 * Create printable content based on analysis type
 */
const createPrintableContent = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return createWordPrintContent(analysis);
    case 'phrase':
      return createPhrasePrintContent(analysis);
    case 'sentence':
      return createSentencePrintContent(analysis);
    case 'paragraph':
      return createParagraphPrintContent(analysis);
    default:
      return JSON.stringify(analysis, null, 2);
  }
};

/**
 * Create word print content
 */
const createWordPrintContent = (analysis: any): string => {
  return `
    <div class="metadata">
      <h3>Word Information</h3>
      <p><strong>Word:</strong> ${analysis.word}</p>
      ${analysis.ipa ? `<p><strong>IPA:</strong> ${analysis.ipa}</p>` : ''}
      ${analysis.pos ? `<p><strong>Part of Speech:</strong> ${analysis.pos}</p>` : ''}
      ${analysis.cefr ? `<p><strong>CEFR Level:</strong> ${analysis.cefr}</p>` : ''}
    </div>
    <div class="metadata">
      <h3>Definition & Translation</h3>
      <p><strong>Definition:</strong> ${analysis.definition || 'N/A'}</p>
      <p><strong>Translation:</strong> ${analysis.translation || 'N/A'}</p>
    </div>
    ${analysis.exampleSentence ? `
    <div class="metadata">
      <h3>Example</h3>
      <p><strong>Sentence:</strong> ${analysis.exampleSentence}</p>
      <p><strong>Translation:</strong> ${analysis.exampleTranslation || 'N/A'}</p>
    </div>
    ` : ''}
  `;
};

/**
 * Create phrase print content
 */
const createPhrasePrintContent = (analysis: any): string => {
  return `
    <div class="metadata">
      <h3>Phrase Information</h3>
      <p><strong>Phrase:</strong> ${analysis.phrase}</p>
      <p><strong>Natural Translation:</strong> ${analysis.naturalTranslation || 'N/A'}</p>
      <p><strong>Literal Meaning:</strong> ${analysis.literalMeaning || 'N/A'}</p>
    </div>
    ${analysis.phraseType ? `
    <div class="metadata">
      <h3>Type & Pattern</h3>
      <p><strong>Type:</strong> ${analysis.phraseType}</p>
      <p><strong>Grammatical Pattern:</strong> ${analysis.grammaticalPattern || 'N/A'}</p>
    </div>
    ` : ''}
  `;
};

/**
 * Create sentence print content
 */
const createSentencePrintContent = (analysis: any): string => {
  return `
    <div class="metadata">
      <h3>Sentence Information</h3>
      <p><strong>Sentence:</strong> ${analysis.sentence}</p>
      <p><strong>Natural Translation:</strong> ${analysis.naturalTranslation || 'N/A'}</p>
      <p><strong>Main Idea:</strong> ${analysis.mainIdea || 'N/A'}</p>
    </div>
    ${analysis.subject || analysis.mainVerb || analysis.object ? `
    <div class="metadata">
      <h3>Sentence Structure</h3>
      ${analysis.subject ? `<p><strong>Subject:</strong> ${analysis.subject}</p>` : ''}
      ${analysis.mainVerb ? `<p><strong>Main Verb:</strong> ${analysis.mainVerb}</p>` : ''}
      ${analysis.object ? `<p><strong>Object:</strong> ${analysis.object}</p>` : ''}
    </div>
    ` : ''}
  `;
};

/**
 * Create paragraph print content
 */
const createParagraphPrintContent = (analysis: any): string => {
  return `
    <div class="metadata">
      <h3>Paragraph Information</h3>
      <p><strong>Main Topic:</strong> ${analysis.mainTopic || 'N/A'}</p>
      <p><strong>Tone:</strong> ${analysis.tone || 'N/A'}</p>
      <p><strong>Target Audience:</strong> ${analysis.targetAudience || 'N/A'}</p>
      <p><strong>Type:</strong> ${analysis.type || 'N/A'}</p>
    </div>
    ${analysis.sentimentLabel ? `
    <div class="metadata">
      <h3>Sentiment Analysis</h3>
      <p><strong>Sentiment:</strong> ${analysis.sentimentLabel}</p>
      ${analysis.sentimentIntensity ? `<p><strong>Intensity:</strong> ${analysis.sentimentIntensity}</p>` : ''}
      ${analysis.sentimentJustification ? `<p><strong>Justification:</strong> ${analysis.sentimentJustification}</p>` : ''}
    </div>
    ` : ''}
    ${analysis.keywords && analysis.keywords.length > 0 ? `
    <div class="metadata">
      <h3>Keywords</h3>
      <p>${analysis.keywords.join(', ')}</p>
    </div>
    ` : ''}
  `;
};

/**
 * Create CSV data
 */
const createCSVData = (analysis: AnalysisItem): string => {
  const headers = ['Type', 'Content', 'Translation', 'Additional Info'];
  const rows = [
    [analysis.analysisType, getContentField(analysis), getTranslationField(analysis), getAdditionalInfo(analysis)]
  ];
  
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

/**
 * Create text data
 */
const createTextData = (analysis: AnalysisItem): string => {
  return `
${getAnalysisTitle(analysis)}
Generated: ${new Date().toLocaleString()}

${getTextContent(analysis)}
  `.trim();
};

/**
 * Create HTML data
 */
const createHTMLData = (analysis: AnalysisItem): string => {
  return createPrintContent(analysis);
};

/**
 * Create PDF data (placeholder - would need PDF library)
 */
const createPDFData = (analysis: AnalysisItem): any => {
  // This would typically use a library like jsPDF
  // For now, return the printable content
  return {
    content: createPrintContent(analysis),
    filename: `${getAnalysisTitle(analysis)}.pdf`,
  };
};

/**
 * Get content field based on analysis type
 */
const getContentField = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return analysis.word || '';
    case 'phrase':
      return analysis.phrase || '';
    case 'sentence':
      return analysis.sentence || '';
    case 'paragraph':
      return analysis.paragraph || '';
    default:
      return '';
  }
};

/**
 * Get translation field based on analysis type
 */
const getTranslationField = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return analysis.translation || '';
    case 'phrase':
      return analysis.naturalTranslation || '';
    case 'sentence':
      return analysis.naturalTranslation || '';
    case 'paragraph':
      return ''; // Paragraph doesn't have direct translation
    default:
      return '';
  }
};

/**
 * Get additional info based on analysis type
 */
const getAdditionalInfo = (analysis: AnalysisItem): string => {
  switch (analysis.analysisType) {
    case 'word':
      return `${analysis.definition || ''} (${analysis.pos || ''})`;
    case 'phrase':
      return `${analysis.literalMeaning || ''} (${analysis.phraseType || ''})`;
    case 'sentence':
      return `${analysis.mainIdea || ''} (${analysis.function || ''})`;
    case 'paragraph':
      return `${analysis.mainTopic || ''} (${analysis.tone || ''})`;
    default:
      return '';
  }
};

/**
 * Download file utility
 */
const downloadFile = async (data: any, format: ExportFormat, analysis: AnalysisItem): Promise<void> => {
  const filename = `${getAnalysisTitle(analysis)}.${format}`;
  
  let content: string | Blob;
  let mimeType: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      break;
    case 'csv':
      content = data;
      mimeType = 'text/csv';
      break;
    case 'txt':
      content = data;
      mimeType = 'text/plain';
      break;
    case 'html':
      content = data;
      mimeType = 'text/html';
      break;
    case 'pdf':
      // For PDF, data might be an object with content property
      if (data.content) {
        content = data.content;
        mimeType = 'application/pdf';
      } else {
        // Fallback to HTML if PDF generation not available
        content = createPrintContent(analysis);
        mimeType = 'text/html';
      }
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Create blob and download
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content;
    
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Show success message utility
 */
const showSuccessMessage = (message: string): void => {
  // This could integrate with a toast/notification system
  
  // For now, just use alert
  // In a real app, this would use a proper notification system
  if (typeof window !== 'undefined') {
    alert(message);
  }
};

/**
 * Share data interface
 */
interface ShareData {
  title: string;
  text: string;
  url?: string;
}