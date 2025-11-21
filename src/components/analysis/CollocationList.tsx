import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { CollocationListProps } from './types';

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
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'uncommon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'rare':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h4 className="font-semibold mb-3 text-blue-700 flex items-center justify-between">
        <span>Cách dùng kết hợp (Collocations)</span>
        <Badge variant="outline" className="text-xs">
          {collocations.length} items
        </Badge>
      </h4>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {displayCollocations.map((collocation, index) => (
          <div 
            key={index}
            className="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
            onClick={() => onCollocationClick?.(collocation)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-blue-800 text-sm">
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
              <p className="text-sm text-gray-700">
                {collocation.meaning}
              </p>
              
              {collocation.usage_example && (
                <div className="bg-gray-50 p-2 rounded border-l-2 border-blue-300">
                  <p className="text-xs italic text-gray-600">
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