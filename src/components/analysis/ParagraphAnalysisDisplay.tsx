import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Target, Users, TrendingUp, Link, BookOpen, CheckCircle } from 'lucide-react';
import type { ParagraphAnalysisDisplayProps } from './types';
import { StructureBreakdown } from './StructureBreakdown';
import { ConstructiveFeedback } from './ConstructiveFeedback';

/**
 * Component chính để hiển thị chi tiết phân tích đoạn văn
 * Sử dụng các component con để hiển thị các phần khác nhau
 */
export function ParagraphAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onFeedbackApply,
  className = ""
}: ParagraphAnalysisDisplayProps) {
  if (isLoading) {
    return <ParagraphAnalysisSkeleton />;
  }
  
  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-center">
          <p className="text-red-600">Lỗi khi tải phân tích đoạn văn: {error}</p>
        </div>
      </Card>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Paragraph Meta Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Phân tích đoạn văn</h3>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border-l-4 border-purple-500 mb-3">
          <p className="text-sm italic text-gray-700">Đoạn văn cần phân tích</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Thể loại:</h5>
            <Badge variant="outline">{analysis.meta.type}</Badge>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Giọng điệu:</h5>
            <Badge variant="secondary">{analysis.meta.tone}</Badge>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Đối tượng:</h5>
            <Badge>{analysis.meta.target_audience}</Badge>
          </div>
        </div>
      </Card>

      {/* Content Analysis Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          Phân tích nội dung
        </h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Chủ đề chính:</h5>
            <p className="text-sm bg-blue-50 p-2 rounded">{analysis.content_analysis.main_topic}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Cảm xúc:</h5>
            <div className="flex items-center gap-2">
              <Badge 
                className={getSentimentColor(analysis.content_analysis.sentiment.label)}
              >
                {analysis.content_analysis.sentiment.label}
              </Badge>
              <span className="text-sm text-gray-500">
                Mức độ: {analysis.content_analysis.sentiment.intensity}/10
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{analysis.content_analysis.sentiment.justification}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Từ khóa:</h5>
            <div className="flex flex-wrap gap-1">
              {analysis.content_analysis.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Structure Breakdown */}
      <StructureBreakdown structure={analysis.structure_breakdown} />

      {/* Coherence and Cohesion Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Link className="h-4 w-4 text-green-600" />
          Mạch lạc và Liên kết
        </h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-1">Điểm mạch lạc (logic):</h5>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getScoreColor(analysis.coherence_and_cohesion.logic_score)}`}>
                  {analysis.coherence_and_cohesion.logic_score}
                </span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-1">Điểm trôi chảy (flow):</h5>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getScoreColor(analysis.coherence_and_cohesion.flow_score)}`}>
                  {analysis.coherence_and_cohesion.flow_score}
                </span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Từ nối:</h5>
            <div className="flex flex-wrap gap-1">
              {analysis.coherence_and_cohesion.transition_words.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
          
          {analysis.coherence_and_cohesion.gap_analysis && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-1">Phân tích khoảng trống:</h5>
              <p className="text-sm bg-yellow-50 p-2 rounded">{analysis.coherence_and_cohesion.gap_analysis}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Stylistic Evaluation Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-purple-600" />
          Đánh giá phong cách
        </h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Mức độ từ vựng:</h5>
            <Badge variant="outline">{analysis.stylistic_evaluation.vocabulary_level}</Badge>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Đa dạng câu:</h5>
            <Badge variant="secondary">{analysis.stylistic_evaluation.sentence_variety}</Badge>
          </div>
        </div>
      </Card>

      {/* Constructive Feedback */}
      <ConstructiveFeedback 
        feedback={analysis.constructive_feedback}
        onApply={onFeedbackApply}
      />
    </div>
  );
}

/**
 * Component skeleton cho loading state
 */
function ParagraphAnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-20 bg-gray-200 rounded w-full"></div>
      
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-48 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export default ParagraphAnalysisDisplay;