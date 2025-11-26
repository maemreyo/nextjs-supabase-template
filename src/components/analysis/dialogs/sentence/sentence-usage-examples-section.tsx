import React from 'react';
import { BookOpen, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface SentenceUsageExamplesSectionProps {
  examples?: string[];
  onAnalyzeExample?: (example: string) => void;
  className?: string;
}

/**
 * Sentence Usage Examples Section Component
 * Hiển thị các ví dụ sử dụng của câu
 */
export const SentenceUsageExamplesSection: React.FC<SentenceUsageExamplesSectionProps> = ({
  examples = [],
  onAnalyzeExample,
  className,
}) => {
  if (examples.length === 0) return null;

  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Ví dụ liên quan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {examples.map((example, index) => (
          <div key={index} className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm leading-relaxed mb-2">{example}</p>
            {onAnalyzeExample && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAnalyzeExample(example)}
                className="h-8 px-2"
                aria-label={`Phân tích ví dụ: ${example}`}
              >
                <Eye className="h-4 w-4 mr-1" />
                Phân tích
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SentenceUsageExamplesSection;