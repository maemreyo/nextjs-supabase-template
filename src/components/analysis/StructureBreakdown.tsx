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
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'supporting detail':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'evidence':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'example':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'transition':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'conclusion':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue-600" />
        Phân tích cấu trúc
      </h4>
      
      <div className="space-y-3">
        {structure.map((item, index) => (
          <div key={index} className="border-l-2 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Câu {item.sentence_index}
              </Badge>
              <span className="text-sm text-gray-500 italic">
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
            
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {item.analysis}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default StructureBreakdown;