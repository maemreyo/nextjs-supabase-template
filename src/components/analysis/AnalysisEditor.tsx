import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  FileText,
  FilePlus,
  Zap,
  Loader2,
  MousePointer,
  AlertCircle,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Code,
  Highlighter,
  Volume2,
  BookMarked,
  MessageSquare,
  X,
  Save,
  FolderOpen
} from 'lucide-react';
import type { AnalysisEditorProps, WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';
import { useVocabularyStore } from '@/stores/vocabulary-store';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Component editor cải tiến với rich text editing và UX tốt hơn
 */
export function AnalysisEditor({ 
  onTextSelect, 
  onAnalyze,
  initialText = "",
  className = ""
}: AnalysisEditorProps) {
  // Text content and selection states
  const [content, setContent] = useState(initialText);
  const [selectedText, setSelectedText] = useState('');
  const [selectionType, setSelectionType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  
  // UI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  
  // Session and vocabulary dialog states
  const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
  const [addToVocabularyDialogOpen, setAddToVocabularyDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [vocabularyData, setVocabularyData] = useState({
    word: '',
    definition_en: '',
    definition_vi: '',
    difficulty_level: 1
  });
  
  // Rich text editor states
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });
  
  // Menu positions
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ x: 0, y: 0, show: false });
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectionRef = useRef<{ range: Range | null; text: string }>({ range: null, text: '' });

  // Session and vocabulary stores
  const { sessions, createSession, addAnalysisToSession } = useSessionStore();
  const { createWord } = useVocabularyStore();

  // Highlight colors
  const highlightColors = [
    '#fef08a', // yellow
    '#bbf7d0', // green
    '#bfdbfe', // blue
    '#fecaca', // red
    '#e9d5ff', // purple
  ];

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
          if (result) {
            setAnalysisResult(result);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Phân tích thất bại');
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 800); // 800ms debounce
  }, [autoAnalysisEnabled, onAnalyze]);

  // Save and restore selection
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      selectionRef.current = {
        range: range.cloneRange(),
        text: sel.toString()
      };
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && selectionRef.current.range && editorRef.current && editorRef.current.contains(selectionRef.current.range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current.range);
    }
  }, []);

  // Detect selection type
  const detectSelectionType = useCallback((text: string): 'word' | 'phrase' | 'sentence' | 'paragraph' => {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).length;
    const sentenceCount = (trimmed.match(/[.!?]+/g) || []).length;
    const hasNewlines = /\n\n/.test(trimmed);
    
    if (hasNewlines || sentenceCount > 2) return 'paragraph';
    if (sentenceCount >= 1) return 'sentence';
    if (wordCount > 1) return 'phrase';
    return 'word';
  }, []);

  // Smart text expansion functions
  const expandToWord = useCallback(() => {
    // Save current selection before expansion
    saveSelection();
    
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    let start = range.startOffset, end = range.endOffset;
    
    while (start > 0 && text[start - 1] && /\w/.test(text[start - 1]!)) start--;
    while (end < text.length && text[end] && /\w/.test(text[end]!)) end++;
    
    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, end);
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Save new selection after expansion
    saveSelection();
    handleTextSelection();
  }, [saveSelection]);

  const expandToSentence = useCallback(() => {
    // Save current selection before expansion
    saveSelection();
    
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    let start = range.startOffset, end = range.endOffset;
    
    while (start > 0 && text[start - 1] && !/[.!?]/.test(text[start - 1]!)) start--;
    while (end < text.length && text[end] && !/[.!?]/.test(text[end]!)) end++;
    if (end < text.length) end++;
    
    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, Math.min(end, text.length));
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Save new selection after expansion
    saveSelection();
    handleTextSelection();
  }, [saveSelection]);

  const expandToParagraph = useCallback(() => {
    // Save current selection before expansion
    saveSelection();
    
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    let node = sel.anchorNode;
    while (node && node.nodeName !== 'P' && node.nodeName !== 'DIV' && node.parentNode) {
      node = node.parentNode;
    }
    
    if (node && (node.nodeName === 'P' || node.nodeName === 'DIV')) {
      const range = document.createRange();
      range.selectNodeContents(node);
      sel.removeAllRanges();
      sel.addRange(range);
      
      // Save new selection after expansion
      saveSelection();
      handleTextSelection();
    }
  }, [saveSelection]);

  // Handle text selection with improvements
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel) return;
    
    const text = sel.toString().trim();
    
    if (text.length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Save selection before state updates
      saveSelection();
      
      setSelectedText(text);
      const detectedType = detectSelectionType(text);
      setSelectionType(detectedType);
      
      // Map to analysis type
      let newAnalysisType: 'word' | 'sentence' | 'paragraph';
      if (detectedType === 'word') {
        newAnalysisType = 'word';
      } else if (detectedType === 'phrase' || detectedType === 'sentence') {
        newAnalysisType = 'sentence';
      } else {
        newAnalysisType = 'paragraph';
      }
      
      setAnalysisType(newAnalysisType);
      setBubbleMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        show: true
      });
      
      onTextSelect?.(text, newAnalysisType);
      
      // Auto-analyze if enabled
      debouncedAnalysis(text, newAnalysisType);
    } else {
      setBubbleMenuPosition({ x: 0, y: 0, show: false });
      setSelectedText('');
    }
  }, [detectSelectionType, onTextSelect, debouncedAnalysis, saveSelection]);

  // Rich text formatting functions
  const formatText = useCallback((cmd: string, val: string | undefined = undefined) => {
    // Save selection before formatting
    saveSelection();
    
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    
    // Update formats without causing re-render
    const newFormats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    };
    setActiveFormats(newFormats);
    
    // Restore selection after formatting
    setTimeout(restoreSelection, 0);
  }, [saveSelection, restoreSelection]);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  const handleHighlight = useCallback((color: string) => {
    // Save selection before highlighting
    saveSelection();
    
    document.execCommand('hiliteColor', false, color);
    setBubbleMenuPosition(prev => ({ ...prev, show: false }));
    
    // Restore selection after highlighting
    setTimeout(restoreSelection, 0);
  }, [saveSelection, restoreSelection]);

  // Handle analysis
  const handleAnalyze = useCallback(async () => {
    // Save selection before analysis
    saveSelection();
    
    const textToAnalyze = selectedText || content;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisPanelOpen(true);
    
    try {
      const result = await onAnalyze?.(textToAnalyze, analysisType);
      if (result) {
        setAnalysisResult(result);
      }
      setBubbleMenuPosition(prev => ({ ...prev, show: false }));
      
      // Restore selection after analysis completes
      setTimeout(restoreSelection, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedText, content, analysisType, onAnalyze, saveSelection, restoreSelection]);

  // Handle content change
  const handleContentChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    // Save selection before content update
    saveSelection();
    
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    updateActiveFormats();
    
    // Restore selection after content update
    setTimeout(restoreSelection, 0);
  }, [updateActiveFormats, saveSelection, restoreSelection]);

  // Get text statistics - memoized to prevent unnecessary recalculations
  const getTextStats = useMemo(() => {
    const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    return {
      characters: textContent.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length
    };
  }, [content]);

  // Setup event listeners
  useEffect(() => {
    const onMouseUp = () => {
      // Save selection immediately on mouse up
      saveSelection();
      // Handle text selection after a short delay
      setTimeout(handleTextSelection, 10);
    };
    
    const onSelectStart = () => {
      saveSelection();
    };
    
    const onKeyDown = (e: KeyboardEvent) => {
      // Save selection on keyboard navigation
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
          e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
        saveSelection();
      }
    };
    
    const onSelectionChange = () => {
      // Save selection whenever it changes
      saveSelection();
    };
    
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('selectionchange', onSelectionChange);
    
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('selectionchange', onSelectionChange);
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [handleTextSelection, saveSelection]);

  // Initialize content - only run once
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      // Save selection before updating content
      saveSelection();
      editorRef.current.innerHTML = content;
      // Restore selection after content update
      setTimeout(restoreSelection, 0);
    }
  }, []);

  // Restore selection after component updates
  useEffect(() => {
    // Only restore selection if we have a saved one and it's valid
    if (selectionRef.current.range && editorRef.current) {
      // Check if the selection is still valid within the editor
      const startContainer = selectionRef.current.range.startContainer;
      if (editorRef.current.contains(startContainer)) {
        setTimeout(restoreSelection, 0);
      }
    }
  }, [content, restoreSelection]);

  const textStats = getTextStats;

  // Toolbar button component
  const ToolBtn = ({ onClick, active, disabled, children, title }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 h-8 w-8",
        active && "bg-muted",
        disabled && "opacity-40"
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center gap-1 flex-wrap">
          {/* Text formatting */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn 
              onClick={() => formatText('bold')} 
              active={activeFormats.bold} 
              title="Bold"
            >
              <Bold size={16} />
            </ToolBtn>
            <ToolBtn 
              onClick={() => formatText('italic')} 
              active={activeFormats.italic} 
              title="Italic"
            >
              <Italic size={16} />
            </ToolBtn>
            <ToolBtn 
              onClick={() => formatText('underline')} 
              active={activeFormats.underline} 
              title="Underline"
            >
              <Underline size={16} />
            </ToolBtn>
            <ToolBtn 
              onClick={() => formatText('strikeThrough')} 
              active={activeFormats.strikeThrough} 
              title="Strike"
            >
              <Strikethrough size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('removeFormat')} title="Clear">
              <Code size={16} />
            </ToolBtn>
          </div>

          {/* Lists and structure */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('insertUnorderedList')} title="Bullet list">
              <List size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('insertOrderedList')} title="Ordered list">
              <ListOrdered size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('formatBlock', 'blockquote')} title="Quote">
              <Quote size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('insertHorizontalRule')} title="Horizontal rule">
              <Minus size={16} />
            </ToolBtn>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('undo')} title="Undo">
              <Undo size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('redo')} title="Redo">
              <Redo size={16} />
            </ToolBtn>
          </div>

          {/* Smart expansion */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandToWord}
              className="text-xs px-2 py-1 h-7"
            >
              Word
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={expandToSentence}
              className="text-xs px-2 py-1 h-7"
            >
              Sentence
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={expandToParagraph}
              className="text-xs px-2 py-1 h-7"
            >
              Paragraph
            </Button>
          </div>

          {/* Highlight colors */}
          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            {highlightColors.map(color => (
              <button
                key={color}
                onClick={() => handleHighlight(color)}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Highlight with ${color}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="ml-auto flex items-center gap-2">
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
                "text-xs h-7",
                autoAnalysisEnabled ? "bg-primary/10 border-primary/30" : ""
              )}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto: {autoAnalysisEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div
                ref={editorRef}
                contentEditable
                className="min-h-96 p-6 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 prose max-w-none"
                onInput={handleContentChange}
                onKeyUp={updateActiveFormats}
                onClick={updateActiveFormats}
                onMouseDown={saveSelection}
                onFocus={saveSelection}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          {/* Analysis Panel */}
          {analysisPanelOpen && analysisResult && (
            <div className="w-80 border-l border-border bg-background">
              <div className="sticky top-0 bg-background border-b p-3 flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  Analysis
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAnalysisPanelOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 h-full">
                <div className="p-4">
                  <Badge variant="secondary" className="text-xs mb-3">
                    {analysisType}
                  </Badge>
                  
                  <div className="p-3 bg-muted rounded border mb-4">
                    <p className="font-medium text-sm">
                      {analysisType === 'word' && (analysisResult as WordAnalysis)?.meta?.word}
                      {analysisType === 'sentence' && (analysisResult as SentenceAnalysis)?.meta?.sentence}
                      {analysisType === 'paragraph' && (analysisResult as ParagraphAnalysis)?.meta?.type}
                    </p>
                  </div>

                  {/* Word Analysis Display */}
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

                  {/* Sentence Analysis Display */}
                  {analysisType === 'sentence' && analysisResult && 'meta' in analysisResult && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Complexity</h4>
                        <Badge variant="outline" className="text-xs">
                          {(analysisResult as SentenceAnalysis).meta.complexity_level}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Main Idea</h4>
                        <p className="text-foreground">{(analysisResult as SentenceAnalysis).semantics.main_idea}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Sentiment</h4>
                        <Badge variant="outline" className="text-xs">
                          {(analysisResult as SentenceAnalysis).semantics.sentiment}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Translation</h4>
                        <p className="text-foreground">{(analysisResult as SentenceAnalysis).translation.natural}</p>
                      </div>
                    </div>
                  )}

                  {/* Paragraph Analysis Display */}
                  {analysisType === 'paragraph' && analysisResult && 'meta' in analysisResult && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Type</h4>
                        <Badge variant="outline" className="text-xs">
                          {(analysisResult as ParagraphAnalysis).meta.type}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Tone</h4>
                        <Badge variant="outline" className="text-xs">
                          {(analysisResult as ParagraphAnalysis).meta.tone}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Main Topic</h4>
                        <p className="text-foreground">{(analysisResult as ParagraphAnalysis).content_analysis.main_topic}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {(analysisResult as ParagraphAnalysis).content_analysis.keywords.map((keyword, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />
                  
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      // Open add to vocabulary dialog
                      setAddToVocabularyDialogOpen(true);
                    }}
                  >
                    <BookOpen size={14} className="mr-2" />
                    Add to Vocabulary
                  </Button>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="border-t p-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {textStats.characters} ký tự • {textStats.words} từ • {textStats.sentences} câu • {textStats.paragraphs} đoạn
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={!content.trim() || isAnalyzing}
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

      {/* Save to Session Dialog */}
      <Dialog open={saveToSessionDialogOpen} onOpenChange={setSaveToSessionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="session-title">Session Title</Label>
              <Input
                id="session-title"
                placeholder="Enter session title..."
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <Select value={analysisType} onValueChange={(value) => setAnalysisType(value as 'word' | 'sentence' | 'paragraph')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word Analysis</SelectItem>
                  <SelectItem value="sentence">Sentence Analysis</SelectItem>
                  <SelectItem value="paragraph">Paragraph Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="existing-session">Or add to existing session</Label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Create new session</SelectItem>
                  {sessions.filter(s => s.session_type === analysisType).map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveToSessionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (selectedSessionId) {
                    // Add to existing session
                    await addAnalysisToSession(selectedSessionId, {
                      session_id: selectedSessionId,
                      analysis_type: analysisType,
                      analysis_id: '', // WordAnalysis doesn't have id field
                      analysis_title: analysisType === 'word'
                        ? (analysisResult as WordAnalysis)?.meta?.word || 'Analysis'
                        : analysisType === 'sentence'
                        ? (analysisResult as SentenceAnalysis)?.meta?.sentence || 'Analysis'
                        : (analysisResult as ParagraphAnalysis)?.meta?.type || 'Analysis',
                      analysis_summary: selectedText,
                      analysis_data: analysisResult
                    });
                  } else {
                    // Create new session
                    const newSession = await createSession({
                      title: sessionTitle || `${analysisType} Analysis`,
                      description: `Analysis of: ${selectedText}`,
                      session_type: analysisType
                    });
                    
                    if (newSession) {
                      await addAnalysisToSession(newSession.id, {
                        session_id: newSession.id,
                        analysis_type: analysisType,
                        analysis_id: '', // WordAnalysis doesn't have id field
                        analysis_title: analysisType === 'word'
                          ? (analysisResult as WordAnalysis)?.meta?.word || 'Analysis'
                          : analysisType === 'sentence'
                          ? (analysisResult as SentenceAnalysis)?.meta?.sentence || 'Analysis'
                          : (analysisResult as ParagraphAnalysis)?.meta?.type || 'Analysis',
                        analysis_summary: selectedText,
                        analysis_data: analysisResult
                      });
                    }
                  }
                  
                  setSaveToSessionDialogOpen(false);
                  setSessionTitle('');
                  setSelectedSessionId('');
                } catch (error) {
                  console.error('Failed to save to session:', error);
                  setError('Failed to save to session');
                }
              }}
              disabled={!analysisResult || !selectedText.trim()}
            >
              <Save size={14} className="mr-2" />
              Save to Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Vocabulary Dialog */}
      <Dialog open={addToVocabularyDialogOpen} onOpenChange={setAddToVocabularyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Vocabulary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="vocabulary-word">Word</Label>
              <Input
                id="vocabulary-word"
                value={vocabularyData.word}
                onChange={(e) => setVocabularyData(prev => ({ ...prev, word: e.target.value }))}
                className="w-full"
                placeholder="Enter word..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-definition">Definition</Label>
              <Input
                id="vocabulary-definition"
                value={vocabularyData.definition_en}
                onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_en: e.target.value }))}
                className="w-full"
                placeholder="Enter definition..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-vietnamese">Vietnamese Translation</Label>
              <Input
                id="vocabulary-vietnamese"
                value={vocabularyData.definition_vi}
                onChange={(e) => setVocabularyData(prev => ({ ...prev, definition_vi: e.target.value }))}
                className="w-full"
                placeholder="Enter Vietnamese translation..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vocabulary-difficulty">Difficulty Level</Label>
              <Select value={vocabularyData.difficulty_level.toString()} onValueChange={(value) => setVocabularyData(prev => ({ ...prev, difficulty_level: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Easy</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Hard</SelectItem>
                  <SelectItem value="4">Very Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddToVocabularyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const wordData = {
                    ...vocabularyData,
                    source_type: 'analysis' as const,
                    source_reference: '' // WordAnalysis doesn't have id field
                  };
                  
                  await createWord(wordData);
                  setAddToVocabularyDialogOpen(false);
                  setVocabularyData({
                    word: '',
                    definition_en: '',
                    definition_vi: '',
                    difficulty_level: 1
                  });
                } catch (error) {
                  console.error('Failed to add to vocabulary:', error);
                  setError('Failed to add to vocabulary');
                }
              }}
              disabled={!vocabularyData.word.trim() || !vocabularyData.definition_en.trim()}
            >
              <FolderOpen size={14} className="mr-2" />
              Add to Vocabulary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bubble Menu */}
      {bubbleMenuPosition.show && (
        <div
          className="fixed bg-background rounded-lg shadow-lg border border-border p-2 flex items-center gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ 
            left: bubbleMenuPosition.x, 
            top: bubbleMenuPosition.y, 
            transform: 'translate(-50%, -100%)' 
          }}
        >
          <Badge variant="secondary" className="text-xs px-2 border-r">
            {selectionType}
          </Badge>
          <Button
            size="sm"
            onClick={handleAnalyze}
            className="h-7 px-2 text-xs"
          >
            <BookMarked size={12} className="mr-1" />
            Analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Pronounce functionality could be implemented here
              console.log('Pronounce:', selectedText);
            }}
            className="h-7 w-7 p-0"
            title="Pronounce"
          >
            <Volume2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleHighlight('#fef08a')}
            className="h-7 w-7 p-0"
            title="Highlight"
          >
            <Highlighter size={14} />
          </Button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default AnalysisEditor;