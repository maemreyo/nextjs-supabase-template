import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CollocationList } from './CollocationList';
import type { WordUsageSectionProps } from './types';

/**
 * Component để hiển thị phần usage của WordAnalysis
 * Bao gồm collocations và ví dụ sử dụng
 */
export function WordUsageSection({ 
  usage, 
  onCollocationClick, 
  maxCollocations = 5,
  className = ""
}: WordUsageSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Collocations Section */}
      <CollocationList
        collocations={usage.collocations}
        onCollocationClick={onCollocationClick}
        maxItems={maxCollocations}
        showFrequencyLevel={true}
      />
      
      {/* Example Sentence Section */}
      {usage.example_sentence && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold mb-3 text-amber-800 dark:text-amber-400 flex items-center gap-2">
            Ví dụ sử dụng
          </h4>
          
          <div className="space-y-2">
            <div className="bg-background p-3 rounded border-l-4 border-amber-400 dark:border-amber-600">
              <p className="text-sm italic text-foreground">
                "{usage.example_sentence}"
              </p>
            </div>
            
            {usage.example_translation && (
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  {usage.example_translation}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default WordUsageSection;