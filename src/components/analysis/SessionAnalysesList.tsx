import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { 
  AnalysisItem, 
  AnalysisType, 
  SessionAnalysesListProps
} from './types/analysis-types';
import { AnalysisItemCard } from './components/AnalysisItemCard';
import { DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from './types/analysis-types';
import { AnalysisTabs } from './AnalysisTabs';

export function SessionAnalysesList({
  sessionId,
  analyses: providedAnalyses,
  onAnalysisClick,
  onAnalysisAnalyze,
  onAnalysisRemove,
  className = "",
  emptyMessage = "Chưa có phân tích nào trong session này.",
  compact = false,
  pageSize = 15
}: SessionAnalysesListProps) {
  
  // If we have sessionId, use the new tabbed interface with infinite scroll
  if (sessionId) {
    return (
      <div className={className}>
        <AnalysisTabs
          sessionId={sessionId}
          onAnalysisClick={onAnalysisClick}
          onAnalysisAnalyze={onAnalysisAnalyze}
          onAnalysisRemove={onAnalysisRemove}
          compact={compact}
        />
      </div>
    );
  }
  
  // Fallback empty state
  return (
    <Card className={`p-8 text-center ${className}`}>
      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Chưa có phân tích</h3>
      <p className="text-muted-foreground">{emptyMessage}</p>
    </Card>
  );
}

export default SessionAnalysesList;