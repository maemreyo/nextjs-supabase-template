
export const sanitizeAnalysisForHandlers = (analysis: any) => {
  if (!analysis) return { id: '', analysis_type: '' };
  return {
    id: analysis.id || '',
  analysis_type: string;
  word?: string;
  sentence?: string;
  phrase?: string;
  paragraph?: string;
}

export const sanitizeAnalysisForHandlers = (analysis: any): SanitizedAnalysisData => {
  if (!analysis || typeof analysis !== 'object' || !analysis.id || !analysis.analysis_type) {
    analysisLogger?.warn('sanitizeAnalysisForHandlers called with invalid analysis data', { 
      hasId: !!analysis?.id, 
      hasType: !!analysis?.analysis_type 
    });
    return { 
      id: '', 
      analysis_type: '' 
