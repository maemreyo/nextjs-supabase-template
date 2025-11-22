import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  X,
  BookOpen,
  FolderOpen,
  Info,
  AlertCircle
} from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState, useEffect } from 'react';
import { useVocabularyStore } from '@/stores/vocabulary-store';

interface AnalysisPanelProps {
  analysisPanelOpen: boolean;
  setAnalysisPanelOpen: (open: boolean) => void;
  analysisResult: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
  selectedText: string;
}

export function AnalysisPanel({
  analysisPanelOpen,
  setAnalysisPanelOpen,
  analysisResult,
  analysisType,
  selectedText
}: AnalysisPanelProps) {
  console.log('🔍 [DEBUG] AnalysisPanel - Component started', {
    analysisPanelOpen,
    hasAnalysisResult: !!analysisResult,
    analysisType,
    selectedText
  });
  const [addToVocabularyDialogOpen, setAddToVocabularyDialogOpen] = useState(false);
  const [vocabularyData, setVocabularyData] = useState<{
    word: string;
    content_type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    definition_en: string;
    definition_vi: string;
    difficulty_level: number;
    context_notes?: string;
    personal_notes?: string;
  }>({
    word: '',
    content_type: 'word',
    definition_en: '',
    definition_vi: '',
    difficulty_level: 1,
    context_notes: '',
    personal_notes: ''
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [suggestedContentType, setSuggestedContentType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');

  const { createWord } = useVocabularyStore();

  // Extract word from analysis result for vocabulary dialog
  const getWordForVocabulary = () => {
    if (analysisType === 'word' && analysisResult && 'meta' in analysisResult) {
      return (analysisResult as WordAnalysis).meta.word;
    }
    return selectedText.split(' ')[0]; // First word as fallback
  };

  // Extract definition for vocabulary dialog
  const getDefinitionForVocabulary = () => {
    if (analysisType === 'word' && analysisResult && 'definitions' in analysisResult) {
      return (analysisResult as WordAnalysis).definitions.root_meaning;
    }
    return '';
  };

  // Validate form data
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!vocabularyData.word.trim()) {
      errors.push('Nội dung không được để trống');
    }
    
    if (!vocabularyData.definition_en.trim()) {
      errors.push('Định nghĩa tiếng Anh không được để trống');
    }
    
    if (vocabularyData.content_type === 'word' && vocabularyData.word.trim().split(/\s+/).length > 1) {
      errors.push('Loại nội dung "Từ" chỉ nên chứa một từ');
    }
    
    if (vocabularyData.content_type === 'paragraph' && vocabularyData.word.trim().length < 50) {
      errors.push('Đoạn văn nên có ít nhất 50 ký tự');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle add to vocabulary
  const handleAddToVocabulary = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await createWord({
        ...vocabularyData,
        source_type: 'analysis' as const,
        source_reference: `${analysisType}-analysis-${Date.now()}`
      });
      setAddToVocabularyDialogOpen(false);
      setVocabularyData({
        word: '',
        content_type: 'word',
        definition_en: '',
        definition_vi: '',
        difficulty_level: 1,
        context_notes: '',
        personal_notes: ''
      });
      setValidationErrors([]);
      // Show success message - using a simple alert for now, could be replaced with a toast notification
      alert('Nội dung đã được thêm vào vocabulary thành công!');
    } catch (error) {
      console.error('Failed to add to vocabulary:', error);
      setValidationErrors(['Không thể thêm nội dung vào vocabulary. Vui lòng thử lại.']);
    }
  };

  // Get content based on analysis type
  const getContentForVocabulary = () => {
    if (analysisType === 'word' && analysisResult && 'meta' in analysisResult) {
      return (analysisResult as WordAnalysis).meta.word;
    } else if (analysisType === 'sentence' && analysisResult && 'meta' in analysisResult) {
      return (analysisResult as SentenceAnalysis).meta.sentence;
    } else if (analysisType === 'paragraph' && selectedText) {
      return selectedText;
    }
    return selectedText;
  };

  // Suggest content type based on content
  const suggestContentType = (content: string): 'word' | 'phrase' | 'sentence' | 'paragraph' => {
    const wordCount = content.trim().split(/\s+/).length;
    const charCount = content.trim().length;
    
    if (wordCount === 1) return 'word';
    if (wordCount <= 5 && charCount <= 50) return 'phrase';
    if (wordCount <= 20 && charCount <= 200) return 'sentence';
    return 'paragraph';
  };

  // Initialize vocabulary data when dialog opens
  const handleAddToVocabularyDialogOpen = () => {
    const content = getContentForVocabulary() || '';
    const definition = getDefinitionForVocabulary() || '';
    
    if (!content.trim()) {
      alert('Không tìm thấy nội dung để thêm vào vocabulary. Vui lòng phân tích nội dung.');
      return;
    }
    
    const suggestedType = suggestContentType(content);
    setSuggestedContentType(suggestedType);
    
    setVocabularyData({
      word: content,
      content_type: suggestedType,
      definition_en: definition,
      definition_vi: '',
      difficulty_level: 1,
      context_notes: `Nguồn: ${analysisType} analysis`,
      personal_notes: ''
    });
    setValidationErrors([]);
    setAddToVocabularyDialogOpen(true);
  };

  // Validate form when data changes
  useEffect(() => {
    if (addToVocabularyDialogOpen) {
      validateForm();
    }
  }, [vocabularyData, addToVocabularyDialogOpen]);

  if (!analysisPanelOpen || !analysisResult) {
    console.log('🔍 [DEBUG] AnalysisPanel - Early return', {
      analysisPanelOpen,
      hasAnalysisResult: !!analysisResult
    });
    return null;
  }

  console.log('🔍 [DEBUG] AnalysisPanel - About to render panel content');
  
  return (
    <>
      <div className="w-full border-l border-border bg-background">
        <div className="sticky top-0 bg-background border-b p-3 flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            Analysis
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setAnalysisPanelOpen(false)} className="h-6 w-6 p-0">
            <X size={14} />
          </Button>
        </div>
        
        {/* Add to Vocabulary Button - Prominent position at top */}
        <div className="p-3 border-b bg-primary/5">
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToVocabularyDialogOpen}
            variant="default"
          >
            <BookOpen size={14} className="mr-2" />
            Thêm vào Vocabulary
          </Button>
        </div>
        
        <ScrollArea className="flex-1 h-full">
          <div className="p-4">
            <Badge variant="secondary" className="text-xs mb-3">{analysisType}</Badge>
            
            <div className="p-3 bg-muted rounded border mb-4">
              <p className="font-medium text-sm">
                {analysisType === 'word' && (analysisResult as WordAnalysis)?.meta?.word}
                {analysisType === 'sentence' && (analysisResult as SentenceAnalysis)?.meta?.sentence}
                {analysisType === 'paragraph' && (analysisResult as ParagraphAnalysis)?.meta?.type}
              </p>
            </div>

            {analysisType === 'word' && analysisResult && 'meta' in analysisResult && (
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Pronunciation</h4>
                  <p className="text-primary font-mono">{(analysisResult as WordAnalysis).meta.ipa}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Definition</h4>
                  <p className="text-foreground">{(analysisResult as WordAnalysis).definitions.root_meaning}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Vietnamese</h4>
                  <p className="text-foreground">{(analysisResult as WordAnalysis).definitions.vietnamese_translation}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Example</h4>
                  <p className="text-muted-foreground italic">{(analysisResult as WordAnalysis).usage.example_sentence}</p>
                </div>
              </div>
            )}

            {analysisType === 'sentence' && analysisResult && 'meta' in analysisResult && (
              <div className="space-y-3 text-sm">
                {(() => {
                  const sentenceAnalysis = analysisResult as SentenceAnalysis;
                  // Log để debug khi semantics undefined
                  if (!sentenceAnalysis.semantics) {
                    console.warn('DEBUG: semantics is undefined in SentenceAnalysis:', sentenceAnalysis);
                  }
                  if (!sentenceAnalysis.translation) {
                    console.warn('DEBUG: translation is undefined in SentenceAnalysis:', sentenceAnalysis);
                  }
                  return null;
                })()}
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Complexity</h4>
                  <Badge variant="outline" className="text-xs">{(analysisResult as SentenceAnalysis).meta.complexity_level}</Badge>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Main Idea</h4>
                  <p className="text-foreground">{(analysisResult as SentenceAnalysis).semantics?.main_idea || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Sentiment</h4>
                  <Badge variant="outline" className="text-xs">{(analysisResult as SentenceAnalysis).semantics?.sentiment || 'N/A'}</Badge>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Translation</h4>
                  <p className="text-foreground">{(analysisResult as SentenceAnalysis).translation?.natural || 'N/A'}</p>
                </div>
              </div>
            )}

            {analysisType === 'paragraph' && analysisResult && 'meta' in analysisResult && (
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Type</h4>
                  <Badge variant="outline" className="text-xs">{(analysisResult as ParagraphAnalysis).meta.type}</Badge>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Tone</h4>
                  <Badge variant="outline" className="text-xs">{(analysisResult as ParagraphAnalysis).meta.tone}</Badge>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Main Topic</h4>
                  <p className="text-foreground">{(analysisResult as ParagraphAnalysis).content_analysis.main_topic}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1">Keywords</h4>
                  <div className="flex flex-wrap gap-1">
                    {(analysisResult as ParagraphAnalysis).content_analysis.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </div>

      {/* Add to Vocabulary Dialog */}
      <Dialog open={addToVocabularyDialogOpen} onOpenChange={setAddToVocabularyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Thêm vào Vocabulary
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 p-6">
            {/* Content Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Loại nội dung</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'word', label: 'Từ', description: 'Một từ đơn' },
                  { value: 'phrase', label: 'Cụm từ', description: '2-5 từ' },
                  { value: 'sentence', label: 'Câu', description: 'Một câu hoàn chỉnh' },
                  { value: 'paragraph', label: 'Đoạn', description: 'Nhiều câu' }
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={vocabularyData.content_type === type.value ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col items-start"
                    onClick={() => setVocabularyData(prev => ({ ...prev, content_type: type.value as any }))}
                  >
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs opacity-70 mt-1">{type.description}</span>
                  </Button>
                ))}
              </div>
              
              {suggestedContentType !== vocabularyData.content_type && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Gợi ý: Dựa trên nội dung, loại "{suggestedContentType === 'word' ? 'Từ' : suggestedContentType === 'phrase' ? 'Cụm từ' : suggestedContentType === 'sentence' ? 'Câu' : 'Đoạn'}" có thể phù hợp hơn.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Xem trước nội dung</Label>
              <div className="p-3 bg-muted rounded border">
                <p className="text-sm">{vocabularyData.word}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vocabularyData.word.trim().split(/\s+/).length} từ • {vocabularyData.word.length} ký tự
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Content */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vocabulary-content">Nội dung *</Label>
                <Textarea
                  id="vocabulary-content"
                  value={vocabularyData.word}
                  onChange={(e) => setVocabularyData(prev => ({ ...prev, word: e.target.value }))}
                  placeholder="Nhập nội dung..."
                  className={validationErrors.some(e => e.includes('Nội dung')) ? 'border-destructive' : ''}
                  rows={vocabularyData.content_type === 'paragraph' ? 4 : 2}
                />
              </div>

              {/* Definition English */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vocabulary-definition">Định nghĩa (tiếng Anh) *</Label>
                <Input
                  id="vocabulary-definition"
                  value={vocabularyData.definition_en}
                  onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_en: e.target.value }))}
                  placeholder="Nhập định nghĩa tiếng Anh..."
                  className={validationErrors.some(e => e.includes('Định nghĩa')) ? 'border-destructive' : ''}
                />
              </div>

              {/* Definition Vietnamese */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vocabulary-vietnamese">Định nghĩa (tiếng Việt)</Label>
                <Input
                  id="vocabulary-vietnamese"
                  value={vocabularyData.definition_vi}
                  onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_vi: e.target.value }))}
                  placeholder="Nhập định nghĩa tiếng Việt..."
                />
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label htmlFor="vocabulary-difficulty">Mức độ khó</Label>
                <Select
                  value={vocabularyData.difficulty_level.toString()}
                  onValueChange={(v) => setVocabularyData(prev => ({ ...prev, difficulty_level: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Dễ (1)</SelectItem>
                    <SelectItem value="2">Trung bình (2)</SelectItem>
                    <SelectItem value="3">Khó (3)</SelectItem>
                    <SelectItem value="4">Rất khó (4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional fields for specific content types */}
              {vocabularyData.content_type === 'word' && (
                <div className="space-y-2">
                  <Label htmlFor="vocabulary-pos">Loại từ</Label>
                  <Select defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại từ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Không xác định</SelectItem>
                      <SelectItem value="noun">Danh từ</SelectItem>
                      <SelectItem value="verb">Động từ</SelectItem>
                      <SelectItem value="adjective">Tính từ</SelectItem>
                      <SelectItem value="adverb">Trạng từ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Context Notes */}
            <div className="space-y-2">
              <Label htmlFor="vocabulary-context">Ghi chú ngữ cảnh</Label>
              <Textarea
                id="vocabulary-context"
                value={vocabularyData.context_notes || ''}
                onChange={(e) => setVocabularyData(prev => ({ ...prev, context_notes: e.target.value }))}
                placeholder="Thêm ghi chú về ngữ cảnh sử dụng..."
                rows={2}
              />
            </div>

            {/* Personal Notes */}
            <div className="space-y-2">
              <Label htmlFor="vocabulary-personal">Ghi chú cá nhân</Label>
              <Textarea
                id="vocabulary-personal"
                value={vocabularyData.personal_notes || ''}
                onChange={(e) => setVocabularyData(prev => ({ ...prev, personal_notes: e.target.value }))}
                placeholder="Thêm ghi chú cá nhân..."
                rows={2}
              />
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToVocabularyDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAddToVocabulary}
              disabled={validationErrors.length > 0}
            >
              <FolderOpen size={14} className="mr-2" />
              Thêm vào Vocabulary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
  
  console.log('🔍 [DEBUG] AnalysisPanel - Component finished');
}

export default AnalysisPanel;