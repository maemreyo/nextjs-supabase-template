import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import type { SynonymAntonymListProps } from './types';

/**
 * Component tái sử dụng để hiển thị danh sách từ đồng nghĩa và trái nghĩa
 */
export function SynonymAntonymList({
  synonyms,
  antonyms,
  onSynonymClick,
  onAntonymClick,
  maxItems = 5,
  className = ""
}: SynonymAntonymListProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {synonyms.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400 flex items-center justify-between">
            <span>Từ đồng nghĩa</span>
            <Badge variant="outline" className="text-xs">
              {synonyms.length} items
            </Badge>
          </h4>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {synonyms.slice(0, maxItems).map((synonym, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer transition-all duration-200 hover:shadow-sm"
                onClick={() => onSynonymClick?.(synonym.word)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-800 dark:text-green-400 text-sm">{synonym.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {synonym.ipa}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement text-to-speech for synonym
                        console.log('Play pronunciation for:', synonym.word);
                      }}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Ưu tiên hiển thị nghĩa tiếng Việt nổi bật hơn */}
                <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded border-l-2 border-green-300 dark:border-green-600 mb-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {synonym.meaning_vi}
                  </p>
                </div>
                
                {/* Hiển thị nghĩa tiếng Anh như supplementary info */}
                <p className="text-xs text-muted-foreground">
                  {synonym.meaning_en}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {antonyms.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>Từ trái nghĩa</span>
            <Badge variant="outline" className="text-xs">
              {antonyms.length} items
            </Badge>
          </h4>
          
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {antonyms.slice(0, maxItems).map((antonym, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-all duration-200 hover:shadow-sm"
                onClick={() => onAntonymClick?.(antonym.word)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-red-800 dark:text-red-400 text-sm">{antonym.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {antonym.ipa}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement text-to-speech for antonym
                        console.log('Play pronunciation for:', antonym.word);
                      }}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Ưu tiên hiển thị nghĩa tiếng Việt nổi bật hơn */}
                <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded border-l-2 border-red-300 dark:border-red-600 mb-2">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {antonym.meaning_vi}
                  </p>
                </div>
                
                {/* Hiển thị nghĩa tiếng Anh như supplementary info */}
                <p className="text-xs text-muted-foreground">
                  {antonym.meaning_en}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default SynonymAntonymList;