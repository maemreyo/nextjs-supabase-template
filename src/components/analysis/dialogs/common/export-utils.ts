import { ExportFormat } from '../types/dialog-types';
import { AnalysisItem, WordAnalysis, PhraseAnalysis, SentenceAnalysis, ParagraphAnalysis } from '../../types/analysis-types';
import { sanitizeAnalysisForHandlers } from '@/lib/analysis-utils';
import { analysisLogger, clientLogger } from '@/services/logger';

/**
 * Generic download file helper
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
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
 * Generic share helper
 */
export const shareAnalysis = async (analysis: AnalysisItem, shareText: string, title: string) => {
  const shareUrl = window.location.href;
  
  try {
    if (navigator.share) {
      // Use Web Share API if available
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
    }
    clientLogger.info('Analysis shared successfully', { type: analysis.analysisType });
  } catch (error) {
    clientLogger.warn('Share failed or cancelled', { error, type: analysis.analysisType });
    // Fallback to clipboard if share fails
    try {
      await navigator.clipboard.writeText(`${shareText}\n\nRead more: ${shareUrl}`);
      clientLogger.info('Fallback to clipboard successful', { type: analysis.analysisType });
    } catch (clipboardError) {
      clientLogger.error('Clipboard fallback failed', { error: clipboardError, type: analysis.analysisType });
      throw clipboardError;
    }
  }
};

/**
 * Generic print helper
 */
export const printAnalysis = (analysis: AnalysisItem, printContent: string, title: string) => {
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
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
    clientLogger.info('Analysis printed successfully', { type: analysis.analysisType });
  } else {
    const error = new Error('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
    clientLogger.error('Failed to open print window', { error, type: analysis.analysisType });
    throw error;
  }
};

/**
 * Generic export handler
 */
export const exportAnalysis = async (
  analysis: AnalysisItem, 
  format: ExportFormat, 
  formatAsText: (analysis: AnalysisItem) => string
) => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  let filename = '';
  let content = '';
  let mimeType = '';
  
  // Generate filename based on analysis type
  switch (sanitized.analysis_type) {
    case 'word':
      const word = sanitized.word || (analysis as WordAnalysis).word;
      filename = `word-analysis-${word.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
      break;
    case 'phrase':
      const phrase = sanitized.phrase || (analysis as PhraseAnalysis).phrase;
      filename = `phrase-analysis-${phrase.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
      break;
    case 'sentence':
      const sentence = sanitized.sentence || (analysis as SentenceAnalysis).sentence;
      filename = `sentence-analysis-${sentence.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
      break;
    case 'paragraph':
      const paragraph = sanitized.paragraph || (analysis as ParagraphAnalysis).paragraph;
      filename = `paragraph-analysis-${paragraph.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}`;
      break;
    default:
      filename = `analysis-${sanitized.id || 'unknown'}-${timestamp}`;
  }
  
  switch (format) {
    case 'txt':
      content = formatAsText(analysis);
      mimeType = 'text/plain';
      filename += '.txt';
      break;
    case 'json':
      content = JSON.stringify(analysis, null, 2);
      mimeType = 'application/json';
      filename += '.json';
      break;
    case 'pdf':
      // For PDF, we'll use a simple text fallback for now
      // In a real implementation, you would use a library like jsPDF
      content = formatAsText(analysis);
      mimeType = 'application/pdf';
      filename += '.pdf';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  downloadFile(content, filename, mimeType);
  clientLogger.info('Analysis exported successfully', { type: analysis.analysisType, format, filename });
};

/**
 * Format word analysis as text
 */
export const formatWordAsText = (analysis: WordAnalysis): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  const word = sanitized.analysis_type === 'word' ? sanitized.word : analysis.word;
  let content = `WORD ANALYSIS REPORT\n`;
  content += `========================\n\n`;
  content += `Word: ${word}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (analysis.definition) {
    content += `DEFINITION:\n${analysis.definition}\n\n`;
  }
  
  if (analysis.translation) {
    content += `TRANSLATION:\n${analysis.translation}\n\n`;
  }
  
  if (analysis.ipa) {
    content += `PRONUNCIATION (IPA):\n${analysis.ipa}\n\n`;
  }
  
  if (analysis.pos) {
    content += `PART OF SPEECH:\n${analysis.pos}\n\n`;
  }
  
  if (analysis.cefr) {
    content += `CEFR LEVEL:\n${analysis.cefr}\n\n`;
  }
  
  if (analysis.contextMeaning) {
    content += `CONTEXT MEANING:\n${analysis.contextMeaning}\n\n`;
  }
  
  if (analysis.exampleSentence) {
    content += `EXAMPLE SENTENCE:\n${analysis.exampleSentence}\n\n`;
  }
  
  if (analysis.exampleTranslation) {
    content += `EXAMPLE TRANSLATION:\n${analysis.exampleTranslation}\n\n`;
  }
  
  if (analysis.tone) {
    content += `TONE:\n${analysis.tone}\n\n`;
  }
  
  content += `\n--- End of Report ---`;
  return content;
};

/**
 * Format phrase analysis as text
 */
export const formatPhraseAsText = (analysis: PhraseAnalysis): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  const phrase = sanitized.analysis_type === 'phrase' ? sanitized.phrase : analysis.phrase;
  let content = `PHRASE ANALYSIS REPORT\n`;
  content += `========================\n\n`;
  content += `Phrase: ${phrase}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (analysis.literalMeaning) {
    content += `LITERAL MEANING:\n${analysis.literalMeaning}\n\n`;
  }
  
  if (analysis.naturalTranslation) {
    content += `NATURAL TRANSLATION:\n${analysis.naturalTranslation}\n\n`;
  }
  
  if (analysis.vietnameseTranslation) {
    content += `VIETNAMESE TRANSLATION:\n${analysis.vietnameseTranslation}\n\n`;
  }
  
  if (analysis.partOfSpeech) {
    content += `PART OF SPEECH:\n${analysis.partOfSpeech}\n\n`;
  }
  
  if (analysis.usageExamples && analysis.usageExamples.length > 0) {
    content += `USAGE EXAMPLES:\n`;
    analysis.usageExamples.forEach((example, index) => {
      content += `${index + 1}. ${example}\n`;
    });
    content += '\n';
  }
  
  if (analysis.synonyms && analysis.synonyms.length > 0) {
    content += `SYNONYMS:\n`;
    analysis.synonyms.forEach((synonym, index) => {
      content += `${index + 1}. ${synonym}\n`;
    });
    content += '\n';
  }
  
  if (analysis.antonyms && analysis.antonyms.length > 0) {
    content += `ANTONYMS:\n`;
    analysis.antonyms.forEach((antonym, index) => {
      content += `${index + 1}. ${antonym}\n`;
    });
    content += '\n';
  }
  
  if (analysis.variations && analysis.variations.length > 0) {
    content += `VARIATIONS:\n`;
    analysis.variations.forEach((variation, index) => {
      content += `${index + 1}. ${variation}\n`;
    });
    content += '\n';
  }
  
  content += `\n--- End of Report ---`;
  return content;
};

/**
 * Format sentence analysis as text
 */
export const formatSentenceAsText = (analysis: SentenceAnalysis): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  const sentence = sanitized.analysis_type === 'sentence' ? sanitized.sentence : analysis.sentence;
  let content = `SENTENCE ANALYSIS REPORT\n`;
  content += `===========================\n\n`;
  content += `Sentence: ${sentence}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (analysis.naturalTranslation) {
    content += `NATURAL TRANSLATION:\n${analysis.naturalTranslation}\n\n`;
  }
  
  if (analysis.literalTranslation) {
    content += `LITERAL TRANSLATION:\n${analysis.literalTranslation}\n\n`;
  }
  
  if (analysis.mainIdea) {
    content += `MAIN IDEA:\n${analysis.mainIdea}\n\n`;
  }
  
  if (analysis.subject) {
    content += `SUBJECT:\n${analysis.subject}\n\n`;
  }
  
  if (analysis.mainVerb) {
    content += `MAIN VERB:\n${analysis.mainVerb}\n\n`;
  }
  
  if (analysis.object) {
    content += `OBJECT:\n${analysis.object}\n\n`;
  }
  
  if (analysis.function) {
    content += `FUNCTION:\n${analysis.function}\n\n`;
  }
  
  if (analysis.sentenceType) {
    content += `SENTENCE TYPE:\n${analysis.sentenceType}\n\n`;
  }
  
  if (analysis.complexityLevel) {
    content += `COMPLEXITY LEVEL:\n${analysis.complexityLevel}\n\n`;
  }
  
  if (analysis.sentiment) {
    content += `SENTIMENT:\n${analysis.sentiment}\n\n`;
  }
  
  content += `\n--- End of Report ---`;
  return content;
};

/**
 * Format paragraph analysis as text
 */
export const formatParagraphAsText = (analysis: ParagraphAnalysis): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  const paragraph = sanitized.analysis_type === 'paragraph' ? sanitized.paragraph : analysis.paragraph;
  let content = `PARAGRAPH ANALYSIS REPORT\n`;
  content += `============================\n\n`;
  content += `Paragraph: ${paragraph}\n`;
  content += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  if (analysis.mainTopic) {
    content += `MAIN TOPIC:\n${analysis.mainTopic}\n\n`;
  }
  
  if (analysis.tone) {
    content += `TONE:\n${analysis.tone}\n\n`;
  }
  
  if (analysis.targetAudience) {
    content += `TARGET AUDIENCE:\n${analysis.targetAudience}\n\n`;
  }
  
  if (analysis.type) {
    content += `TYPE:\n${analysis.type}\n\n`;
  }
  
  if (analysis.vocabularyLevel) {
    content += `VOCABULARY LEVEL:\n${analysis.vocabularyLevel}\n\n`;
  }
  
  if (analysis.sentimentLabel) {
    content += `SENTIMENT:\n${analysis.sentimentLabel}\n`;
    if (analysis.sentimentIntensity) {
      content += `Intensity: ${analysis.sentimentIntensity}\n`;
    }
    if (analysis.sentimentJustification) {
      content += `Justification: ${analysis.sentimentJustification}\n`;
    }
    content += '\n';
  }
  
  if (analysis.keywords && analysis.keywords.length > 0) {
    content += `KEYWORDS:\n`;
    analysis.keywords.forEach((keyword, index) => {
      content += `${index + 1}. ${keyword}\n`;
    });
    content += '\n';
  }
  
  if (analysis.betterVersion) {
    content += `BETTER VERSION:\n${analysis.betterVersion}\n\n`;
  }
  
  if (analysis.gapAnalysis) {
    content += `GAP ANALYSIS:\n${analysis.gapAnalysis}\n\n`;
  }
  
  content += `\n--- End of Report ---`;
  return content;
};

/**
 * Generic handler for creating share text based on analysis type
 */
export const createShareText = (analysis: AnalysisItem): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  
  switch (sanitized.analysis_type) {
    case 'word':
      const word = sanitized.word || (analysis as WordAnalysis).word;
      const wordAnalysis = analysis as WordAnalysis;
      return `Word: "${word}"\nDefinition: ${wordAnalysis.definition || 'N/A'}\nTranslation: ${wordAnalysis.translation || 'N/A'}`;
    
    case 'phrase':
      const phrase = sanitized.phrase || (analysis as PhraseAnalysis).phrase;
      const phraseAnalysis = analysis as PhraseAnalysis;
      return `Phrase: "${phrase}"\nLiteral Meaning: ${phraseAnalysis.literalMeaning || 'N/A'}\nNatural Translation: ${phraseAnalysis.naturalTranslation || 'N/A'}`;
    
    case 'sentence':
      const sentence = sanitized.sentence || (analysis as SentenceAnalysis).sentence;
      const sentenceAnalysis = analysis as SentenceAnalysis;
      return `Sentence: "${sentence}"\nTranslation: ${sentenceAnalysis.naturalTranslation || 'N/A'}\nMain Idea: ${sentenceAnalysis.mainIdea || 'N/A'}`;
    
    case 'paragraph':
      const paragraph = sanitized.paragraph || (analysis as ParagraphAnalysis).paragraph;
      const paragraphAnalysis = analysis as ParagraphAnalysis;
      return `Paragraph: "${paragraph.substring(0, 100)}..."\nMain Topic: ${paragraphAnalysis.mainTopic || 'N/A'}\nSentiment: ${paragraphAnalysis.sentimentLabel || 'N/A'}`;
    
    default:
      return `Analysis: ${sanitized.id || 'Unknown'}`;
  }
};

/**
 * Generic handler for creating share title based on analysis type
 */
export const createShareTitle = (analysis: AnalysisItem): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  
  switch (sanitized.analysis_type) {
    case 'word':
      const word = sanitized.word || (analysis as WordAnalysis).word;
      return `Word Analysis: ${word}`;
    
    case 'phrase':
      const phrase = sanitized.phrase || (analysis as PhraseAnalysis).phrase;
      return `Phrase Analysis: ${phrase}`;
    
    case 'sentence':
      const sentence = sanitized.sentence || (analysis as SentenceAnalysis).sentence;
      return `Sentence Analysis: ${sentence.substring(0, 30)}...`;
    
    case 'paragraph':
      const paragraph = sanitized.paragraph || (analysis as ParagraphAnalysis).paragraph;
      const paragraphAnalysis = analysis as ParagraphAnalysis;
      return `Paragraph Analysis: ${paragraphAnalysis.mainTopic || 'Analysis'}`;
    
    default:
      return `Analysis: ${sanitized.id || 'Unknown'}`;
  }
};

/**
 * Generic handler for creating print title based on analysis type
 */
export const createPrintTitle = (analysis: AnalysisItem): string => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  
  switch (sanitized.analysis_type) {
    case 'word':
      const word = sanitized.word || (analysis as WordAnalysis).word;
      return `Word Analysis: ${word}`;
    
    case 'phrase':
      const phrase = sanitized.phrase || (analysis as PhraseAnalysis).phrase;
      return `Phrase Analysis: ${phrase}`;
    
    case 'sentence':
      const sentence = sanitized.sentence || (analysis as SentenceAnalysis).sentence;
      return `Sentence Analysis: ${sentence.substring(0, 30)}...`;
    
    case 'paragraph':
      const paragraph = sanitized.paragraph || (analysis as ParagraphAnalysis).paragraph;
      const paragraphAnalysis = analysis as ParagraphAnalysis;
      return `Paragraph Analysis: ${paragraphAnalysis.mainTopic || 'Analysis'}`;
    
    default:
      return `Analysis: ${sanitized.id || 'Unknown'}`;
  }
};

/**
 * Generic handler for getting the appropriate formatAsText function based on analysis type
 */
export const getFormatAsTextFunction = (analysis: AnalysisItem) => {
  const sanitized = sanitizeAnalysisForHandlers(analysis);
  
  switch (sanitized.analysis_type) {
    case 'word':
      return formatWordAsText as (analysis: AnalysisItem) => string;
    
    case 'phrase':
      return formatPhraseAsText as (analysis: AnalysisItem) => string;
    
    case 'sentence':
      return formatSentenceAsText as (analysis: AnalysisItem) => string;
    
    case 'paragraph':
      return formatParagraphAsText as (analysis: AnalysisItem) => string;
    
    default:
      throw new Error(`Unsupported analysis type: ${sanitized.analysis_type}`);
  }
};