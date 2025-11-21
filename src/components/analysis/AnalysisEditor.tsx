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
export function AnalysisEditor({ 
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
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          // Ẩn tooltip sau khi phân tích hoàn thành
          setTimeout(() => setShowSelectionTooltip(false), 1000);
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
      
      // Xóa timeout cũ nếu có
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Chỉ ẩn tooltip sau 5 giây nếu không có phân tích nào diễn ra
      tooltipTimeoutRef.current = setTimeout(() => {
        if (!isAnalyzing) {
          setShowSelectionTooltip(false);
        }
      }, 5000);
    } else {
      setShowSelectionTooltip(false);
      setSelectionRange(null);
      // Xóa timeout khi không có selection
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
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
      // Ẩn tooltip sau khi phân tích hoàn thành
      setTimeout(() => setShowSelectionTooltip(false), 1000);
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
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
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
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    <span className="text-primary font-medium">Đang phân tích...</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Đã chọn văn bản</span>
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

    </div>
  );
}

export default AnalysisEditor;