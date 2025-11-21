import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import type { CollocationListProps } from './types';

/**
 * Component để hiển thị danh sách collocations với các trường thông tin chi tiết
 * Tương tự như SynonymAntonymList nhưng cho collocations
 */
export function CollocationList({ 
  collocations, 
  onCollocationClick, 
  maxItems = 5,
  showFrequencyLevel = true,
  className = ""
}: CollocationListProps) {
  if (!collocations || collocations.length === 0) {
    return null;
  }

  const displayCollocations = collocations.slice(0, maxItems);

  const getFrequencyBadgeVariant = (level: string) => {
    switch (level) {
      case 'common':
        return 'default'; // Màu xanh lá cây
      case 'uncommon':
        return 'secondary'; // Màu vàng
      case 'rare':
        return 'outline'; // Màu đỏ
      default:
        return 'outline';
    }
  };

  const getFrequencyBadgeColor = (level: string) => {
    switch (level) {
      case 'common':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-800/50';
      case 'uncommon':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-800/50';
      case 'rare':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-800/50';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center justify-between">
        <span>Cách dùng kết hợp (Collocations)</span>
        <Badge variant="outline" className="text-xs">
          {collocations.length} items
        </Badge>
      </h4>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {displayCollocations.map((collocation, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer transition-all duration-200 hover:shadow-sm"
            onClick={() => onCollocationClick?.(collocation)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-blue-800 dark:text-blue-400 text-sm">
                    {collocation.phrase}
                  </span>
                  
                  {showFrequencyLevel && (
                    <Badge
                      variant={getFrequencyBadgeVariant(collocation.frequency_level)}
                      className={`text-xs ${getFrequencyBadgeColor(collocation.frequency_level)}`}
                    >
                      {collocation.frequency_level}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement text-to-speech for collocation phrase
                  console.log('Play pronunciation for:', collocation.phrase);
                }}
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {collocation.meaning}
              </p>
              
              {collocation.usage_example && (
                <div className="bg-muted p-2 rounded border-l-2 border-blue-300 dark:border-blue-600">
                  <p className="text-xs italic text-muted-foreground">
                    "{collocation.usage_example}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {collocations.length > maxItems && (
        <div className="mt-3 text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // TODO: Implement show all functionality
              console.log('Show all collocations');
            }}
          >
            Hiển thị thêm {collocations.length - maxItems} collocations
          </Button>
        </div>
      )}
    </Card>
  );
}

export default CollocationList;