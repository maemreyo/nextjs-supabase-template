import { analysisLogger } from '@/services/logger';
import type { AnalysisType } from '@/components/analysis/types/analysis-types';

export type SanitizedAnalysisData = 
  | { id: string; analysis_type: 'word'; word: string }
  | { id: string; analysis_type: 'phrase'; phrase: string }
  | { id: string; analysis_type: 'sentence'; sentence: string }
  | { id: string; analysis_type: 'paragraph'; paragraph: string }
  | { id: string; analysis_type: '' };

const getContentField = (
  analysisType: string, 
  analysis: Record<string, unknown>
): string | undefined => {
  const fieldMap: Record<AnalysisType, string> = {
    word: 'word',
    phrase: 'phrase',
    sentence: 'sentence',
    paragraph: 'paragraph',
  };

  const field = fieldMap[analysisType as AnalysisType];
  if (typeof field !== 'string') return undefined;
  return typeof analysis[field] === 'string' ? analysis[field] as string : undefined;
};

export const sanitizeAnalysisForHandlers = (analysis: unknown): SanitizedAnalysisData => {
  if (!analysis || typeof analysis !== 'object' || analysis === null) {
    analysisLogger.warn('sanitizeAnalysisForHandlers: Invalid input - not an object', { 
      inputType: typeof analysis 
    });
    return { id: '', analysis_type: '' };
  }

  const obj = analysis as Record<string, unknown>;
  const id = String(obj.id ?? obj.analysisId ?? '');
  const analysisType = String(obj.analysis_type ?? obj.analysisType ?? '');

  if (!id) {
    analysisLogger.warn('sanitizeAnalysisForHandlers: Missing id', { 
      hasId: !!obj.id, 
      hasAnalysisId: !!obj.analysisId 
    });
    return { id: '', analysis_type: '' };
  }

  if (!analysisType) {
    analysisLogger.warn('sanitizeAnalysisForHandlers: Missing analysis_type', { 
      hasAnalysisType: !!obj.analysisType, 
      hasAnalysis_type: !!obj.analysis_type 
    });
    return { id, analysis_type: '' };
  }

  const content = getContentField(analysisType, obj);

  if (!content) {
    analysisLogger.warn('sanitizeAnalysisForHandlers: No matching content for type', { 
      analysisType, 
      fields: Object.keys(obj).filter(k => ['word','phrase','sentence','paragraph'].includes(k))
    });
    return { id, analysis_type: '' };
  }

  analysisLogger.debug('sanitizeAnalysisForHandlers: Success', { id, analysis_type: analysisType });

  // Safe cast: validated type and content match
  const result = {
    id,
    analysis_type: analysisType as AnalysisType,
    [analysisType]: content
  } as SanitizedAnalysisData;
  
  analysisLogger.debug('sanitizeAnalysisForHandlers: Result', {
    result,
    resultType: typeof result,
    analysisType,
    contentType: typeof content
  });

  return result;
};
