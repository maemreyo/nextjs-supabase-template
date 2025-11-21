import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  Zap, 
  Loader2,
  MousePointer,
  AlertCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import type { AnalysisEditorProps } from './types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';

interface SelectionInfo {
  text: string;
  type: 'word' | 'sentence' | 'paragraph';
  wordCount: number;
  characterCount: number;
}

/**
 * Component editor cuối cùng với UX tối ưu
 */
export function FinalAnalysisEditor({ 
  onTextSelect, 
  onAnalyze,
  initialText = "",
  className = ""
}: AnalysisEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  const [lastSelectionInfo, setLastSelectionInfo] = useState<SelectionInfo | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized analysis hook
  const {
    isAnalyzing,
    currentAnalysis,
    error,
    analyzeText,
    analyzeTextDebounced,
    cancelAnalysis,
    retryAnalysis
  } = useOptimizedAnalysis({
    debounceMs: 800,
    enableAutoAnalysis: autoAnalysisEnabled,
    onSuccess: (result) => {
      onAnalyze?.(selectedText, analysisType);
    },
    onError: (err) => {
      console.error('Analysis error:', err);
    }
  });

  // Determine analysis type based on selection
  const determineAnalysisType = useCallback((text: string): 'word' | 'sentence' | 'paragraph' => {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    if (wordCount === 1) {
      return 'word';
    } else if (sentenceCount <= 2) {
      return 'sentence';
    } else {
      return 'paragraph';
    }
  }, []);

  // Enhanced text selection handler
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    
    if (selected.trim()) {
      setSelectedText(selected);
      setSelectionRange({ start, end });
      
      const newAnalysisType = determineAnalysisType(selected);
      setAnalysisType(newAnalysisType);
      
      const wordCount = selected.split(/\s+/).filter(w => w.length > 0).length;
      const selectionInfo: SelectionInfo = {
        text: selected,
        type: newAnalysisType,
        wordCount,
        characterCount: selected.length
      };
      
      setLastSelectionInfo(selectionInfo);
      
      // Show tooltip with animation
      setShowSelectionTooltip(true);
      
      // Clear existing tooltip timeout
      if (selectionTooltipTimeoutRef.current) {
        clearTimeout(selectionTooltipTimeoutRef.current);
      }
      
      // Hide tooltip after 3 seconds
      selectionTooltipTimeoutRef.current = setTimeout(() => {
        setShowSelectionTooltip(false);
      }, 3000);
      
      // Notify parent
      onTextSelect?.(selected, newAnalysisType);
      
      // Trigger debounced analysis if enabled
      if (autoAnalysisEnabled) {
        analyzeTextDebounced(selected, newAnalysisType);
      }
    } else {
      setSelectedText('');
      setSelectionRange(null);
      setShowSelectionTooltip(false);
      setLastSelectionInfo(null);
      
      if (selectionTooltipTimeoutRef.current) {
        clearTimeout(selectionTooltipTimeoutRef.current);
      }
    }
  }, [text, determineAnalysisType, onTextSelect, autoAnalysisEnabled, analyzeTextDebounced]);

  // Manual analysis trigger
  const handleAnalyze = useCallback(async () => {
    const textToAnalyze = selectedText || text;
    if (!textToAnalyze.trim()) return;

    try {
      await analyzeText(textToAnalyze, analysisType);
    } catch (err) {
      // Error is handled by the hook
    }
  }, [selectedText, text, analysisType, analyzeText]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedText('');
    setSelectionRange(null);
    setShowSelectionTooltip(false);
    setLastSelectionInfo(null);
    
    if (selectionTooltipTimeoutRef.current) {
      clearTimeout(selectionTooltipTimeoutRef.current);
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Get text statistics
  const getTextStats = useCallback(() => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    return {
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length
    };
  }, [text]);

  const stats = getTextStats();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectionTooltipTimeoutRef.current) {
        clearTimeout(selectionTooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Văn bản phân tích</h3>
          <div className="flex items-center gap-2">
            {lastSelectionInfo && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                <MousePointer className="h-3 w-3 mr-1" />
                {lastSelectionInfo.type === 'word' ? 'Từ' : lastSelectionInfo.type === 'sentence' ? 'Câu' : 'Đoạn'}: {lastSelectionInfo.wordCount} từ
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoAnalysisEnabled(!autoAnalysisEnabled)}
              className={cn(
                "text-xs transition-colors",
                autoAnalysisEnabled ? "bg-primary/10 border-primary/30 text-primary" : ""
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto: {autoAnalysisEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Nhập hoặc dán văn bản cần phân tích vào đây..."
            className="min-h-[200px] resize-none pr-12"
          />
          
          {/* Selection indicator */}
          {selectionRange && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
          
          {/* Enhanced selection tooltip */}
          {showSelectionTooltip && lastSelectionInfo && (
            <div className="absolute top-2 right-8 bg-background border rounded-lg shadow-lg p-3 z-10 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {lastSelectionInfo.type === 'word' ? 'Từ' : lastSelectionInfo.type === 'sentence' ? 'Câu' : 'Đoạn'}
                  </Badge>
                  {autoAnalysisEnabled && isAnalyzing && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lastSelectionInfo.wordCount} từ • {lastSelectionInfo.characterCount} ký tự
                </div>
                {autoAnalysisEnabled && !isAnalyzing && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sẽ phân tích tự động
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">
            {stats.characters} ký tự • {stats.words} từ • {stats.sentences} câu • {stats.paragraphs} đoạn
          </div>
          
          <div className="flex items-center gap-2">
            {selectedText && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={isAnalyzing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Xóa chọn
              </Button>
            )}
            
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Phân tích
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress indicator for analysis */}
        {isAnalyzing && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Đang phân tích {analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn'}...</span>
              <span className="text-xs text-muted-foreground">AI đang xử lý</span>
            </div>
            <Progress value={undefined} className="h-1" />
          </div>
        )}
      </Card>

      {/* Error display with retry */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={retryAnalysis}
              className="ml-2 text-destructive border-destructive/30 hover:bg-destructive/20"
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success indicator */}
      {currentAnalysis && !isAnalyzing && !error && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Phân tích {analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn'} hoàn tất!
          </AlertDescription>
        </Alert>
      )}

      {selectedText && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Văn bản đã chọn</h4>
            <Badge variant="outline">{selectedText.length} ký tự</Badge>
          </div>
          
          <div className="bg-background p-3 rounded border-l-4 border-primary mb-3">
            <p className="text-sm italic text-foreground">"{selectedText}"</p>
          </div>

          <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="word" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Từ
              </TabsTrigger>
              
              <TabsTrigger value="sentence" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Câu
              </TabsTrigger>
              
              <TabsTrigger value="paragraph" className="flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                Đoạn
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="word" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Phân tích chi tiết từ vựng bao gồm định nghĩa, đồng nghĩa, trái nghĩa, và cách dùng trong ngữ cảnh.
              </p>
            </TabsContent>
            
            <TabsContent value="sentence" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Phân tích cấu trúc ngữ pháp, ý nghĩa, và các gợi ý viết lại câu để cải thiện.
              </p>
            </TabsContent>
            
            <TabsContent value="paragraph" className="mt-3">
              <p className="text-sm text-muted-foreground">
                Phân tích toàn diện đoạn văn về cấu trúc, mạch lạc, phong cách và các góp ý cải thiện.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              disabled={isAnalyzing}
            >
              Xóa lựa chọn
            </Button>
            
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Phân tích {analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn'}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default FinalAnalysisEditor;