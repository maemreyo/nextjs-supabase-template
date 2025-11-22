import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
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
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalysisEditor({
  onTextSelect,
  onAnalyze,
  initialText = "",
  className = ""
}: AnalysisEditorProps) {
  console.log('🔍 [DEBUG] AnalysisEditor - Component started', { initialText, className });
  const [selectedText, setSelectedText] = useState('');
  const [selectionType, setSelectionType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  
  const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
  });
  
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ x: 0, y: 0, show: false });
  const [textStats, setTextStats] = useState({ characters: 0, words: 0, sentences: 0, paragraphs: 0 });
  
  const editorRef = useRef<HTMLDivElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const { sessions, createSession, addAnalysisToSession } = useSessionStore();
  const { theme, systemTheme } = useTheme();
  
  // Get the actual theme (accounting for system theme)
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkTheme = currentTheme === 'dark';

  // Enhanced highlight colors with better contrast for both light and dark themes
  const highlightColors = [
    '#fef08a', // Light yellow - good for both themes
    '#bbf7d0', // Light green - good for both themes
    '#bfdbfe', // Light blue - good for both themes
    '#fca5a5', // Light red with better contrast
    '#e9d5ff', // Light purple - good for both themes
  ];

  // Function to clean text colors to match current theme
  const cleanTextColors = useCallback((htmlContent: string) => {
    if (!htmlContent) return htmlContent;
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remove all color styles and attributes to ensure text follows theme
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Remove color-related inline styles
      if (htmlElement.style) {
        htmlElement.style.color = '';
        htmlElement.style.removeProperty('color');
      }
      
      // Remove color attributes
      htmlElement.removeAttribute('color');
      
      // Remove font color attributes
      htmlElement.removeAttribute('text');
      htmlElement.removeAttribute('fgcolor');
    });
    
    return tempDiv.innerHTML;
  }, []);

  // Update text stats
  const updateTextStats = useCallback(() => {
    if (!editorRef.current) return;
    const textContent = editorRef.current.innerText || '';
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    setTextStats({
      characters: textContent.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: Math.max(1, paragraphs.length)
    });
  }, []);

  // Debounced analysis
  const debouncedAnalysis = useCallback((textToAnalyze: string, type: 'word' | 'sentence' | 'paragraph') => {
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    
    analysisTimeoutRef.current = setTimeout(async () => {
      if (autoAnalysisEnabled && textToAnalyze.trim()) {
        setIsAnalyzing(true);
        try {
          const result = await onAnalyze?.(textToAnalyze, type);
          // Result is now handled at page level
        } catch (err) {
          // Error is now handled at page level
          console.error(err instanceof Error ? err.message : 'Phân tích thất bại');
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 800);
  }, [autoAnalysisEnabled, onAnalyze]);

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

  // Handle text selection - simplified, no restoration
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const text = sel.toString().trim();
    
    if (text.length > 0 && editorRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(text);
      const detectedType = detectSelectionType(text);
      setSelectionType(detectedType);
      
      let newAnalysisType: 'word' | 'sentence' | 'paragraph';
      if (detectedType === 'word') newAnalysisType = 'word';
      else if (detectedType === 'phrase' || detectedType === 'sentence') newAnalysisType = 'sentence';
      else newAnalysisType = 'paragraph';
      
      setAnalysisType(newAnalysisType);
      setBubbleMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        show: true
      });
      
      onTextSelect?.(text, newAnalysisType);
      debouncedAnalysis(text, newAnalysisType);
    } else {
      setBubbleMenuPosition({ x: 0, y: 0, show: false });
      setSelectedText('');
    }
  }, [detectSelectionType, onTextSelect, debouncedAnalysis]);

  // Smart expansion functions
  const expandToWord = useCallback(() => {
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
    
    // Delay to let browser settle
    setTimeout(handleTextSelection, 10);
  }, [handleTextSelection]);

  const expandToSentence = useCallback(() => {
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
    
    setTimeout(handleTextSelection, 10);
  }, [handleTextSelection]);

  const expandToParagraph = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    let node = sel.anchorNode;
    while (node && node.nodeName !== 'P' && node.nodeName !== 'DIV' && node.parentNode && node !== editorRef.current) {
      node = node.parentNode;
    }
    
    if (node && node !== editorRef.current) {
      const range = document.createRange();
      range.selectNodeContents(node);
      sel.removeAllRanges();
      sel.addRange(range);
      setTimeout(handleTextSelection, 10);
    }
  }, [handleTextSelection]);

  // Rich text formatting - prevent default focus behavior
  const formatText = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    // Don't call focus - let selection remain
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  }, []);

  const handleHighlight = useCallback((color: string) => {
    document.execCommand('hiliteColor', false, color);
    setBubbleMenuPosition(prev => ({ ...prev, show: false }));
  }, []);

  // Handle analysis
  const handleAnalyze = useCallback(async () => {
    const textToAnalyze = selectedText || editorRef.current?.innerText || '';
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    
    try {
      const result = await onAnalyze?.(textToAnalyze, analysisType);
      // Result is now handled at page level
      setBubbleMenuPosition(prev => ({ ...prev, show: false }));
    } catch (err) {
      // Error is now handled at page level
      console.error(err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedText, analysisType, onAnalyze]);

  // Handle paste event to ensure text colors match theme
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Get plain text and HTML from clipboard
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    
    if (editorRef.current) {
      // Get current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // If we have HTML content, clean it and insert
        if (html) {
          const cleanedHtml = cleanTextColors(html);
          
          // Create a temporary div to hold cleaned HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanedHtml;
          
          // Extract and insert cleaned content
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }
          
          range.deleteContents();
          range.insertNode(fragment);
        } else {
          // Insert plain text
          const textNode = document.createTextNode(text);
          range.deleteContents();
          range.insertNode(textNode);
        }
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update stats and formats
        updateTextStats();
        updateActiveFormats();
      }
    }
  }, [cleanTextColors, updateTextStats, updateActiveFormats]);

  // Handle content change - just update stats, don't mess with selection
  const handleContentChange = useCallback(() => {
    updateTextStats();
    updateActiveFormats();
  }, [updateTextStats, updateActiveFormats]);

  // Initialize content once
  useEffect(() => {
    console.log('🔍 [DEBUG] AnalysisEditor - Initialize effect triggered', {
      hasEditorRef: !!editorRef.current,
      isInitialized: isInitializedRef.current,
      initialText
    });
    if (editorRef.current && !isInitializedRef.current && initialText) {
      // Clean initial text colors to match theme
      const cleanedInitialText = cleanTextColors(initialText);
      editorRef.current.innerHTML = cleanedInitialText;
      isInitializedRef.current = true;
      updateTextStats();
    }
  }, [initialText, updateTextStats, cleanTextColors]);

  // Ensure text colors match theme when theme changes
  useEffect(() => {
    if (editorRef.current && isInitializedRef.current) {
      // Apply theme-appropriate text color to all text nodes
      const allTextNodes = editorRef.current.querySelectorAll('*');
      allTextNodes.forEach(node => {
        const htmlElement = node as HTMLElement;
        if (htmlElement.style && !htmlElement.style.color) {
          // Let CSS handle the color based on theme
          htmlElement.style.color = '';
        }
      });
    }
  }, [currentTheme]);

  // Setup event listeners
  useEffect(() => {
    console.log('🔍 [DEBUG] AnalysisEditor - Event listeners setup effect triggered');
    const handleMouseUp = (e: MouseEvent) => {
      // Only handle if selection is in editor
      const sel = window.getSelection();
      if (sel && editorRef.current?.contains(sel.anchorNode)) {
        // Small delay to let browser finalize selection
        setTimeout(handleTextSelection, 10);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        setTimeout(handleTextSelection, 10);
      }
    };

    // Click outside to hide bubble menu
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-bubble-menu]') && !editorRef.current?.contains(target)) {
        setBubbleMenuPosition(prev => ({ ...prev, show: false }));
      }
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleClickOutside);
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    };
  }, [handleTextSelection]);

  // Toolbar button
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
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn("p-2 h-8 w-8", active && "bg-muted", disabled && "opacity-40")}
    >
      {children}
    </Button>
  );

  console.log('🔍 [DEBUG] AnalysisEditor - About to render', {
    selectedText,
    selectionType,
    analysisType,
    isAnalyzing,
    autoAnalysisEnabled,
    bubbleMenuPosition,
    textStats
  });

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <Card className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('bold')} active={activeFormats.bold} title="Bold">
              <Bold size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('italic')} active={activeFormats.italic} title="Italic">
              <Italic size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('underline')} active={activeFormats.underline} title="Underline">
              <Underline size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('strikeThrough')} active={activeFormats.strikeThrough} title="Strike">
              <Strikethrough size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('removeFormat')} title="Clear">
              <Code size={16} />
            </ToolBtn>
          </div>

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

          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('undo')} title="Undo">
              <Undo size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatText('redo')} title="Redo">
              <Redo size={16} />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <Button variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={expandToWord} className="text-xs px-2 py-1 h-7">
              Word
            </Button>
            <Button variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={expandToSentence} className="text-xs px-2 py-1 h-7">
              Sentence
            </Button>
            <Button variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={expandToParagraph} className="text-xs px-2 py-1 h-7">
              Paragraph
            </Button>
          </div>

          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            {highlightColors.map(color => (
              <button
                key={color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleHighlight(color)}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={`Highlight with ${color}`}
              />
            ))}
          </div>

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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setAutoAnalysisEnabled(!autoAnalysisEnabled)}
              className={cn("text-xs h-7", autoAnalysisEnabled ? "bg-primary/10 border-primary/30" : "")}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Auto: {autoAnalysisEnabled ? "ON" : "OFF"}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          {(() => {
            console.log('🔍 [DEBUG] AnalysisEditor - Rendering editor div');
            return null;
          })()}
          <div className="max-w-4xl mx-auto">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-96 p-6 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 prose max-w-none"
              onInput={handleContentChange}
              onPaste={handlePaste}
              onKeyUp={updateActiveFormats}
              onClick={updateActiveFormats}
              suppressContentEditableWarning
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t p-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {textStats.characters} ký tự • {textStats.words} từ • {textStats.sentences} câu • {textStats.paragraphs} đoạn
          </div>
          
          <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
            {isAnalyzing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang phân tích...</>
            ) : (
              <><Zap className="h-4 w-4 mr-2" />Phân tích</>
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
              <Input id="session-title" placeholder="Enter session title..." value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as 'word' | 'sentence' | 'paragraph')}>
                <SelectTrigger><SelectValue placeholder="Select session type" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Select existing session" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Create new session</SelectItem>
                  {sessions.filter(s => s.session_type === analysisType).map((session) => (
                    <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveToSessionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  // Note: This dialog should be moved to the parent component
                  // For now, we'll disable this functionality since analysisResult is managed at page level
                  console.warn('Save to Session dialog should be moved to parent component');
                  setSaveToSessionDialogOpen(false);
                  setSessionTitle('');
                  setSelectedSessionId('');
                } catch (error) {
                  console.error('Failed to save to session:', error);
                }
              }}
              disabled={true}
            >
              <Save size={14} className="mr-2" />
              Save to Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bubble Menu */}
      {bubbleMenuPosition.show && (
        <div
          data-bubble-menu
          className="fixed bg-background rounded-lg shadow-lg border border-border p-2 flex items-center gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ left: bubbleMenuPosition.x, top: bubbleMenuPosition.y, transform: 'translate(-50%, -100%)' }}
        >
          <Badge variant="secondary" className="text-xs px-2 border-r">{selectionType}</Badge>
          <Button size="sm" onMouseDown={(e) => e.preventDefault()} onClick={handleAnalyze} className="h-7 px-2 text-xs">
            <BookMarked size={12} className="mr-1" />Analyze
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => console.log('Pronounce:', selectedText)}
            className="h-7 w-7 p-0"
            title="Pronounce"
          >
            <Volume2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleHighlight('#fef08a')}
            className="h-7 w-7 p-0"
            title="Highlight"
          >
            <Highlighter size={14} />
          </Button>
        </div>
      )}

    </div>
  );
  
  console.log('🔍 [DEBUG] AnalysisEditor - Component finished');
}

export default AnalysisEditor;