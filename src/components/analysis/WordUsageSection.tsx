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
        <Card className="p-4 bg-amber-50 border-amber-200">
          <h4 className="font-semibold mb-3 text-amber-800 flex items-center gap-2">
            Ví dụ sử dụng
          </h4>
          
          <div className="space-y-2">
            <div className="bg-white p-3 rounded border-l-4 border-amber-400">
              <p className="text-sm italic text-gray-700">
                "{usage.example_sentence}"
              </p>
            </div>
            
            {usage.example_translation && (
              <div className="bg-amber-100 p-3 rounded">
                <p className="text-sm font-medium text-amber-900">
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