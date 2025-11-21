import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { ConstructiveFeedbackProps } from './types';
import { useState } from 'react';

/**
 * Component để hiển thị góp ý xây dựng cho đoạn văn
 */
export function ConstructiveFeedback({ 
  feedback, 
  onApply,
  className = ""
}: ConstructiveFeedbackProps) {
  const [showBetterVersion, setShowBetterVersion] = useState(false);
  
  if (!feedback || (!feedback.critiques || feedback.critiques.length === 0)) {
    return null;
  }

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'logic':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'grammar':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'vocabulary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'repetition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'style':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`p-4 bg-green-50 border-green-200 ${className}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Góp ý xây dựng
      </h4>
      
      <div className="space-y-4">
        {feedback.critiques.map((critique, index) => (
          <div key={index} className="border-l-2 border-orange-400 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${getIssueTypeColor(critique.issue_type)}`}
              >
                {critique.issue_type}
              </Badge>
              <AlertTriangle className="h-3 w-3 text-orange-500" />
            </div>
            
            <p className="text-sm mb-2 text-gray-700">{critique.description}</p>
            
            <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-300">
              <p className="text-xs font-medium text-orange-800">Gợi ý:</p>
              <p className="text-xs text-gray-700 mt-1">{critique.suggestion}</p>
            </div>
          </div>
        ))}
        
        {feedback.better_version && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBetterVersion(!showBetterVersion)}
              className="mb-3"
            >
              {showBetterVersion ? 'Ẩn' : 'Hiện'} phiên bản cải tiến
            </Button>
            
            {showBetterVersion && (
              <div className="bg-green-100 p-4 rounded border-l-4 border-green-500">
                <p className="text-sm font-medium mb-2 text-green-800">Phiên bản cải tiến:</p>
                <p className="text-sm italic text-gray-700 bg-white p-3 rounded">
                  "{feedback.better_version}"
                </p>
                
                {onApply && (
                  <Button 
                    size="sm" 
                    onClick={() => onApply(feedback.better_version)}
                    className="mt-3"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Áp dụng phiên bản này
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default ConstructiveFeedback;