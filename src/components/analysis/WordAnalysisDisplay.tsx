import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, Lightbulb } from 'lucide-react';
import { WordAnalysisDisplayProps } from './types';
import { SynonymAntonymList } from './SynonymAntonymList';
import { WordUsageSection } from './WordUsageSection';

/**
 * Component chính để hiển thị chi tiết phân tích từ
 * Sử dụng các component con để hiển thị các phần khác nhau
 */
export function WordAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onSynonymClick, 
  onAntonymClick,
  onCollocationClick,
  className = ""
}: WordAnalysisDisplayProps) {
  if (isLoading) {
    return <WordAnalysisSkeleton />;
  }
  
  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="text-center">
          <p className="text-red-600">Lỗi khi tải phân tích từ: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Word Meta Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold">{analysis.meta.word}</h3>
          <Button variant="ghost" size="sm">
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{analysis.meta.pos}</Badge>
            <Badge variant="outline">{analysis.meta.cefr}</Badge>
            <Badge>{analysis.meta.tone}</Badge>
          </div>
          
          <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
            {analysis.meta.ipa}
          </div>
        </div>
      </Card>

      {/* Word Definitions Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Định nghĩa</h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Nghĩa gốc</h5>
            <p className="text-sm">{analysis.definitions.root_meaning}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Nghĩa trong ngữ cảnh</h5>
            <p className="text-sm bg-blue-50 p-2 rounded">{analysis.definitions.context_meaning}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Dịch nghĩa</h5>
            <p className="text-sm font-medium">{analysis.definitions.vietnamese_translation}</p>
          </div>
        </div>
      </Card>

      {/* Inference Strategy Section */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          Chiến lược suy luận
        </h4>
        
        <div className="space-y-2">
          <div>
            <h5 className="text-sm font-medium mb-1">Dấu hiệu nhận biết:</h5>
            <p className="text-sm">{analysis.inference_strategy.clues}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-1">Cách suy luận:</h5>
            <p className="text-sm">{analysis.inference_strategy.reasoning}</p>
          </div>
        </div>
      </Card>

      {/* Synonym Antonym List */}
      <SynonymAntonymList 
        synonyms={analysis.relations.synonyms}
        antonyms={analysis.relations.antonyms}
        onSynonymClick={onSynonymClick}
        onAntonymClick={onAntonymClick}
        maxItems={5}
      />

      {/* Word Usage Section */}
      <WordUsageSection 
        usage={analysis.usage}
        onCollocationClick={onCollocationClick}
        maxCollocations={5}
      />
    </div>
  );
}

/**
 * Component skeleton cho loading state
 */
function WordAnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-20 bg-gray-200 rounded w-full"></div>
      
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-32 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export default WordAnalysisDisplay;