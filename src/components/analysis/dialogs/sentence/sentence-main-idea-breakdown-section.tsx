import React from 'react';
import { Languages, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { cn } from '@/lib/utils';

interface SentenceMainIdeaBreakdownSectionProps {
  naturalTranslation?: string;
  literalTranslation?: string;
  mainIdea?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
  className?: string;
}

/**
 * Sentence Main Idea Breakdown Section Component
 * Hiển thị bản dịch và ý chính của câu: natural translation, literal translation, main idea
 */
export const SentenceMainIdeaBreakdownSection: React.FC<SentenceMainIdeaBreakdownSectionProps> = ({
  naturalTranslation,
  literalTranslation,
  mainIdea,
  onCopy,
  copied,
  className,
}) => {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Bản dịch và ý chính
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {naturalTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch tự nhiên:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed">{naturalTranslation}</p>
              {onCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(naturalTranslation)}
                  className="mt-2 h-8 px-2"
                  aria-label="Sao chép bản dịch tự nhiên"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {literalTranslation && (
          <div>
            <h4 className="font-medium text-sm mb-1">Bản dịch chữ:</h4>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm leading-relaxed italic">{literalTranslation}</p>
            </div>
          </div>
        )}
        
        {mainIdea && (
          <div>
            <h4 className="font-medium text-sm mb-1">Ý chính:</h4>
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm leading-relaxed">{mainIdea}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SentenceMainIdeaBreakdownSection;