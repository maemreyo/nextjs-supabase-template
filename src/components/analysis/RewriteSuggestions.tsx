import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit3 } from 'lucide-react';
import type { RewriteSuggestionsProps } from './types';
import { useState } from 'react';

/**
 * Component để hiển thị các gợi ý viết lại câu
 */
export function RewriteSuggestions({ 
  suggestions, 
  onApply,
  className = ""
}: RewriteSuggestionsProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>(suggestions[0]?.style || '');
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
        <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Gợi ý viết lại
      </h4>
      
      <Tabs value={selectedStyle} onValueChange={setSelectedStyle}>
        <TabsList className="grid w-full grid-cols-3">
          {suggestions.map((suggestion) => (
            <TabsTrigger key={suggestion.style} value={suggestion.style}>
              {suggestion.style}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {suggestions.map((suggestion) => (
          <TabsContent key={suggestion.style} value={suggestion.style} className="mt-3">
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded border-l-4 border-primary">
                <p className="text-sm italic text-foreground">"{suggestion.text}"</p>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1 text-foreground">Thay đổi:</p>
                <p className="text-xs bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded text-foreground">{suggestion.change_log}</p>
              </div>
              
              {onApply && (
                <Button
                  size="sm"
                  onClick={() => onApply(suggestion.text)}
                  className="mt-2"
                  variant="outline"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Áp dụng phiên bản này
                </Button>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

export default RewriteSuggestions;