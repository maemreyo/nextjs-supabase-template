import type { AnalysisItem } from './types';

export interface UseAnalysisDynamicIslandReturn {
  current: AnalysisItem | null;
  isExpanded: boolean;
  queueLength: number;
  dismissCurrent: () => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleGuide: () => void;
}