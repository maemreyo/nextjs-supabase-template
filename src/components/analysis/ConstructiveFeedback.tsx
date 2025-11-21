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
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'grammar':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'vocabulary':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'repetition':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'style':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card className={`p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 ${className}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        Góp ý xây dựng
      </h4>
      
      <div className="space-y-4">
        {feedback.critiques.map((critique, index) => (
          <div key={index} className="border-l-2 border-orange-400 dark:border-orange-600 pl-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`text-xs ${getIssueTypeColor(critique.issue_type)}`}
              >
                {critique.issue_type}
              </Badge>
              <AlertTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
            </div>
            
            <p className="text-sm mb-2 text-foreground">{critique.description}</p>
            
            <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded border-l-2 border-orange-300 dark:border-orange-600">
              <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Gợi ý:</p>
              <p className="text-xs text-muted-foreground mt-1">{critique.suggestion}</p>
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
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded border-l-4 border-green-500 dark:border-green-600">
                <p className="text-sm font-medium mb-2 text-green-800 dark:text-green-200">Phiên bản cải tiến:</p>
                <p className="text-sm italic text-foreground bg-background p-3 rounded">
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