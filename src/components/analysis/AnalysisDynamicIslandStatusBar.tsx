import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Eye,
  BookOpen,
  FileText,
  FilePlus,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from '@/lib/ai/types';

// Types for the component
interface AnalysisDynamicIslandStatusBarProps {
  isVisible: boolean;
  isAnalyzing: boolean;
  analysisResult: {
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
  } | null;
  error: string | null;
  onClose: () => void;
  onViewDetails: () => void;
  progress?: number; // Optional progress for loading state
  className?: string;
}

type StatusState = 'idle' | 'loading' | 'success' | 'error';

export function AnalysisDynamicIslandStatusBar({
  isVisible,
  isAnalyzing,
  analysisResult,
  error,
  onClose,
  onViewDetails,
  progress = 0,
  className = ""
}: AnalysisDynamicIslandStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<StatusState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const statusBarRef = useRef<HTMLDivElement>(null);

  // Update status based on props
  useEffect(() => {
    if (isAnalyzing) {
      setStatus('loading');
    } else if (error) {
      setStatus('error');
    } else if (analysisResult) {
      setStatus('success');
    } else {
      setStatus('idle');
    }
  }, [isAnalyzing, error, analysisResult]);

  // Handle touch/mouse events for swipe down gesture
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const diff = currentY - startY;
    // If dragged down more than 50px, close the status bar
    if (diff > 50) {
      onClose();
    }
    
    setIsDragging(false);
    setCurrentY(0);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) {
      setCurrentY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = currentY - startY;
    // If dragged down more than 50px, close the status bar
    if (diff > 50) {
      onClose();
    }
    
    setIsDragging(false);
    setCurrentY(0);
  };

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  // Calculate transform for drag effect
  const transform = isDragging ? `translateY(${Math.max(0, currentY - startY)}px)` : '';
  const opacity = isDragging ? Math.max(0.5, 1 - (currentY - startY) / 100) : 1;

  // Render loading state
  if (status === 'loading') {
    return (
      <div
        ref={statusBarRef}
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
          isDragging ? "" : "animate-in fade-in slide-in-from-bottom-4",
          className
        )}
        style={{
          transform,
          opacity,
          minWidth: '200px',
          maxWidth: '400px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="p-4 shadow-lg border-2 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Đang phân tích...</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-2 mb-2" />
          
          {isExpanded && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Hệ thống đang phân tích văn bản của bạn...</p>
              <p className="mt-1">Vui lòng đợi trong giây lát.</p>
            </div>
          )}
          
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render error state
  if (status === 'error') {
    return (
      <div
        ref={statusBarRef}
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
          isDragging ? "" : "animate-in fade-in slide-in-from-bottom-4",
          className
        )}
        style={{
          transform,
          opacity,
          minWidth: '200px',
          maxWidth: '400px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="p-4 shadow-lg border-2 border-destructive/50 bg-destructive/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs font-bold text-destructive">!</span>
              </div>
              <span className="text-sm font-medium text-destructive">Lỗi phân tích</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-xs text-destructive/80 mb-2">{error || 'Đã xảy ra lỗi không xác định'}</p>
          
          <div className="flex justify-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render success state with analysis result
  if (status === 'success' && analysisResult) {
    const { type, data } = analysisResult;
    
    // Get icon and color based on analysis type
    const getIconAndColor = () => {
      switch (type) {
        case 'word':
          return { icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950', label: 'Từ' };
        case 'phrase':
          return { icon: BookOpen, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-950', label: 'Cụm từ' };
        case 'sentence':
          return { icon: FileText, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-950', label: 'Câu' };
        case 'paragraph':
          return { icon: FilePlus, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950', label: 'Đoạn' };
        default:
          return { icon: BookOpen, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-950', label: 'N/A' };
      }
    };
    
    const { icon: Icon, color, bgColor, label } = getIconAndColor();
    
    // Get summary information based on analysis type
    const getSummaryInfo = () => {
      switch (type) {
        case 'word':
          const wordAnalysis = data as WordAnalysis;
          return {
            title: wordAnalysis.meta.word,
            subtitle: `${wordAnalysis.meta.pos} • ${wordAnalysis.meta.cefr}`,
            detail: wordAnalysis.definitions.context_meaning
          };
        case 'phrase':
          const phraseAnalysis = data as PhraseAnalysis;
          return {
            title: phraseAnalysis.meta.phrase,
            subtitle: `${phraseAnalysis.meta.pos} • ${phraseAnalysis.meta.cefr}`,
            detail: phraseAnalysis.definitions.vietnamese_translation
          };
        case 'sentence':
          const sentenceAnalysis = data as SentenceAnalysis;
          const sentiment = sentenceAnalysis.semantics?.sentiment || 'N/A';
          const sentimentColor = sentiment === 'Positive'
            ? 'text-green-600'
            : sentiment === 'Negative'
            ? 'text-red-600'
            : 'text-gray-600';
          return {
            title: 'Phân tích câu',
            subtitle: `${sentenceAnalysis.meta.complexity_level} • ${sentiment}`,
            detail: sentenceAnalysis.semantics?.main_idea || 'N/A',
            sentimentColor
          };
        case 'paragraph':
          const paragraphAnalysis = data as ParagraphAnalysis;
          const avgScore = Math.round(
            (paragraphAnalysis.coherence_and_cohesion.logic_score + 
             paragraphAnalysis.coherence_and_cohesion.flow_score) / 2
          );
          const getScoreColor = (score: number) => {
            if (score >= 80) return 'text-green-600';
            if (score >= 60) return 'text-yellow-600';
            return 'text-red-600';
          };
          return {
            title: 'Phân tích đoạn',
            subtitle: `${paragraphAnalysis.meta.type} • ${paragraphAnalysis.meta.tone}`,
            detail: paragraphAnalysis.content_analysis.main_topic,
            score: avgScore,
            scoreColor: getScoreColor(avgScore)
          };
        default:
          return {
            title: 'N/A',
            subtitle: '',
            detail: ''
          };
      }
    };
    
    const summaryInfo = getSummaryInfo();
    
    return (
      <div
        ref={statusBarRef}
        className={cn(
          "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
          isDragging ? "" : "animate-in fade-in slide-in-from-bottom-4",
          className
        )}
        style={{
          transform,
          opacity,
          minWidth: '200px',
          maxWidth: '400px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className={cn("p-4 shadow-lg border-2 bg-background/95 backdrop-blur-sm", bgColor)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", color)} />
              <Badge variant="outline" className="text-xs">{label}</Badge>
              <span className="font-medium text-sm truncate max-w-[120px]">{summaryInfo.title}</span>
            </div>
            <div className="flex items-center gap-1">
              {type === 'paragraph' && summaryInfo.score && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={cn("h-3 w-3", summaryInfo.scoreColor)} />
                  <span className={cn("text-xs font-medium", summaryInfo.scoreColor)}>
                    {summaryInfo.score}/100
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{summaryInfo.subtitle}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              <span className="truncate">{summaryInfo.detail}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Phân tích hoàn tất</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onViewDetails} className="h-7 px-2 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Chi tiết
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/50">
              {type === 'word' && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{(data as WordAnalysis).relations.synonyms.length} đồng nghĩa • {(data as WordAnalysis).relations.antonyms.length} trái nghĩa</span>
                  </div>
                </div>
              )}
              
              {type === 'sentence' && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{(data as SentenceAnalysis).rewrite_suggestions?.length || 0} gợi ý viết lại</span>
                  </div>
                </div>
              )}
              
              {type === 'paragraph' && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{(data as ParagraphAnalysis).constructive_feedback.critiques.length} góp ý</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Default case (shouldn't happen)
  return null;
}

export default AnalysisDynamicIslandStatusBar;