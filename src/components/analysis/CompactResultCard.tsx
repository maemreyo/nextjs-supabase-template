import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  ChevronRight,
  CheckCircle,
  Loader2,
  Eye,
  TrendingUp,
  Target,
  Lightbulb,
  Star
} from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface CompactResultCardProps {
  analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
  isLoading: boolean;
  error: string | null;
  onViewDetails: () => void;
  className?: string;
}

export function CompactResultCard({ 
  analysis, 
  analysisType,
  isLoading, 
  error,
  onViewDetails,
  className = ""
}: CompactResultCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {analysisType === 'word' ? 'Từ' : analysisType === 'sentence' ? 'Câu' : 'Đoạn'}
            </Badge>
            <span className="text-sm text-muted-foreground">Đang phân tích...</span>
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-3 border-destructive/50 bg-destructive/10", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <div className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-xs font-bold">!</span>
          </div>
          <span className="text-sm">Lỗi phân tích</span>
        </div>
        <p className="text-xs text-destructive/80 mt-1">{error}</p>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  // Word Analysis Summary
  if (analysisType === 'word') {
    const wordAnalysis = analysis as WordAnalysis;
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="text-xs">Từ</Badge>
            <span className="font-medium text-sm">{wordAnalysis.meta.word}</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">{wordAnalysis.meta.pos}</Badge>
            <Badge variant="outline" className="text-xs">{wordAnalysis.meta.cefr}</Badge>
          </div>
        </div>
        
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span className="truncate">{wordAnalysis.definitions.context_meaning}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{wordAnalysis.relations.synonyms.length} đồng nghĩa • {wordAnalysis.relations.antonyms.length} trái nghĩa</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Phân tích hoàn tất</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="h-7 px-2 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Chi tiết
          </Button>
        </div>
      </Card>
    );
  }

  // Sentence Analysis Summary
  if (analysisType === 'sentence') {
    const sentenceAnalysis = analysis as SentenceAnalysis;
    const sentimentColor = sentenceAnalysis.semantics.sentiment === 'Positive' 
      ? 'text-green-600' 
      : sentenceAnalysis.semantics.sentiment === 'Negative' 
      ? 'text-red-600' 
      : 'text-gray-600';
    
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="text-xs">Câu</Badge>
            <Badge variant="secondary" className="text-xs">{sentenceAnalysis.meta.complexity_level}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={cn("text-xs", sentimentColor)}>
              {sentenceAnalysis.semantics.sentiment}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span className="truncate">{sentenceAnalysis.semantics.main_idea}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{sentenceAnalysis.rewrite_suggestions.length} gợi ý viết lại</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Phân tích hoàn tất</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="h-7 px-2 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Chi tiết
          </Button>
        </div>
      </Card>
    );
  }

  // Paragraph Analysis Summary
  if (analysisType === 'paragraph') {
    const paragraphAnalysis = analysis as ParagraphAnalysis;
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };
    
    const avgScore = Math.round(
      (paragraphAnalysis.coherence_and_cohesion.logic_score + 
       paragraphAnalysis.coherence_and_cohesion.flow_score) / 2
    );
    
    return (
      <Card className={cn("p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-purple-500" />
            <Badge variant="outline" className="text-xs">Đoạn</Badge>
            <Badge variant="secondary" className="text-xs">{paragraphAnalysis.meta.type}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">{paragraphAnalysis.meta.tone}</Badge>
          </div>
        </div>
        
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            <span className="truncate">{paragraphAnalysis.content_analysis.main_topic}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className={cn("h-3 w-3", getScoreColor(avgScore))} />
            <span className={getScoreColor(avgScore)}>Điểm: {avgScore}/100</span>
            <span className="text-muted-foreground">• {paragraphAnalysis.constructive_feedback.critiques.length} góp ý</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Phân tích hoàn tất</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewDetails} className="h-7 px-2 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Chi tiết
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}

export default CompactResultCard;