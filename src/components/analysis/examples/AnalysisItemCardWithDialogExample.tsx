import React from 'react';
import { AnalysisItemCard } from '../components/AnalysisItemCard';
import { AnalysisItem } from '../types/analysis-types';

/**
 * Example component showing how to use AnalysisItemCard with dialog system integration
 */
export const AnalysisItemCardWithDialogExample: React.FC<{
  analysis: AnalysisItem;
}> = ({ analysis }) => {
  // Example usage with dialog system enabled
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-4">AnalysisItemCard với Dialog System Integration</h2>
      
      {/* Basic usage with dialog system enabled */}
      <div className="space-y-2">
        <h3 className="text-md font-medium">Dialog System Enabled:</h3>
        <AnalysisItemCard
          analysis={analysis}
          enableDialogSystem={true}
          onViewDetails={(analysis) => {
            
          }}
          onEdit={(analysis) => {
            
          }}
          onExport={(analysis, format) => {
            
          }}
          onAddToVocabulary={(analysis) => {
            
          }}
          onPractice={(analysis) => {
            
          }}
          ariaLabels={{
            viewDetails: `Xem chi tiết ${analysis.analysisType}`,
            edit: `Chỉnh sửa ${analysis.analysisType}`,
            export: `Xuất ${analysis.analysisType}`,
            addToVocabulary: `Thêm vào từ vựng`,
            practice: `Luyện tập ${analysis.analysisType}`,
            remove: `Xóa ${analysis.analysisType}`,
          }}
          dialogOptions={{
            size: 'large',
            enableFullscreen: true,
            enableResize: true,
          }}
        />
      </div>
      
      {/* Backward compatibility usage */}
      <div className="space-y-2">
        <h3 className="text-md font-medium">Backward Compatibility:</h3>
        <AnalysisItemCard
          analysis={analysis}
          enableDialogSystem={false}
          onClick={(analysis) => {
            
          }}
          onAnalyze={(analysis) => {
            
          }}
          onRemove={(analysisId, analysisType) => {
            
          }}
        />
      </div>
      
      {/* Mixed usage with custom handlers */}
      <div className="space-y-2">
        <h3 className="text-md font-medium">Mixed Usage:</h3>
        <AnalysisItemCard
          analysis={analysis}
          enableDialogSystem={true}
          onViewDetails={(analysis) => {
            
          }}
          // Fallback to legacy behavior
          onClick={(analysis) => {
            
          }}
          onAnalyze={(analysis) => {
            
          }}
        />
      </div>
      
      {/* With loading and error states */}
      <div className="space-y-2">
        <h3 className="text-md font-medium">With Loading/Error States:</h3>
        <AnalysisItemCard
          analysis={analysis}
          enableDialogSystem={true}
          loading={true}
          error="This is a sample error message"
          onViewDetails={(analysis) => {
            
          }}
        />
      </div>
    </div>
  );
};

export default AnalysisItemCardWithDialogExample;