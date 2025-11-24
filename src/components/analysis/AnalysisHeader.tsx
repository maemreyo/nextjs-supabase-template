'use client';

import React from 'react';
import { SessionActions } from './SessionActions';

interface AnalysisHeaderProps {
  sessionId: string | null;
  session: any;
  analysesCount: number;
  onCreateNewSession: () => Promise<void>;
  onNavigateBack: () => void;
}

/**
 * Component cho phần header của trang Analysis
 * Hiển thị title và description khi không có sessionId
 * Hiển thị SessionActions khi có sessionId
 */
export function AnalysisHeader({
  sessionId,
  session,
  analysesCount,
  onCreateNewSession,
  onNavigateBack
}: AnalysisHeaderProps) {
  // Page Header - Only show when not in session mode
  if (!sessionId) {
    return (
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2">
          AI Semantic Analysis Editor
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Phân tích chi tiết từ, câu và đoạn văn bằng AI để hiểu sâu sắc thái ngữ nghĩa và cải thiện kỹ năng viết.
        </p>
      </div>
    );
  }

  // Quick Navigation when in session mode
  return (
    <div className="mb-4 sm:mb-6 flex-shrink-0">
      <SessionActions
        session={session}
        analysesCount={analysesCount}
        onNavigateBack={onNavigateBack}
        onCreateNewSession={onCreateNewSession}
      />
    </div>
  );
}

export default AnalysisHeader;