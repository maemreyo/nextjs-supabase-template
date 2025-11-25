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
  pageSize = 20
}: SessionAnalysesListProps) {
  
  // If we have provided analyses (static data), render the legacy view
  if (providedAnalyses) {
    return (
      <Card className={`flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Danh sách phân tích
            </h3>
          </div>
        </div>
        
        {/* Content area - grouped by type */}
        <div className="flex-1 overflow-auto p-4" style={{ height: '500px' }}>
          {providedAnalyses.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Chưa có phân tích</h3>
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(['word', 'phrase', 'sentence', 'paragraph'] as AnalysisType[]).map(type => {
                const typeAnalyses = providedAnalyses.filter(analysis => analysis.analysisType === type);
                if (typeAnalyses.length === 0) return null;
                
                const layout = compact ? COMPACT_LAYOUTS[type] : DEFAULT_LAYOUTS[type];
                const getGridClassName = (analysisType: AnalysisType) => {
                  const layouts = compact ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
                  return layouts[analysisType].gridCols;
                };
                
                return (
                  <div key={type} className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{getAnalysisTypeIcon(type)}</span>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {getAnalysisTypeDisplayName(type)} ({typeAnalyses.length})
                      </h4>
                    </div>
                    <div className={`${getGridClassName(type)} grid gap-3`}>
                      {typeAnalyses.filter(Boolean).map((analysis: AnalysisItem) => (
                        <AnalysisItemCard
                          key={analysis.id}
                          analysis={analysis}
                          onClick={onAnalysisClick}
                          onAnalyze={onAnalysisAnalyze}
                          onRemove={onAnalysisRemove}
                          compact={compact}
                          showPhonetic={true}
                          truncateLength={layout.truncateLength}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    );
  }
  
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

// Helper functions for backward compatibility
function getAnalysisTypeIcon(type: AnalysisType) {
  switch (type) {
    case 'word':
      return '📝';
    case 'phrase':
      return '💬';
    case 'sentence':
      return '📄';
    case 'paragraph':
      return '📋';
    default:
      return '📝';
  }
}

function getAnalysisTypeDisplayName(type: AnalysisType) {
  switch (type) {
    case 'word':
      return 'Từ';
    case 'phrase':
      return 'Cụm từ';
    case 'sentence':
      return 'Câu';
    case 'paragraph':
      return 'Đoạn';
    default:
      return type;
  }
}

export default SessionAnalysesList;