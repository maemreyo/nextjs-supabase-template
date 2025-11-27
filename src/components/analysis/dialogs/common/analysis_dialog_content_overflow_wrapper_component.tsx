import React from 'react';

/**
 * Analysis Dialog Content Overflow Wrapper Component
 * Provides consistent overflow styling for dialog content
 */
export const AnalysisDialogContentOverflowWrapperComponent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="pt-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
      {children}
    </div>
  );
};