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
            console.log('View details:', analysis);
          }}
          onEdit={(analysis) => {
            console.log('Edit:', analysis);
          }}
          onExport={(analysis, format) => {
            console.log('Export:', analysis, format);
          }}
          onAddToVocabulary={(analysis) => {
            console.log('Add to vocabulary:', analysis);
          }}
          onPractice={(analysis) => {
            console.log('Practice:', analysis);
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
            console.log('Legacy click:', analysis);
          }}
          onAnalyze={(analysis) => {
            console.log('Legacy analyze:', analysis);
          }}
          onRemove={(analysisId, analysisType) => {
            console.log('Legacy remove:', analysisId, analysisType);
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
            console.log('Custom view details:', analysis);
          }}
          // Fallback to legacy behavior
          onClick={(analysis) => {
            console.log('Fallback click:', analysis);
          }}
          onAnalyze={(analysis) => {
            console.log('Custom analyze:', analysis);
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
            console.log('View details with loading:', analysis);
          }}
        />
      </div>
    </div>
  );
};

export default AnalysisItemCardWithDialogExample;