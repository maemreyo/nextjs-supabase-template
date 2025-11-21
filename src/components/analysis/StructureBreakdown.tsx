import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { StructureBreakdownProps } from './types';

/**
 * Component để hiển thị phân tích cấu trúc đoạn văn
 */
export function StructureBreakdown({ 
  structure, 
  className = ""
}: StructureBreakdownProps) {
  if (!structure || structure.length === 0) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'topic sentence':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'supporting detail':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'evidence':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'example':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'transition':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'conclusion':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Phân tích cấu trúc
      </h4>
      
      <div className="space-y-3">
        {structure.map((item, index) => (
          <div key={index} className="border-l-2 border-primary pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Câu {item.sentence_index}
              </Badge>
              <span className="text-sm text-muted-foreground italic">
                "{item.snippet}..."
              </span>
            </div>
            
            <div className="mb-2">
              <Badge
                variant="outline"
                className={`text-xs ${getRoleBadgeColor(item.role)}`}
              >
                {item.role}
              </Badge>
            </div>
            
            <p className="text-sm text-foreground bg-muted p-2 rounded">
              {item.analysis}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default StructureBreakdown;