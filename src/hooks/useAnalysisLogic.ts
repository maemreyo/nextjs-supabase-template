import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

interface AnalysisResult {
  text: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
}

interface UseAnalysisLogicProps {
  onAnalyze?: (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => Promise<any>;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onError?: (error: Error) => void;
}

interface UseAnalysisLogicReturn {
  isAnalyzing: boolean;
  lastAnalysisResult: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  triggerAnalysis: (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => Promise<void>;
  clearLastResult: () => void;
  clearHistory: () => void;
  setLastResult: (result: AnalysisResult) => void;
}

export function useAnalysisLogic({
  onAnalyze,
  onAnalysisComplete,
  onError
}: UseAnalysisLogicProps): UseAnalysisLogicReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisResult, setLastAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  
  // Track last analysis request to prevent duplicates
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  const triggerAnalysis = useCallback(async (
    text: string,
    type: 'word' | 'phrase' | 'sentence' | 'paragraph'
  ) => {
    if (!text.trim()) {
      toast.error('Không có nội dung để phân tích', {
        description: 'Vui lòng chọn văn bản trước khi phân tích.',
        duration: 3000,
      });
      return;
    }

    // Check for duplicate requests
    const now = Date.now();
    const lastAnalysis = lastAnalysisRef.current;
    if (lastAnalysis &&
        lastAnalysis.text === text &&
        lastAnalysis.type === type &&
        (now - lastAnalysis.timestamp) < 2000) {
      return;
    }

    // Update last analysis ref
    lastAnalysisRef.current = {
      text,
      type,
      timestamp: now
    };

    setIsAnalyzing(true);

    try {
      const result = await onAnalyze?.(text, type);

      if (result) {
        const analysisData: AnalysisResult = {
          text,
          type,
          data: result
        };

        setLastAnalysisResult(analysisData);
        setAnalysisHistory(prev => [...prev.slice(-9), analysisData]); // Keep last 10 analyses
        onAnalysisComplete?.(analysisData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Phân tích thất bại');
      console.error('Analysis error:', error);
      
      toast.error('Phân tích thất bại', {
        description: error.message || 'Đã xảy ra lỗi khi phân tích văn bản',
        duration: 3000,
      });
      
      onError?.(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalyze, onAnalysisComplete, onError]);

  const clearLastResult = useCallback(() => {
    setLastAnalysisResult(null);
  }, []);

  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    setLastAnalysisResult(null);
  }, []);

  const setLastResult = useCallback((result: AnalysisResult) => {
    setLastAnalysisResult(result);
    setAnalysisHistory(prev => [...prev.slice(-9), result]);
  }, []);

  return {
    isAnalyzing,
    lastAnalysisResult,
    analysisHistory,
    triggerAnalysis,
    clearLastResult,
    clearHistory,
    setLastResult,
  };
}

export default useAnalysisLogic;