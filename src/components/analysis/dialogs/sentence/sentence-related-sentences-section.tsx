import React, { useState, useCallback } from 'react';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { cn } from '@/lib/utils';

interface SentenceRelatedSentencesSectionProps {
  subject?: string;
  mainVerb?: string;
  object?: string;
  clauses?: any;
  sentenceType?: string;
  onClauseClick?: (clause: string) => void;
  className?: string;
}

/**
 * Sentence Related Sentences Section Component
 * Hiển thị cấu trúc câu và các mệnh đề liên quan: subject, main verb, object, clauses
 */
export const SentenceRelatedSentencesSection: React.FC<SentenceRelatedSentencesSectionProps> = ({
  subject,
  mainVerb,
  object,
  clauses,
  sentenceType,
  onClauseClick,
  className,
}) => {
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({});

  const toggleClause = useCallback((clauseId: string) => {
    setExpandedClauses(prev => ({
      ...prev,
      [clauseId]: !prev[clauseId],
    }));
  }, []);

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Cấu trúc câu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subject && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Chủ ngữ:</h4>
              <p className="text-sm leading-relaxed">{subject}</p>
            </div>
          )}
          {mainVerb && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Động từ chính:</h4>
              <p className="text-sm leading-relaxed">{mainVerb}</p>
            </div>
          )}
          {object && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-1 text-primary">Tân ngữ:</h4>
              <p className="text-sm leading-relaxed">{object}</p>
            </div>
          )}
        </div>

        {clauses && Object.keys(clauses).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Các mệnh đề:</h4>
            <div className="space-y-2">
              {Object.entries(clauses).map(([clauseId, clauseText], index) => (
                <div
                  key={clauseId}
                  className={cn(
                    'p-3 bg-muted/20 rounded-lg cursor-pointer transition-all duration-200',
                    'hover:bg-primary/10 hover:rounded-md hover:px-4'
                  )}
                  onClick={() => {
                    onClauseClick?.(clauseText as string);
                    toggleClause(clauseId);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onClauseClick?.(clauseText as string);
                      toggleClause(clauseId);
                    }
                  }}
                  aria-label={`Mệnh đề ${index + 1}: ${clauseText as string}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Mệnh đề {index + 1}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedClauses[clauseId] && 'rotate-180'
                      )}
                    />
                  </div>
                  {expandedClauses[clauseId] && (
                    <p className="text-sm mt-2 leading-relaxed">{clauseText as string}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sentenceType && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Loại câu:</span>
            <Badge variant="outline">{sentenceType}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceRelatedSentencesSection;