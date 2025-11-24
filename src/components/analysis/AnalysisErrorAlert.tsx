'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AnalysisErrorAlertProps {
  error: string | null;
  lastError: string | null;
  mutationError: any;
}

/**
 * Component để hiển thị lỗi từ các nguồn khác nhau
 */
export function AnalysisErrorAlert({
  error,
  lastError,
  mutationError
}: AnalysisErrorAlertProps) {
  const displayError = error || lastError || (mutationError instanceof Error ? mutationError.message : null);
  
  if (!displayError) {
    return null;
  }

  return (
    <Alert className="mb-4 border-destructive/50 bg-destructive/10 text-destructive flex-shrink-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {displayError}
      </AlertDescription>
    </Alert>
  );
}

export default AnalysisErrorAlert;