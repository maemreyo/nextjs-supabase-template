import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface AnalysisResult {
  text: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  data: any;
}

interface UseKeyboardShortcutsProps {
  lastAnalysisResult: AnalysisResult | null;
  sessionId?: string;
  getContent: {
    text: () => string;
    html: () => string;
    json: () => any;
  };
  onSave?: () => void;
  forceSave?: () => void;
  saveAnalysis?: (data: any) => void;
  isSaving?: boolean;
  hideBubbleMenu?: () => void;
  onExpandToWord?: () => void;
  onExpandToSentence?: () => void;
  onExpandToParagraph?: () => void;
  triggerManualAnalysis?: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsReturn {
  // No return values needed, this hook just sets up event listeners
}

export function useKeyboardShortcuts({
  lastAnalysisResult,
  sessionId,
  getContent,
  onSave,
  forceSave,
  saveAnalysis,
  isSaving = false,
  hideBubbleMenu,
  onExpandToWord,
  onExpandToSentence,
  onExpandToParagraph,
  triggerManualAnalysis,
  enabled = true
}: UseKeyboardShortcutsProps): UseKeyboardShortcutsReturn {
  const isMountedRef = useRef(true);

  const handleSave = useCallback(() => {
    if (isSaving) return;

    if (lastAnalysisResult) {
      if (sessionId && forceSave) {
        forceSave();
      } else if (!sessionId && saveAnalysis) {
        saveAnalysis({
          type: lastAnalysisResult.type,
          text: lastAnalysisResult.text,
          analysisData: lastAnalysisResult.data,
        });
      } else if (onSave) {
        onSave();
      }
    } else {
      // Save current editor content
      const editorText = getContent.text();
      if (editorText.trim()) {
        if (sessionId && forceSave) {
          forceSave();
        } else if (!sessionId) {
          toast.error('Không có session để lưu', {
            description: 'Vui lòng tạo hoặc chọn session trước khi lưu.',
            duration: 3000,
          });
        } else if (onSave) {
          onSave();
        }
      } else {
        toast.error('Không có nội dung để lưu', {
          description: 'Vui lòng nhập nội dung trước khi lưu.',
          duration: 3000,
        });
      }
    }
  }, [
    lastAnalysisResult,
    sessionId,
    getContent,
    onSave,
    forceSave,
    saveAnalysis,
    isSaving
  ]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ctrl+S or Cmd+S for save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Ctrl+Shift+S or Cmd+Shift+S for save as new session
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      // This functionality can be implemented later
      toast.info('Tính năng lưu thành session mới sẽ có sớm!', {
        duration: 2000,
      });
    }

    // Escape to hide bubble menu
    if (e.key === 'Escape' && hideBubbleMenu) {
      hideBubbleMenu();
    }

    // Alt+W for expand to word
    if (e.altKey && e.key === 'w' && onExpandToWord) {
      e.preventDefault();
      onExpandToWord();
    }

    // Alt+S for expand to sentence
    if (e.altKey && e.key === 's' && onExpandToSentence) {
      e.preventDefault();
      onExpandToSentence();
    }

    // Alt+P for expand to paragraph
    if (e.altKey && e.key === 'p' && onExpandToParagraph) {
      e.preventDefault();
      onExpandToParagraph();
    }

    // Ctrl+Enter or Cmd+Enter for manual analysis
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && triggerManualAnalysis) {
      e.preventDefault();
      triggerManualAnalysis();
    }

    // Ctrl+B or Cmd+B for bold (if editor is available)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      // This would be handled by the editor itself, but we can add custom logic here if needed
    }

    // Ctrl+I or Cmd+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      // This would be handled by the editor itself
    }

    // Ctrl+U or Cmd+U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      // This would be handled by the editor itself
    }
  }, [
    enabled,
    handleSave,
    hideBubbleMenu,
    onExpandToWord,
    onExpandToSentence,
    onExpandToParagraph,
    triggerManualAnalysis
  ]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      isMountedRef.current = false;
    };
  }, [enabled, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {};
}

export default useKeyboardShortcuts;