import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  Zap, 
  Loader2,
  MousePointer,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { AnalysisEditorProps } from './types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Component editor cải tiến với UX tốt hơn
 */
export function ImprovedAnalysisEditor({ 
  onTextSelect, 
  onAnalyze,
  initialText = "",
  className = ""
}: AnalysisEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedText, setSelectedText] = useState('');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced analysis function
  const debouncedAnalysis = useCallback((textToAnalyze: string, type: 'word' | 'sentence' | 'paragraph') => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    analysisTimeoutRef.current = setTimeout(async () => {
      if (autoAnalysisEnabled && textToAnalyze.trim()) {
        setIsAnalyzing(true);
        setError(null);
        
        try {
          const result = await onAnalyze?.(textToAnalyze, type);
          setAnalysisResult(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Phân tích thất bại');
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 800); // 800ms debounce
  }, [autoAnalysisEnabled, onAnalyze]);

  // Xử lý khi người dùng chọn văn bản với cải tiến
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    
    setSelectedText(selected);
    setSelectionRange({ start, end });
    
    // Hiển thị tooltip cho selection
    if (selected.trim()) {
      setShowSelectionTooltip(true);
      
      // Tự động xác định loại phân tích dựa trên độ dài
      let newAnalysisType: 'word' | 'sentence' | 'paragraph';
      const wordCount = selected.split(/\s+/).filter(w => w.length > 0).length;
      const sentenceCount = selected.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      
      if (wordCount === 1) {
        newAnalysisType = 'word';
      } else if (sentenceCount <= 2) {
        newAnalysisType = 'sentence';
      } else {
        newAnalysisType = 'paragraph';
      }
      
      setAnalysisType(newAnalysisType);
      onTextSelect?.(selected, newAnalysisType);
      
      // Auto-analyze nếu được enable
      debouncedAnalysis(selected, newAnalysisType);
      
      // Ẩn tooltip sau 3 giây
      setTimeout(() => setShowSelectionTooltip(false), 3000);
    } else {
      setShowSelectionTooltip(false);
      setSelectionRange(null);
    }
  }, [text, onTextSelect, debouncedAnalysis]);

  // Xử lý khi người dùng click nút phân tích
  const handleAnalyze = useCallback(async () => {
    const textToAnalyze = selectedText || text;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await onAnalyze?.(textToAnalyze, analysisType);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedText, text, analysisType, onAnalyze]);

  // Lấy câu từ đoạn văn
  const getSentences = (text: string) => {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  };

  // Lấy đoạn văn từ văn bản
  const getParagraphs = (text: string) => {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0);
  };

  // Highlight selected text trong textarea (simulation)
  const getHighlightedText = () => {
    if (!selectionRange || !selectedText) return text;
    
    const before = text.substring(0, selectionRange.start);
    const selected = text.substring(selectionRange.start, selectionRange.end);
    const after = text.substring(selectionRange.end);
    
    return { before, selected, after };
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  const highlightedText = getHighlightedText();

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">Văn bản phân tích</h3>
          <div className="flex items-center gap-2">
            {selectedText && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                <MousePointer className="h-3 w-3 mr-1" />
                Đã chọn: {selectedText.length} ký tự
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoAnalysisEnabled(!autoAnalysisEnabled)}
              className={cn(
                "text-xs",
                autoAnalysisEnabled ? "bg-primary/10 border-primary/30" : ""
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto: {autoAnalysisEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSelect={handleTextSelection}
            onMouseUp={handleTextSelection}
            onKeyUp={handleTextSelection}
            placeholder="Nhập hoặc dán văn bản cần phân tích vào đây..."
            className="flex-1 resize-none min-h-[300px]"
          />
          
          {/* Selection tooltip */}
          {showSelectionTooltip && (
            <div className="absolute top-2 right-2 bg-background border rounded-lg shadow-lg p-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-xs">
                  {analysisType === 'word' ? 'Từ' : analysisType === 'sentence' ? 'Câu' : 'Đoạn'}
                </Badge>
                {autoAnalysisEnabled && (
                  <span className="text-muted-foreground">Đang phân tích...</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-muted-foreground">
            {text.length} ký tự • {text.split(/\s+/).filter(w => w.length > 0).length} từ • {getSentences(text).length} câu • {getParagraphs(text).length} đoạn
          </div>
          
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
      </Card>

      {/* Error display */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
              onClick={() => {
                setSelectedText('');
                setSelectionRange(null);
                setShowSelectionTooltip(false);
              }}
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

export default ImprovedAnalysisEditor;