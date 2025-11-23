import React from 'react';
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
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Clock
} from 'lucide-react';
import type { AnalysisEditorProps, WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { useSessionData } from '@/hooks/useSessionData';
import { useSessionAutoSave } from '@/hooks/useSessionAutoSave';
import AutoSaveStatusIndicator from '@/components/sessions/AutoSaveStatusIndicator';
import { useAppNavigation, createBreadcrumbItems, NavigationValidation } from '@/lib/navigation';
import { Breadcrumb, ResponsiveBreadcrumb, MobileBreadcrumb } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import SessionWordList from './SessionWordList';
import SessionQuickActions from './SessionQuickActions';
import { useSupabase } from '@/components/providers/supabase-provider';

export function AnalysisEditor({
  onTextSelect,
  onAnalyze,
  onAnalysisComplete, // New prop to handle analysis completion
  initialText = "",
  className = "",
  isAnalyzing: parentIsAnalyzing = false,
  sessionId: propSessionId
}: AnalysisEditorProps & {
  onAnalysisComplete?: (result: {
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  }) => void;
  sessionId?: string;
}) {
  console.log('🔍 [DEBUG] AnalysisEditor - Component started', { initialText, className, propSessionId });
  
  // Get sessionId from URL parameters if not provided as prop
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSessionId = NavigationValidation.getValidatedSessionId(searchParams);
  const sessionId = propSessionId || urlSessionId || undefined;
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();
  
  const [selectedText, setSelectedText] = useState('');
  const [selectionType, setSelectionType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Use parent's isAnalyzing state if provided, otherwise use local state
  const effectiveIsAnalyzing = parentIsAnalyzing || isAnalyzing;
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true); // Bật auto-save theo mặc định
  const [lastAnalysisResult, setLastAnalysisResult] = useState<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  } | null>(null);
  
  const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionQuickActionsOpen, setSessionQuickActionsOpen] = useState(false);
  
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
  
  // Track last analysis request to prevent duplicates
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  const { sessions, createSession, addAnalysisToSession, setCurrentSession } = useSessionStore();
  const { theme, systemTheme } = useTheme();
  const { getAccessToken } = useSupabase();
  
  // Hook for loading session data
  const {
    session,
    analyses,
    settings,
    isLoading: isSessionLoading,
    error: sessionError,
    getSessionText,
    getWordList
  } = useSessionData(sessionId, {
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Hook for auto-saving to session - DISABLED BY DEFAULT
  const { autoSave, forceSave, isSaving: isAutoSaving, autoSaveStatus, hasUnsavedChanges, markAsChanged } = useSessionAutoSave({
    enabled: autoSaveEnabled && !!sessionId,
    debounceMs: 3000, // 3 seconds
    intervalMs: 5 * 60 * 1000, // 5 minutes
    enableBeforeUnload: false, // Tắt beforeunload auto-save
    enableNavigationSave: false, // Tắt navigation auto-save
    onSuccess: (data) => {
      console.log('🔍 [DEBUG] AnalysisEditor - Save successful', data);
      toast.success('Đã lưu', {
        description: 'Session của bạn đã được lưu thành công.',
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] AnalysisEditor - Save failed', error);
      toast.error('Lưu thất bại', {
        description: 'Không thể lưu session. Vui lòng thử lại.',
        duration: 5000,
      });
    }
  });
  
  // Hook for saving analysis (fallback when no session)
  const { saveAnalysis, isLoading: isSaving, isSuccess: isSaveSuccess, error: saveError } = useAnalysisSave({
    onSuccess: (data) => {
      console.log('🔍 [DEBUG] AnalysisEditor - Analysis saved successfully', data);
      // Show success feedback
      setTimeout(() => {
        // You could add a toast notification here
      }, 100);
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] AnalysisEditor - Failed to save analysis', error);
      // You could add an error toast here
    }
  });
  
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
    console.log('🔍 [DEBUG] debouncedAnalysis called', { textToAnalyze, type, autoAnalysisEnabled });
    
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    // Check if this is a duplicate request (same text and type within last 2 seconds)
    const now = Date.now();
    const lastAnalysis = lastAnalysisRef.current;
    if (lastAnalysis &&
        lastAnalysis.text === textToAnalyze &&
        lastAnalysis.type === type &&
        (now - lastAnalysis.timestamp) < 2000) {
      console.log('🔍 [DEBUG] Skipping duplicate analysis request', {
        text: textToAnalyze,
        type,
        timeSinceLast: now - lastAnalysis.timestamp
      });
      return;
    }
    
    analysisTimeoutRef.current = setTimeout(async () => {
      if (autoAnalysisEnabled && textToAnalyze.trim()) {
        console.log('🔍 [DEBUG] Executing debounced analysis', { textToAnalyze, type });
        
        // Update the last analysis ref
        lastAnalysisRef.current = {
          text: textToAnalyze,
          type,
          timestamp: Date.now()
        };
        
        setIsAnalyzing(true);
        console.log('🔍 [DEBUG] AnalysisEditor - Auto-analysis started, effectiveIsAnalyzing:', effectiveIsAnalyzing);
        try {
          const result = await onAnalyze?.(textToAnalyze, type);
          
          // Handle analysis completion
          if (result) {
            const analysisData = {
              text: textToAnalyze,
              type,
              data: result
            };
            
            // Store the last analysis result
            setLastAnalysisResult(analysisData);
            
            // Call the completion callback
            onAnalysisComplete?.(analysisData);
            
            // Auto-save đã bị tắt, chỉ lưu khi người dùng nhấn nút lưu
            console.log('🔍 [DEBUG] AnalysisEditor - Auto-save disabled, analysis completed but not saved', {
              text: textToAnalyze,
              type,
              hasData: !!result,
              hasSessionId: !!sessionId
            });
          }
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
    console.log('🔍 [DEBUG] handleTextSelection triggered');
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
      
      // Check if this is a duplicate request before scheduling debounced analysis
      const now = Date.now();
      const lastAnalysis = lastAnalysisRef.current;
      if (lastAnalysis &&
          lastAnalysis.text === text &&
          lastAnalysis.type === newAnalysisType &&
          (now - lastAnalysis.timestamp) < 2000) {
        console.log('🔍 [DEBUG] Skipping duplicate analysis in handleTextSelection', {
          text,
          type: newAnalysisType,
          timeSinceLast: now - lastAnalysis.timestamp
        });
      } else {
        console.log('🔍 [DEBUG] Scheduling debounced analysis from handleTextSelection', { text, type: newAnalysisType });
        debouncedAnalysis(text, newAnalysisType);
      }
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
    console.log('🔍 [DEBUG] handleAnalyze triggered', { selectedText, analysisType });
    
    // Cancel any pending auto-analysis timeout
    if (analysisTimeoutRef.current) {
      console.log('🔍 [DEBUG] Cancelling pending auto-analysis timeout');
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
    
    const textToAnalyze = selectedText || editorRef.current?.innerText || '';
    if (!textToAnalyze.trim()) return;

    // Update the last analysis ref to prevent duplicates
    lastAnalysisRef.current = {
      text: textToAnalyze,
      type: analysisType,
      timestamp: Date.now()
    };

    console.log('🔍 [DEBUG] Executing manual analysis', { textToAnalyze, analysisType, effectiveIsAnalyzing });
    setIsAnalyzing(true);
    
    try {
      const result = await onAnalyze?.(textToAnalyze, analysisType);
      
      // Handle analysis completion
      if (result) {
        const analysisData = {
          text: textToAnalyze,
          type: analysisType,
          data: result
        };
        
        // Store the last analysis result
        setLastAnalysisResult(analysisData);
        
        // Call the completion callback
        onAnalysisComplete?.(analysisData);
        
        // Auto-save đã bị tắt, chỉ lưu khi người dùng nhấn nút lưu
        console.log('🔍 [DEBUG] AnalysisEditor - Auto-save disabled, manual analysis completed but not saved', {
          text: textToAnalyze,
          type: analysisType,
          hasData: !!result,
          hasSessionId: !!sessionId
        });
      }
      
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
    // Mark content as changed for auto-save tracking
    markAsChanged();
  }, [updateTextStats, updateActiveFormats, markAsChanged]);

  // Initialize content once and load session data
  useEffect(() => {
    console.log('🔍 [DEBUG] AnalysisEditor - Initialize effect triggered', {
      hasEditorRef: !!editorRef.current,
      isInitialized: isInitializedRef.current,
      initialText,
      sessionId,
      hasSessionData: !!session,
      isSessionLoading
    });
    
    // Set current session in store when session data is loaded
    if (session && !isSessionLoading) {
      setCurrentSession(session);
    }
    
    // Load session text into editor
    if (editorRef.current && !isInitializedRef.current) {
      let textToLoad = initialText;
      
      // If we have session data, use session text instead of initialText
      if (sessionId && session) {
        textToLoad = getSessionText() || '';
      }
      
      if (textToLoad) {
        // Clean text colors to match theme
        const cleanedText = cleanTextColors(textToLoad);
        editorRef.current.innerHTML = cleanedText;
        isInitializedRef.current = true;
        updateTextStats();
      }
    }
  }, [initialText, sessionId, session, isSessionLoading, getSessionText, updateTextStats, cleanTextColors, setCurrentSession]);

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
        console.log('🔍 [DEBUG] MouseUp event detected, scheduling handleTextSelection');
        // Small delay to let browser finalize selection
        setTimeout(handleTextSelection, 10);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        console.log('🔍 [DEBUG] KeyUp event detected with Shift key, scheduling handleTextSelection');
        setTimeout(handleTextSelection, 10);
      }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('🔍 [DEBUG] AnalysisEditor - Save shortcut triggered');
        
        if (lastAnalysisResult) {
          if (sessionId) {
            forceSave({
              type: lastAnalysisResult.type,
              text: lastAnalysisResult.text,
              analysisData: lastAnalysisResult.data,
              sessionId,
            });
          } else {
            saveAnalysis({
              type: lastAnalysisResult.type,
              text: lastAnalysisResult.text,
              analysisData: lastAnalysisResult.data,
            });
          }
        } else {
          // Save current editor content
          const editorText = editorRef.current?.innerText || '';
          if (editorText.trim()) {
            console.log('🔍 [DEBUG] AnalysisEditor - Saving editor content from keyboard shortcut', {
              textLength: editorText.length,
              hasSessionId: !!sessionId,
            });
            
            if (sessionId) {
              // Create a simple analysis data for editor content
              const simpleAnalysisData = {
                meta: {
                  sentence: editorText,
                  complexity_level: 'Intermediate' as const,
                  sentence_type: 'declarative',
                },
                semantics: {
                  main_idea: editorText.substring(0, 100), // First 100 chars as main idea
                  subtext: '',
                  sentiment: 'Neutral' as const,
                },
                grammar_breakdown: {
                  subject: 'Unknown',
                  main_verb: 'Unknown',
                  object: 'Unknown',
                  clauses: [],
                },
                contextual_role: {
                  function: 'content',
                  relation_to_previous: 'none',
                },
                translation: {
                  literal: editorText,
                  natural: editorText,
                },
                key_components: [],
                rewrite_suggestions: [],
              };
              
              // Save the editor content as a sentence analysis
              forceSave({
                type: 'sentence',
                text: editorText,
                analysisData: simpleAnalysisData,
                sessionId,
              });
            } else {
              toast.error('Không có session để lưu', {
                description: 'Vui lòng tạo hoặc chọn session trước khi lưu.',
                duration: 3000,
              });
            }
          } else {
            toast.error('Không có nội dung để lưu', {
              description: 'Vui lòng nhập nội dung trước khi lưu.',
              duration: 3000,
            });
          }
        }
      }
      
      // Ctrl+Shift+S or Cmd+Shift+S for save as new session
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log('🔍 [DEBUG] AnalysisEditor - Save as new session shortcut triggered');
        // We'll implement this later
      }
      
      // Escape to hide bubble menu
      if (e.key === 'Escape') {
        setBubbleMenuPosition(prev => ({ ...prev, show: false }));
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
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    };
  }, [handleTextSelection, lastAnalysisResult, sessionId, forceSave, saveAnalysis, markAsChanged]);

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

  // Create breadcrumb items
  const breadcrumbItems = useMemo(() => {
    if (!session) return [];
    return createBreadcrumbItems('/analysis', sessionId, session.title);
  }, [session, sessionId]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Breadcrumb Navigation - Desktop */}
      {sessionId && session && (
        <div className="hidden sm:block border-b bg-muted/20 px-4 py-2">
          <ResponsiveBreadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* Breadcrumb Navigation - Mobile */}
      {sessionId && session && (
        <div className="sm:hidden border-b bg-muted/20 px-4 py-2">
          <MobileBreadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* Session Header */}
      {sessionId && (
        <div className="border-b bg-muted/30 p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToSessions()}
                className="h-7 px-2 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Quay lại</span>
                <span className="sm:hidden">←</span>
              </Button>
              
              {session && (
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 truncate max-w-[150px] sm:max-w-none">
                    <FolderOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </Badge>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {session.session_type === 'word' ? 'Từ' :
                     session.session_type === 'sentence' ? 'Câu' :
                     session.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
                  </Badge>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {analyses.length} phân tích
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToSessions()}
                className="h-7 px-2"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Danh sách</span>
                <span className="sm:hidden">📋</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Create new session and redirect
                  createSession({
                    title: `Session mới - ${new Date().toLocaleDateString('vi-VN')}`,
                    session_type: 'mixed'
                  }).then(newSession => {
                    navigateToAnalysis(newSession.id);
                  });
                }}
                className="h-7 px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Mới</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {sessionError && (
        <Alert className="m-4 border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải session: {sessionError.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isSessionLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Đang tải session...</span>
        </div>
      )}
      
      <Card className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center gap-1 flex-wrap">
          {/* Save Controls Section */}
          <div className="flex items-center gap-2 border-r pr-2 mr-2">
            <Button
              variant="outline"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                // Manual save trigger
                if (lastAnalysisResult) {
                  console.log('🔍 [DEBUG] AnalysisEditor - Manual save button clicked', {
                    text: lastAnalysisResult.text,
                    type: lastAnalysisResult.type,
                    hasSessionId: !!sessionId,
                  });
                  
                  if (sessionId) {
                    forceSave({
                      type: lastAnalysisResult.type,
                      text: lastAnalysisResult.text,
                      analysisData: lastAnalysisResult.data,
                      sessionId,
                    });
                  } else {
                    saveAnalysis({
                      type: lastAnalysisResult.type,
                      text: lastAnalysisResult.text,
                      analysisData: lastAnalysisResult.data,
                    });
                  }
                } else {
                  // Save current editor content
                  const editorText = editorRef.current?.innerText || '';
                  if (editorText.trim()) {
                    console.log('🔍 [DEBUG] AnalysisEditor - Saving editor content', {
                      textLength: editorText.length,
                      hasSessionId: !!sessionId,
                    });
                    
                    if (sessionId) {
                      // Create a simple analysis data for the editor content
                      const simpleAnalysisData = {
                        meta: {
                          sentence: editorText,
                          complexity_level: 'Intermediate' as const,
                          sentence_type: 'declarative',
                        },
                        semantics: {
                          main_idea: editorText.substring(0, 100), // First 100 chars as main idea
                          subtext: '',
                          sentiment: 'Neutral' as const,
                        },
                        grammar_breakdown: {
                          subject: 'Unknown',
                          main_verb: 'Unknown',
                          object: 'Unknown',
                          clauses: [],
                        },
                        contextual_role: {
                          function: 'content',
                          relation_to_previous: 'none',
                        },
                        translation: {
                          literal: editorText,
                          natural: editorText,
                        },
                        key_components: [],
                        rewrite_suggestions: [],
                      };
                      
                      // Save editor content directly to session
                      const saveSessionContent = async () => {
                        try {
                          // Get access token for authentication
                          const token = await getAccessToken();
                          
                          const headers: Record<string, string> = {
                            'Content-Type': 'application/json',
                          };
                          
                          // Add authorization header if token is available
                          if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                          }

                          const response = await fetch(`/api/sessions/${sessionId}/content`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({
                              content: editorText,
                            }),
                          });

                          if (response.ok) {
                            const result = await response.json();
                            console.log('🔍 [DEBUG] AnalysisEditor - Session content saved', result);
                            toast.success('Đã lưu nội dung session', {
                              description: 'Nội dung của bạn đã được lưu thành công.',
                              duration: 2000,
                            });
                            // Mark as saved in auto-save hook
                            markAsChanged();
                          } else {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.error || 'Failed to save session content');
                          }
                        } catch (error) {
                          console.error('🔍 [DEBUG] AnalysisEditor - Failed to save session content', error);
                          toast.error('Lưu thất bại', {
                            description: error instanceof Error ? error.message : 'Không thể lưu nội dung session. Vui lòng thử lại.',
                            duration: 5000,
                          });
                        }
                      };

                      saveSessionContent();
                    } else {
                      toast.error('Không có session để lưu', {
                        description: 'Vui lòng tạo hoặc chọn session trước khi lưu.',
                        duration: 3000,
                      });
                    }
                  } else {
                    toast.error('Không có nội dung để lưu', {
                      description: 'Vui lòng nhập nội dung trước khi lưu.',
                      duration: 3000,
                    });
                  }
                }
              }}
              disabled={isSaving || isAutoSaving || (!lastAnalysisResult && !editorRef.current?.innerText)}
              className="h-7 px-2"
              title={sessionId ? "Lưu kết quả phân tích vào session (Ctrl+S)" : "Lưu kết quả phân tích (Ctrl+S)"}
            >
              {(isSaving || isAutoSaving) ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang lưu...</>
              ) : (
                <><Save className="h-3 w-3 mr-1" />Lưu</>
              )}
            </Button>
            
            {/* Session Management Dropdown */}
            {sessionId && (
              <Button
                variant="outline"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  // Open session management dialog
                  console.log('🔍 [DEBUG] AnalysisEditor - Session management clicked');
                  setSessionQuickActionsOpen(true);
                }}
                className="h-7 px-2"
                title="Quản lý session"
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                Session
              </Button>
            )}
          </div>
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
            
            {/* Save status indicator - không có checkbox auto-save */}
            <div className="flex items-center gap-3">
              <AutoSaveStatusIndicator
                status={autoSaveStatus}
                compact={true}
              />
              
              {/* Enhanced save status indicator */}
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800 text-xs animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Có thay đổi chưa lưu
                </Badge>
              )}
              
              {!hasUnsavedChanges && lastAnalysisResult && (
                <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Đã lưu
                </Badge>
              )}
            </div>
            
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
            
            {/* Enhanced save status indicator */}
            <AutoSaveStatusIndicator
              status={autoSaveStatus}
              compact={true}
            />
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
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {textStats.characters} ký tự • {textStats.words} từ • {textStats.sentences} câu • {textStats.paragraphs} đoạn
            </div>
            
            {/* Save status in status bar */}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Có thay đổi chưa lưu (Ctrl+S để lưu)</span>
              </div>
            )}
            
            {!hasUnsavedChanges && lastAnalysisResult && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Đã lưu</span>
              </div>
            )}
          </div>
          
          <Button onClick={handleAnalyze} disabled={effectiveIsAnalyzing} size="sm">
            {effectiveIsAnalyzing ? (
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
          <Button size="sm" onMouseDown={(e) => e.preventDefault()} onClick={handleAnalyze} disabled={effectiveIsAnalyzing} className="h-7 px-2 text-xs">
            <BookMarked size={12} className="mr-1" />{effectiveIsAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
          
          {/* Manual save button */}
          {lastAnalysisResult && !autoSaveEnabled && (
            <Button
              size="sm"
              variant="outline"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                console.log('🔍 [DEBUG] AnalysisEditor - Manual save triggered', {
                  text: lastAnalysisResult.text,
                  type: lastAnalysisResult.type,
                  hasSessionId: !!sessionId,
                });
                
                if (sessionId) {
                  // Save to current session
                  forceSave({
                    type: lastAnalysisResult.type,
                    text: lastAnalysisResult.text,
                    analysisData: lastAnalysisResult.data,
                    sessionId,
                  });
                } else {
                  // Save without session (fallback)
                  saveAnalysis({
                    type: lastAnalysisResult.type,
                    text: lastAnalysisResult.text,
                    analysisData: lastAnalysisResult.data,
                  });
                }
              }}
              disabled={isSaving || isAutoSaving}
              className="h-7 px-2 text-xs"
              title={sessionId ? "Lưu kết quả phân tích vào session" : "Lưu kết quả phân tích"}
            >
              {(isSaving || isAutoSaving) ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang lưu...</>
              ) : (
                <><Save size={12} className="mr-1" />{sessionId ? 'Lưu vào session' : 'Lưu'}</>
              )}
            </Button>
          )}
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

  {/* Session Quick Actions Dialog */}
  <SessionQuickActions
    currentSession={session}
    isOpen={sessionQuickActionsOpen}
    onOpenChange={setSessionQuickActionsOpen}
  />
  
  console.log('🔍 [DEBUG] AnalysisEditor - Component finished');
}

export default AnalysisEditor;