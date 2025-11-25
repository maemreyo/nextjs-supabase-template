import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';

export interface SelectionInfo {
  text: string;
  from: number;
  to: number;
  empty: boolean;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  sentenceContext: string;
  paragraphContext: string;
  rect?: DOMRect;
}

interface DetectionConfig {
  minLinesForParagraph?: number;
  minSentencesForParagraph?: number;
  treatIncompleteAsPhrase?: boolean;
  customAbbreviations?: string[];
}

interface UseTipTapSelectionProps {
  editor: Editor | null;
  onTextSelect?: (selection: SelectionInfo) => void;
  onAnalysisRequest?: (selection: SelectionInfo) => void;
  autoAnalysisEnabled?: boolean;
  analysisDebounceMs?: number;
  detectionConfig?: DetectionConfig;
}

// Default configuration
const DEFAULT_CONFIG: Required<DetectionConfig> = {
  minLinesForParagraph: 3,
  minSentencesForParagraph: 3,
  treatIncompleteAsPhrase: true,
  customAbbreviations: [],
};

export function useTipTapSelection({
  editor,
  onTextSelect,
  onAnalysisRequest,
  autoAnalysisEnabled = true,
  analysisDebounceMs = 800,
  detectionConfig = {},
}: UseTipTapSelectionProps) {
  const config = { ...DEFAULT_CONFIG, ...detectionConfig };
  
  const [selection, setSelection] = useState<SelectionInfo>({
    text: '',
    from: 0,
    to: 0,
    empty: true,
    type: 'word',
    sentenceContext: '',
    paragraphContext: '',
  });
  
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({
    x: 0,
    y: 0,
    show: false,
  });

  const [analysisType, setAnalysisType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  // Helper: Remove common abbreviations to avoid false sentence detection
  const removeAbbreviations = useCallback((text: string): string => {
    // Common English abbreviations
    const defaultAbbreviations = [
      'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
      'etc', 'vs', 'e\\.g', 'i\\.e', 'a\\.m', 'p\\.m',
      'U\\.S', 'U\\.K', 'Ph\\.D', 'M\\.D', 'B\\.A', 'M\\.A',
      'Inc', 'Ltd', 'Corp', 'Co', 'Ave', 'St', 'Rd', 'Blvd'
    ];
    
    const allAbbreviations = [...defaultAbbreviations, ...config.customAbbreviations];
    const abbreviationPattern = new RegExp(
      `\\b(?:${allAbbreviations.join('|')})\\.`,
      'gi'
    );
    
    // Replace abbreviations with placeholder (without period)
    return text.replace(abbreviationPattern, (match) => match.replace('.', '___'));
  }, [config.customAbbreviations]);

  // Helper: Count real sentences
  const countSentences = useCallback((text: string): number => {
    const cleaned = removeAbbreviations(text);
    
    // Match sentence-ending punctuation followed by:
    // - whitespace (space, newline, tab)
    // - end of string
    // - quotes/parentheses followed by whitespace or end
    const sentencePattern = /[.!?](?:\s+|$|["')]\s*(?:\s+|$))/g;
    const matches = cleaned.match(sentencePattern);
    
    return matches ? matches.length : 0;
  }, [removeAbbreviations]);

  // Improved selection type detection
  const detectSelectionType = useCallback((text: string): 'word' | 'phrase' | 'sentence' | 'paragraph' => {
    const trimmed = text.trim();
    if (!trimmed) return 'word';
    
    // Basic metrics
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    const lineCount = trimmed.split(/\n/).length;
    const hasMultipleLines = lineCount > 1;
    const sentenceCount = countSentences(trimmed);
    
    // Check if text ends with sentence punctuation
    const endsWithSentencePunctuation = /[.!?]["')]?\s*$/.test(trimmed);
    
    // Decision tree with improved logic
    
    // 1. PARAGRAPH detection
    if (lineCount >= config.minLinesForParagraph) {
      return 'paragraph';
    }
    
    if (sentenceCount >= config.minSentencesForParagraph) {
      return 'paragraph';
    }
    
    // Multiple lines with at least 2 sentences
    if (hasMultipleLines && sentenceCount >= 2) {
      return 'paragraph';
    }
    
    // 2. SENTENCE detection
    if (sentenceCount >= 1) {
      // Complete sentence: has ending punctuation
      if (endsWithSentencePunctuation) {
        return 'sentence';
      }
      
      // Incomplete sentence with punctuation in middle
      if (config.treatIncompleteAsPhrase) {
        // If it's long enough, treat as sentence anyway
        if (wordCount >= 5) {
          return 'sentence';
        }
        // Short with internal punctuation = phrase
        return 'phrase';
      } else {
        // Always treat text with sentence punctuation as sentence
        return 'sentence';
      }
    }
    
    // 3. PHRASE vs WORD
    if (wordCount > 1) {
      return 'phrase';
    }
    
    // 4. WORD (single word, no punctuation)
    return 'word';
  }, [countSentences, config]);

function extractSentenceContext(editor: Editor | null, from: number, to: number): string {
  if (!editor) return '';
  try {
    const { state } = editor;
    const fullText = state.doc.textContent;
    const getChar = (pos: number): string => fullText[pos] ?? '';
    let start = from;
    // Find sentence start backwards
    while (start > 0) {
      const prevChar = getChar(start - 1);
      if (/[.!?]/.test(prevChar)) {
        const nextChar = getChar(start);
        if (nextChar === ' ' || /[A-Z]/.test(nextChar)) {
          break;
        }
      }
      start--;
    }
    // Skip leading whitespace
    while (start < from && /\s/.test(getChar(start))) {
      start++;
    }
    let end = to;
    // Find sentence end forwards
    while (end < fullText.length) {
      const currChar = getChar(end);
      if (/[.!?]/.test(currChar)) {
        end++;
        // Skip trailing punctuation/spaces/quotes
        while (end < fullText.length && /[\s"')\]]/.test(getChar(end))) {
          end++;
        }
        break;
      }
      end++;
    }
    return state.doc.textBetween(start, end, ' ');
  } catch (error) {
    console.error('Error extracting sentence context:', error);
    return '';
  }
}

function extractParagraphContext(editor: Editor | null, from: number, to: number): string {
  if (!editor) return '';
  try {
    const { state } = editor;
    const $from = state.doc.resolve(from);
    const depth = $from.depth;
    const start = $from.start(depth);
    const end = $from.end(depth);
    return state.doc.textBetween(start, end, ' ');
  } catch (error) {
    console.error('Error extracting paragraph context:', error);
    return '';
  }
}
  // Get selection rectangle for bubble menu positioning
  const getSelectionRect = useCallback((): DOMRect | undefined => {
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
        width: Math.abs(end.right - start.left),
        height: Math.abs(end.bottom - start.top),
        x: Math.min(start.left, end.left),
        y: Math.min(start.top, end.top),
        toJSON: () => ({}),
      } as DOMRect;
    } catch (error) {
      console.error('Error getting selection rect:', error);
      return undefined;
    }
  }, [editor]);

  // Debounced analysis function
  const debouncedAnalysis = useCallback((
    selection: SelectionInfo
  ) => {
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Check if this is a duplicate request (within 2 seconds)
    const now = Date.now();
    const lastAnalysis = lastAnalysisRef.current;
    if (
      lastAnalysis &&
      lastAnalysis.text === selection.text &&
      lastAnalysis.type === selection.type &&
      now - lastAnalysis.timestamp < 2000
    ) {
      return;
    }
    
    // Schedule new analysis
    analysisTimeoutRef.current = setTimeout(() => {
      if (autoAnalysisEnabled && selection.text.trim()) {
        lastAnalysisRef.current = {
          text: selection.text,
          type: selection.type,
          timestamp: Date.now(),
        };
        
        onAnalysisRequest?.(selection);
      }
    }, analysisDebounceMs);
  }, [autoAnalysisEnabled, onAnalysisRequest, analysisDebounceMs]);

  // Handle selection update
  const handleSelectionUpdate = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '\n');
    const detectedType = detectSelectionType(text);
    console.log("detectedType", detectedType)
    const sentenceContext = extractSentenceContext(editor, from, to);
    const paragraphContext = extractParagraphContext(editor, from, to);
    const newSelection: SelectionInfo = {
      text,
      from,
      to,
      empty,
      type: detectedType,
      sentenceContext,
      paragraphContext,
    };
    
    setSelection(newSelection);
    
    // Update bubble menu position
    if (!empty && text.trim().length > 0) {
      const rect = getSelectionRect();
      if (rect) {
        setBubbleMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          show: true,
        });
      }
      
      setAnalysisType(detectedType);
      
      // Call callbacks
      onTextSelect?.(newSelection);
      debouncedAnalysis(newSelection);
    } else {
      setBubbleMenuPosition({ x: 0, y: 0, show: false });
    }
  }, [editor, detectSelectionType, getSelectionRect, onTextSelect, debouncedAnalysis]);

  // Smart expansion functions
  const expandToWord = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    
    let wordStart = from;
    let wordEnd = to;
    
    // Expand start to word boundary
    while (wordStart > 0) {
      const char = doc.textBetween(wordStart - 1, wordStart);
      if (!/[\w'-]/.test(char)) break; // Include hyphens and apostrophes
      wordStart--;
    }
    
    // Expand end to word boundary
    while (wordEnd < doc.content.size) {
      const char = doc.textBetween(wordEnd, wordEnd + 1);
      if (!/[\w'-]/.test(char)) break;
      wordEnd++;
    }
    
    editor.chain().focus().setTextSelection({ from: wordStart, to: wordEnd }).run();
  }, [editor]);

  const expandToSentence = useCallback(() => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    const fullText = doc.textBetween(0, doc.content.size);
    const getChar = (pos: number): string => fullText[pos] ?? '';
    
    let sentenceStart = from;
    let sentenceEnd = to;
    
    // Expand start to sentence boundary
    while (sentenceStart > 0) {
      const prevChar = getChar(sentenceStart - 1);
      const currentChar = getChar(sentenceStart);
      
      // Stop at sentence ending punctuation followed by space/newline and capital letter
      if (
        /[.!?]/.test(prevChar) &&
        /[\s\n]/.test(currentChar) &&
        sentenceStart + 1 < fullText.length &&
        /[A-Z]/.test(getChar(sentenceStart + 1))
      ) {
        break;
      }
      
      // Stop at paragraph start (double newline)
      if (sentenceStart >= 2 && fullText.substring(sentenceStart - 2, sentenceStart) === '\n\n') {
        break;
      }
      
      sentenceStart--;
    }
    
    // Skip leading whitespace
    while (sentenceStart < from && /\s/.test(getChar(sentenceStart))) {
      sentenceStart++;
    }
    
    // Expand end to sentence boundary
    while (sentenceEnd < doc.content.size) {
      const char = getChar(sentenceEnd);
      
      if (/[.!?]/.test(char)) {
        sentenceEnd++;
        // Include trailing quotes/parentheses
        while (sentenceEnd < doc.content.size && /["')]/.test(getChar(sentenceEnd))) {
          sentenceEnd++;
        }
        break;
      }
      
      // Stop at paragraph break
      if (sentenceEnd + 2 <= fullText.length && fullText.substring(sentenceEnd, sentenceEnd + 2) === '\n\n') {
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
    
    const { from } = editor.state.selection;
    editor.chain().focus().setTextSelection({ from, to: from }).run();
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
    
    // Clear any pending analysis
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
  }, [editor]);

  // Hide bubble menu
  const hideBubbleMenu = useCallback(() => {
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
  }, []);

  // Manual analysis trigger
  const triggerManualAnalysis = useCallback(() => {
    if (!selection.text.trim()) return;
    
    // Cancel any pending auto-analysis
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Update last analysis ref
    lastAnalysisRef.current = {
      text: selection.text,
      type: analysisType,
      timestamp: Date.now(),
    };
    
    onAnalysisRequest?.(selection);
  }, [selection.text, analysisType, onAnalysisRequest]);

  // Setup event listeners
  useEffect(() => {
    if (!editor) return;
    
    const handleMouseUp = () => {
      setTimeout(handleSelectionUpdate, 10);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle shift + arrow keys for text selection
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        setTimeout(handleSelectionUpdate, 10);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideBubbleMenu();
      }
    };
    
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
    // Export helper for testing
    detectSelectionType,
  };
}

export default useTipTapSelection;