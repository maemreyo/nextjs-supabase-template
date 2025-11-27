import React from 'react';
import { DialogErrorHandler } from './dialog-error-handler';
import { cn } from '../../../../lib/utils';

interface AnalysisDialogErrorDisplaySectionComponentProps {
  error: string | null;
  shouldShowGlobalLoading: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AnalysisDialogErrorDisplaySectionComponent: React.FC<AnalysisDialogErrorDisplaySectionComponentProps> = ({
  error,
  shouldShowGlobalLoading,
  onRetry,
  onDismiss,
  className
}) => {
  if (!error || shouldShowGlobalLoading) return null;
  
  return (
    <div className={cn('p-4 border-b', className)}>
      <DialogErrorHandler
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    </div>
  );
};