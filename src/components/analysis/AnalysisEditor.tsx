import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  Zap, 
  Loader2,
  MousePointer
} from 'lucide-react';
import type { AnalysisEditorProps } from './types';
import { useState, useRef, useCallback } from 'react';

/**
 * Component editor với các nút phân tích
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Xử lý khi người dùng chọn văn bản
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    
    setSelectedText(selected);
    
    // Tự động xác định loại phân tích dựa trên độ dài
    if (selected.length > 0) {
      let newAnalysisType: 'word' | 'sentence' | 'paragraph';
      if (selected.split(' ').length === 1) {
        newAnalysisType = 'word';
      } else if (selected.split('.').length <= 2) {
        newAnalysisType = 'sentence';
      } else {
        newAnalysisType = 'paragraph';
      }
      
      setAnalysisType(newAnalysisType);
      onTextSelect?.(selected, newAnalysisType);
    }
  }, [text, onTextSelect]);

  // Xử lý khi người dùng click nút phân tích
  const handleAnalyze = useCallback(async () => {
    const textToAnalyze = selectedText || text;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    try {
      await onAnalyze?.(textToAnalyze, analysisType);
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

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Văn bản phân tích</h3>
          <div className="flex items-center gap-2">
            {selectedText && (
              <Badge variant="outline" className="text-xs">
                <MousePointer className="h-3 w-3 mr-1" />
                Đã chọn: {selectedText.length} ký tự
              </Badge>
            )}
          </div>
        </div>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          placeholder="Nhập hoặc dán văn bản cần phân tích vào đây..."
          className="min-h-[200px] resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-500">
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

      {selectedText && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Văn bản đã chọn</h4>
            <Badge variant="outline">{selectedText.length} ký tự</Badge>
          </div>
          
          <div className="bg-white p-3 rounded border-l-4 border-blue-500 mb-3">
            <p className="text-sm italic">"{selectedText}"</p>
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
              <p className="text-sm text-gray-600">
                Phân tích chi tiết từ vựng bao gồm định nghĩa, đồng nghĩa, trái nghĩa, và cách dùng trong ngữ cảnh.
              </p>
            </TabsContent>
            
            <TabsContent value="sentence" className="mt-3">
              <p className="text-sm text-gray-600">
                Phân tích cấu trúc ngữ pháp, ý nghĩa, và các gợi ý viết lại câu để cải thiện.
              </p>
            </TabsContent>
            
            <TabsContent value="paragraph" className="mt-3">
              <p className="text-sm text-gray-600">
                Phân tích toàn diện đoạn văn về cấu trúc, mạch lạc, phong cách và các góp ý cải thiện.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end">
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

export default AnalysisEditor;