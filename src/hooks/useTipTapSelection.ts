import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface SelectionInfo {
  text: string;
  from: number;
  to: number;
  empty: boolean;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  rect?: DOMRect;
}

interface UseTipTapSelectionProps {
  editor: Editor | null;
  onTextSelect?: (text: string, type: 'word' | 'sentence' | 'paragraph') => void;
  onAnalysisRequest?: (text: string, type: 'word' | 'sentence' | 'paragraph') => void;
  autoAnalysisEnabled?: boolean;
  analysisDebounceMs?: number;
}

export function useTipTapSelection({
  editor,
  onTextSelect,
  onAnalysisRequest,
  autoAnalysisEnabled = true,
  analysisDebounceMs = 800,
}: UseTipTapSelectionProps) {
  const [selection, setSelection] = useState<SelectionInfo>({
    text: '',
    from: 0,
    to: 0,
    empty: true,
    type: 'word',
  });
  
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({
    x: 0,
    y: 0,
    show: false,
  });

  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  // Detect selection type based on text content
  const detectSelectionType = useCallback((text: string): 'word' | 'phrase' | 'sentence' | 'paragraph' => {
    const trimmed = text.trim();
    if (!trimmed) return 'word';
    
    const wordCount = trimmed.split(/\s+/).length;
    const sentenceCount = (trimmed.match(/[.!?]+/g) || []).length;
    const hasNewlines = /\n\n/.test(trimmed);
    
    if (hasNewlines || sentenceCount > 2) return 'paragraph';
    if (sentenceCount >= 1) return 'sentence';
    if (wordCount > 1) return 'phrase';
    return 'word';
  }, []);

  // Get selection rectangle for bubble menu positioning
  const getSelectionRect = useCallback(() => {
    if (!editor) return undefined;
    
    const { from, to } = editor.state.selection;
    if (from === to) return undefined;
    
    try {
      const view = editor.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      return {
        left: Math.min(start.left, end.left),
        right: Math.max(start.right, end.right),
        top: Math.min(start.top, end.top),
        bottom: Math.max(start.bottom, end.bottom),
        width: Math.abs(end.left - start.left),
        height: Math.abs(end.bottom - start.top),
      } as DOMRect;
    } catch (error) {
      console.error('Error getting selection rect:', error);
      return undefined;
    }
  }, [editor]);

  // Debounced analysis function
  const debouncedAnalysis = useCallback((textToAnalyze: string, type: 'word' | 'sentence' | 'paragraph') => {
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Check if this is a duplicate request
    const now = Date.now();
    const lastAnalysis = lastAnalysisRef.current;
    if (lastAnalysis &&
        lastAnalysis.text === textToAnalyze &&
        lastAnalysis.type === type &&
        (now - lastAnalysis.timestamp) < 2000) {
      return;
    }
    
    analysisTimeoutRef.current = setTimeout(() => {
      if (autoAnalysisEnabled && textToAnalyze.trim()) {
        // Update the last analysis ref
        lastAnalysisRef.current = {
          text: textToAnalyze,
          type,
          timestamp: Date.now()
        };
        
        onAnalysisRequest?.(textToAnalyze, type);
      }
    }, analysisDebounceMs);
  }, [autoAnalysisEnabled, onAnalysisRequest, analysisDebounceMs]);

  // Handle selection update
  const handleSelectionUpdate = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    const detectedType = detectSelectionType(text);
    
    const newSelection: SelectionInfo = {
      text,
      from,
      to,
      empty,
      type: detectedType,
    };
    
    setSelection(newSelection);
    
    // Update bubble menu position
    if (!empty && text.length > 0) {
      const rect = getSelectionRect();
      if (rect) {
        setBubbleMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          show: true,
        });
      }
      
      // Determine analysis type
      let newAnalysisType: 'word' | 'sentence' | 'paragraph';
      if (detectedType === 'word') newAnalysisType = 'word';
      else if (detectedType === 'phrase' || detectedType === 'sentence') newAnalysisType = 'sentence';
      else newAnalysisType = 'paragraph';
      
      setAnalysisType(newAnalysisType);
      
      // Call onTextSelect callback
      onTextSelect?.(text, newAnalysisType);
      
      // Schedule debounced analysis
      debouncedAnalysis(text, newAnalysisType);
    } else {
      setBubbleMenuPosition({ x: 0, y: 0, show: false });
    }
  }, [editor, detectSelectionType, getSelectionRect, onTextSelect, debouncedAnalysis]);

  // Smart expansion functions
  const expandToWord = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    
    // Find word boundaries
    let wordStart = from;
    let wordEnd = to;
    
    // Expand start to word boundary
    while (wordStart > 0) {
      const char = doc.textBetween(wordStart - 1, wordStart);
      if (!/\w/.test(char)) break;
      wordStart--;
    }
    
    // Expand end to word boundary
    while (wordEnd < doc.content.size) {
      const char = doc.textBetween(wordEnd, wordEnd + 1);
      if (!/\w/.test(char)) break;
      wordEnd++;
    }
    
    editor.chain().focus().setTextSelection({ from: wordStart, to: wordEnd }).run();
  }, [editor]);

  const expandToSentence = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    
    // Find sentence boundaries
    let sentenceStart = from;
    let sentenceEnd = to;
    
    // Expand start to sentence boundary
    while (sentenceStart > 0) {
      const char = doc.textBetween(sentenceStart - 1, sentenceStart);
      if (/[.!?]/.test(char)) break;
      sentenceStart--;
    }
    
    // Expand end to sentence boundary
    while (sentenceEnd < doc.content.size) {
      const char = doc.textBetween(sentenceEnd, sentenceEnd + 1);
      if (/[.!?]/.test(char)) {
        sentenceEnd++;
        break;
      }
      sentenceEnd++;
    }
    
    editor.chain().focus().setTextSelection({ from: sentenceStart, to: sentenceEnd }).run();
  }, [editor]);

  const expandToParagraph = useCallback(() => {
    if (!editor) return;
    
    const { $from } = editor.state.selection;
    const paragraph = $from.node($from.depth);
    
    if (paragraph) {
      const startPos = $from.start($from.depth);
      const endPos = $from.end($from.depth);
      
      editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
    }
  }, [editor]);

  // Clear selection
  const clearSelection = useCallback(() => {
    if (!editor) return;
    
    editor.chain().focus().setTextSelection({ from: editor.state.selection.from, to: editor.state.selection.from }).run();
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
  }, [editor]);

  // Hide bubble menu
  const hideBubbleMenu = useCallback(() => {
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
  }, []);

  // Manual analysis trigger
  const triggerManualAnalysis = useCallback(() => {
    if (selection.text.trim()) {
      // Cancel any pending auto-analysis timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
      
      // Update the last analysis ref to prevent duplicates
      lastAnalysisRef.current = {
        text: selection.text,
        type: analysisType,
        timestamp: Date.now()
      };
      
      onAnalysisRequest?.(selection.text, analysisType);
    }
  }, [selection.text, analysisType, onAnalysisRequest]);

  // Setup event listeners
  useEffect(() => {
    if (!editor) return;
    
    const handleMouseUp = () => {
      setTimeout(handleSelectionUpdate, 10);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        setTimeout(handleSelectionUpdate, 10);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideBubbleMenu();
      }
    };
    
    // Add event listeners to the editor view
    const editorView = editor.view.dom;
    editorView.addEventListener('mouseup', handleMouseUp);
    editorView.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editorView.removeEventListener('mouseup', handleMouseUp);
      editorView.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [editor, handleSelectionUpdate, hideBubbleMenu]);

  return {
    selection,
    bubbleMenuPosition,
    analysisType,
    setAnalysisType,
    expandToWord,
    expandToSentence,
    expandToParagraph,
    clearSelection,
    hideBubbleMenu,
    triggerManualAnalysis,
  };
}

export default useTipTapSelection;