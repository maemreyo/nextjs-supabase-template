import React from 'react';
import { DialogLoadingIndicator } from './dialog-loading-indicator';
import { cn } from '@/lib/utils';

interface AnalysisDialogActionLoadingIndicatorsComponentProps {
  loadingStatesActions?: Record<string, boolean>;
  customMessages?: Record<string, string>;
  showActionLoading?: boolean;
}

export const AnalysisDialogActionLoadingIndicatorsComponent: React.FC<AnalysisDialogActionLoadingIndicatorsComponentProps> = ({
  loadingStatesActions = {},
  customMessages = {},
  showActionLoading = true
}) => {
  // Check if any action is loading and if action loading is enabled
  const hasAnyActionLoading = showActionLoading && Object.values(loadingStatesActions).some(loading => loading);
  
  // Don't render if no actions are loading or action loading is disabled
  if (!hasAnyActionLoading) {
    return null;
  }
  
  return (
    <div className="flex gap-2 p-2 border-b">
      {Object.entries(loadingStatesActions).map(([action, loading]) => (
        loading && (
          <DialogLoadingIndicator
            key={action}
            type="action"
            message={customMessages?.[action]}
            size="sm"
          />
        )
      ))}
    </div>
  );
};