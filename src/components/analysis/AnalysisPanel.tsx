import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageSquare,
  X,
  BookOpen,
  Save,
  FolderOpen
} from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
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
  const [vocabularyData, setVocabularyData] = useState({
    word: '',
    definition_en: '',
    definition_vi: '',
    difficulty_level: 1
  });

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

  // Handle add to vocabulary
  const handleAddToVocabulary = async () => {
    try {
      await createWord({
        ...vocabularyData,
        source_type: 'analysis' as const,
        source_reference: ''
      });
      setAddToVocabularyDialogOpen(false);
      setVocabularyData({ word: '', definition_en: '', definition_vi: '', difficulty_level: 1 });
      // Show success message - using a simple alert for now, could be replaced with a toast notification
      alert('Từ đã được thêm vào vocabulary thành công!');
    } catch (error) {
      console.error('Failed to add to vocabulary:', error);
      alert('Không thể thêm từ vào vocabulary. Vui lòng thử lại.');
    }
  };

  // Initialize vocabulary data when dialog opens
  const handleAddToVocabularyDialogOpen = () => {
    const word = getWordForVocabulary() || '';
    const definition = getDefinitionForVocabulary() || '';
    
    if (!word.trim()) {
      alert('Không tìm thấy từ để thêm vào vocabulary. Vui lòng phân tích một từ.');
      return;
    }
    
    setVocabularyData({
      word,
      definition_en: definition,
      definition_vi: '',
      difficulty_level: 1
    });
    setAddToVocabularyDialogOpen(true);
  };

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

            <Separator className="my-4" />
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={handleAddToVocabularyDialogOpen}
                variant="outline"
              >
                <BookOpen size={14} className="mr-1" />
                Thêm vào Vocab
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Add to Vocabulary Dialog */}
      <Dialog open={addToVocabularyDialogOpen} onOpenChange={setAddToVocabularyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm vào Vocabulary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="vocabulary-word">Từ</Label>
              <Input id="vocabulary-word" value={vocabularyData.word} onChange={(e) => setVocabularyData(prev => ({ ...prev, word: e.target.value }))} placeholder="Nhập từ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-definition">Định nghĩa (tiếng Anh)</Label>
              <Input id="vocabulary-definition" value={vocabularyData.definition_en} onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_en: e.target.value }))} placeholder="Nhập định nghĩa tiếng Anh..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-vietnamese">Dịch nghĩa (tiếng Việt)</Label>
              <Input id="vocabulary-vietnamese" value={vocabularyData.definition_vi} onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_vi: e.target.value }))} placeholder="Nhập dịch nghĩa tiếng Việt..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-difficulty">Mức độ khó</Label>
              <Select value={vocabularyData.difficulty_level.toString()} onValueChange={(v) => setVocabularyData(prev => ({ ...prev, difficulty_level: parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dễ</SelectItem>
                  <SelectItem value="2">Trung bình</SelectItem>
                  <SelectItem value="3">Khó</SelectItem>
                  <SelectItem value="4">Rất khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToVocabularyDialogOpen(false)}>Hủy</Button>
            <Button
              onClick={handleAddToVocabulary}
              disabled={!vocabularyData.word.trim() || !vocabularyData.definition_en.trim()}
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