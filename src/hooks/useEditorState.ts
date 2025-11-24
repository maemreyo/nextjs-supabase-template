import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { useSessionStore } from '@/stores/session-store';
import type { AnalysisSession } from '@/types/sessions';

interface EditorContent {
  html: string;
  json: any;
  text: string;
}

interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

interface TextSelection {
  text: string;
  from: number;
  to: number;
  empty: boolean;
  type: 'word' | 'sentence' | 'paragraph';
}

interface BubbleMenuPosition {
  x: number;
  y: number;
  show: boolean;
}

interface UseEditorStateProps {
  editor: Editor | null;
  sessionId?: string;
  initialText?: string;
  autoAnalysisEnabled?: boolean;
  autoSaveEnabled?: boolean;
  onTextSelect?: (text: string, type: 'word' | 'sentence' | 'paragraph') => void;
  onContentChange?: (content: EditorContent) => void;
  onSelectionChange?: (selection: TextSelection) => void;
}

interface UseEditorStateReturn {
  // State
  autoAnalysisEnabled: boolean;
  autoSaveEnabled: boolean;
  sessionQuickActionsOpen: boolean;
  
  // Session data
  session: AnalysisSession | null;
  analyses: any[];
  isSessionLoading: boolean;
  sessionError: Error | null;
  
  // Content state
  initialContent: string;
  
  // Selection state
  selection: TextSelection;
  bubbleMenuPosition: BubbleMenuPosition;
  analysisType: 'word' | 'sentence' | 'paragraph';
  
  // Actions
  setAutoAnalysisEnabled: (enabled: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setSessionQuickActionsOpen: (open: boolean) => void;
  setSelection: (selection: TextSelection) => void;
  setBubbleMenuPosition: (position: BubbleMenuPosition) => void;
  setAnalysisType: (type: 'word' | 'sentence' | 'paragraph') => void;
  clearSelection: () => void;
  hideBubbleMenu: () => void;
}

export function useEditorState({
  editor,
  sessionId,
  initialText = '',
  autoAnalysisEnabled: initialAutoAnalysisEnabled = true,
  autoSaveEnabled: initialAutoSaveEnabled = true,
  onTextSelect,
  onContentChange,
  onSelectionChange
}: UseEditorStateProps): UseEditorStateReturn {
  // Feature toggles
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(initialAutoAnalysisEnabled);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialAutoSaveEnabled);
  const [sessionQuickActionsOpen, setSessionQuickActionsOpen] = useState(false);

  // Session store
  const { sessions, createSession, setCurrentSession } = useSessionStore();

  // Session data (would come from useSessionData hook in real implementation)
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<Error | null>(null);

  // Content state
  const initialContent = useMemo(() => {
    // In real implementation, this would load from session
    return initialText;
  }, [initialText]);

  // Selection state
  const [selection, setSelection] = useState<TextSelection>({
    text: '',
    from: 0,
    to: 0,
    empty: true,
    type: 'word',
  });
  
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState<BubbleMenuPosition>({
    x: 0,
    y: 0,
    show: false,
  });
  
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');

  // Selection actions
  const clearSelection = useCallback(() => {
    if (!editor) return;
    
    editor.chain().focus().setTextSelection({ 
      from: editor.state.selection.from, 
      to: editor.state.selection.from 
    }).run();
    
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
  }, [editor]);

  const hideBubbleMenu = useCallback(() => {
    setBubbleMenuPosition({ x: 0, y: 0, show: false });
  }, []);

  // Handle selection changes
  useEffect(() => {
    if (selection.text && !selection.empty) {
      onTextSelect?.(selection.text, selection.type);
    }
    onSelectionChange?.(selection);
  }, [selection, onTextSelect, onSelectionChange]);

  // Handle content changes
  useEffect(() => {
    if (editor) {
      const handleUpdate = () => {
        const content: EditorContent = {
          html: editor.getHTML(),
          json: editor.getJSON(),
          text: editor.getText(),
        };
        onContentChange?.(content);
      };

      editor.on('update', handleUpdate);
      
      return () => {
        editor.off('update', handleUpdate);
      };
    }
  }, [editor, onContentChange]);

  // Set current session in store when session data is loaded
  useEffect(() => {
    if (session && !isSessionLoading) {
      setCurrentSession(session);
    }
  }, [sessionId, session, isSessionLoading, setCurrentSession]);

  // Create new session helper
  const createNewSession = useCallback(async () => {
    try {
      const newSession = await createSession({
        title: `Session mới - ${new Date().toLocaleDateString('vi-VN')}`,
        session_type: 'mixed'
      });
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, [createSession]);

  return {
    // State
    autoAnalysisEnabled,
    autoSaveEnabled,
    sessionQuickActionsOpen,
    
    // Session data
    session,
    analyses,
    isSessionLoading,
    sessionError,
    
    // Content state
    initialContent,
    
    // Selection state
    selection,
    bubbleMenuPosition,
    analysisType,
    
    // Actions
    setAutoAnalysisEnabled,
    setAutoSaveEnabled,
    setSessionQuickActionsOpen,
    setSelection,
    setBubbleMenuPosition,
    setAnalysisType,
    clearSelection,
    hideBubbleMenu,
  };
}

export default useEditorState;