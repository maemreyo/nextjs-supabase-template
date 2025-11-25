import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisType, DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from '../types/analysis-types';

interface AnalysisSkeletonProps {
  type?: AnalysisType;
  count?: number;
  compact?: boolean;
  layoutConfig?: 'default' | 'compact';
}

export function AnalysisSkeleton({
  type = 'word',
  count = 5,
  compact = false,
  layoutConfig = compact ? 'compact' : 'default'
}: AnalysisSkeletonProps) {
  // Get appropriate layout config
  const layouts = layoutConfig === 'compact' ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
  const layout = layouts[type];
  
  const renderSkeleton = (index: number) => (
    <Card key={index} className={`${layout.cardPadding} ${layout.maxHeight || ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <Skeleton className={`${layout.titleSize === 'text-base font-semibold' ? 'h-6' : layout.titleSize === 'text-lg font-semibold' ? 'h-7' : layout.titleSize === 'text-xl font-semibold' ? 'h-8' : 'h-5'} w-3/4 mb-2`} />
          <Skeleton className="h-4 w-1/2 mb-1" />
          {type === 'word' && (
            <Skeleton className="h-4 w-1/3 mt-1" />
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Skeleton className="h-5 w-8 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-10 rounded" />
      </div>
      
      {/* Description */}
      <div>
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-4/5 mb-1" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </Card>
  );
  
  return (
    <div className={`grid ${layout.gridCols} gap-3`}>
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </div>
  );
}

// Specialized skeleton components for each analysis type
export function WordAnalysisSkeleton(props: Omit<AnalysisSkeletonProps, 'type'>) {
  return <AnalysisSkeleton {...props} type="word" />;
}

export function PhraseAnalysisSkeleton(props: Omit<AnalysisSkeletonProps, 'type'>) {
  return <AnalysisSkeleton {...props} type="phrase" />;
}

export function SentenceAnalysisSkeleton(props: Omit<AnalysisSkeletonProps, 'type'>) {
  return <AnalysisSkeleton {...props} type="sentence" />;
}

export function ParagraphAnalysisSkeleton(props: Omit<AnalysisSkeletonProps, 'type'>) {
  return <AnalysisSkeleton {...props} type="paragraph" />;
}

// Mixed skeleton for showing different types
export function MixedAnalysisSkeleton({ 
  count = 10, 
  compact = false 
}: { 
  count?: number; 
  compact?: boolean; 
}) {
  const types: AnalysisType[] = ['word', 'phrase', 'sentence', 'paragraph'];
  
  return (
    <div className="space-y-4">
      {types.map((type) => (
        <div key={type} className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <h4 className="text-sm font-medium text-muted-foreground capitalize">
              {type} Analyses
            </h4>
          </div>
          <AnalysisSkeleton 
            type={type} 
            count={Math.ceil(count / types.length)} 
            compact={compact} 
          />
        </div>
      ))}
    </div>
  );
}

export default AnalysisSkeleton;