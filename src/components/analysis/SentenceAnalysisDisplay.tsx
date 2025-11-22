import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Lightbulb, BookOpen, Target, Zap, Languages } from 'lucide-react';
import type { SentenceAnalysisDisplayProps } from './types';
import { RewriteSuggestions } from './RewriteSuggestions';

/**
 * Component chính để hiển thị chi tiết phân tích câu
 * Sử dụng các component con để hiển thị các phần khác nhau
 */
export function SentenceAnalysisDisplay({ 
  analysis, 
  isLoading, 
  error, 
  onRewriteApply,
  className = ""
}: SentenceAnalysisDisplayProps) {
  if (isLoading) {
    return <SentenceAnalysisSkeleton />;
  }
  
  if (error) {
    return (
      <Card className="p-6 border-destructive/50 bg-destructive/10 text-destructive">
        <div className="text-center">
          <p className="text-destructive">Lỗi khi tải phân tích câu: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sentence Meta Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-foreground">Phân tích câu</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{analysis.meta.complexity_level}</Badge>
            <Badge variant="outline">{analysis.meta.sentence_type}</Badge>
          </div>
        </div>
        
        <div className="bg-muted p-3 rounded border-l-4 border-primary">
          <p className="text-sm italic text-foreground">"{analysis.meta.sentence}"</p>
        </div>
      </Card>

      {/* Semantics Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          Phân tích ngữ nghĩa
        </h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Ý chính:</h5>
            <p className="text-sm bg-primary/10 p-2 rounded text-foreground">{analysis.semantics?.main_idea || 'N/A'}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Ý ngầm:</h5>
            <p className="text-sm bg-purple-50 dark:bg-purple-950/20 p-2 rounded text-foreground">{analysis.semantics?.subtext || 'N/A'}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Cảm xúc:</h5>
            <Badge
              variant={analysis.semantics?.sentiment === 'Positive' ? 'default' :
                     analysis.semantics?.sentiment === 'Negative' ? 'destructive' : 'secondary'}
            >
              {analysis.semantics?.sentiment || 'N/A'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Grammar Breakdown Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
          Phân tích ngữ pháp
        </h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-1">Chủ ngữ:</h5>
              <p className="text-sm font-medium text-foreground">{analysis.grammar_breakdown?.subject || 'N/A'}</p>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-1">Động từ chính:</h5>
              <p className="text-sm font-medium text-foreground">{analysis.grammar_breakdown?.main_verb || 'N/A'}</p>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-1">Tân ngữ:</h5>
              <p className="text-sm font-medium text-foreground">{analysis.grammar_breakdown?.object || 'N/A'}</p>
            </div>
          </div>
          
          {analysis.grammar_breakdown?.clauses && analysis.grammar_breakdown.clauses.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Mệnh đề:</h5>
              <div className="space-y-2">
                {analysis.grammar_breakdown.clauses.map((clause, index) => (
                  <div key={index} className="bg-muted p-2 rounded border-l-2 border-border">
                    <span className="text-xs font-medium text-muted-foreground">{clause.type}:</span>
                    <p className="text-sm mt-1 text-foreground">"{clause.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Contextual Role Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Vai trò ngữ cảnh
        </h4>
        
        <div className="space-y-2">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Chức năng:</h5>
            <p className="text-sm text-foreground">{analysis.contextual_role?.function || 'N/A'}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Mối quan hệ với câu trước:</h5>
            <p className="text-sm text-foreground">{analysis.contextual_role?.relation_to_previous || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Key Components Section */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          Thành phần chính
        </h4>
        
        <div className="space-y-3">
          {analysis.key_components?.map((component, index) => (
            <div key={index} className="border-l-2 border-orange-400 dark:border-orange-600 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">"{component.phrase}"</span>
                <Badge variant="outline" className="text-xs">{component.type}</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">{component.meaning}</p>
              <p className="text-xs text-muted-foreground">{component.significance}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Rewrite Suggestions */}
      <RewriteSuggestions
        suggestions={analysis.rewrite_suggestions || []}
        onApply={onRewriteApply}
      />

      {/* Translation Section */}
      <Card className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Languages className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Dịch nghĩa
        </h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Dịch nghĩa đen:</h5>
            <p className="text-sm bg-background p-2 rounded text-foreground">{analysis.translation?.literal || 'N/A'}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-1">Dịch nghĩa tự nhiên:</h5>
            <p className="text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded text-foreground">{analysis.translation?.natural || 'N/A'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Component skeleton cho loading state
 */
function SentenceAnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3"></div>
      
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
      <div className="h-20 bg-muted rounded w-full"></div>
      
      <div className="h-4 bg-muted rounded w-full"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-32 bg-muted rounded w-full"></div>
    </div>
  );
}

export default SentenceAnalysisDisplay;