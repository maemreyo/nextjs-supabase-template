import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { useSupabase } from '@/components/providers/supabase-provider';
import { clientLogger } from '@/services/logger';

interface AutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  intervalMs?: number;
  enableBeforeUnload?: boolean;
  enableNavigationSave?: boolean;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  status: 'idle' | 'saving' | 'success' | 'error';
  error?: string;
}

interface UseTipTapAutoSaveProps extends AutoSaveOptions {
  editor: Editor | null;
  sessionId?: string;
  onSave?: (content: { html: string; json: any; text: string }) => Promise<void>;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useTipTapAutoSave({
  editor,
  sessionId,
  onSave,
  enabled = true,
  debounceMs = 3000,
  intervalMs = 5 * 60 * 1000, // 5 minutes
  enableBeforeUnload = false,
  enableNavigationSave = false,
  onSuccess,
  onError,
}: UseTipTapAutoSaveProps) {
  const { getAccessToken } = useSupabase();
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    status: 'idle',
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Save function
  const saveContent = useCallback(async (force = false) => {
    if (!editor || !enabled || (!sessionId && !onSave)) return;
    
    const currentContent = editor.getHTML();
    
    // Skip if content hasn't changed and not forced
    if (!force && currentContent === lastSavedContentRef.current) {
      return;
    }

    setAutoSaveStatus(prev => ({ ...prev, isSaving: true, status: 'saving' }));
    
    try {
      const content = {
        html: currentContent,
        json: editor.getJSON(),
        text: editor.getText(),
      };

      if (onSave) {
        await onSave(content);
      } else if (sessionId) {
        // Default save to session API
        const token = await getAccessToken();
        
        clientLogger.debug('AutoSave token retrieved', { hasToken: !!token });
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          clientLogger.error('AutoSave no token available');
          throw new Error('No authentication token available');
        }

        // Format data to match API expectations
        const requestData = {
          content_data: content.json, // TipTap JSON format (primary)
          content_html: content.html, // HTML format
          content_plain: content.text, // Plain text format
          content_format: 'tiptap', // Format identifier
        };

        clientLogger.start('AutoSave sending request', {
          sessionId,
          hasToken: !!token,
          contentLength: content.html.length
        });

        const response = await fetch(`/api/sessions/${sessionId}/content`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          clientLogger.error('AutoSave API error', {
            status: response.status,
            statusText: response.statusText,
            sessionId,
          });
          throw new Error(errorData.error || `Failed to save session content (${response.status})`);
        }

        const result = await response.json();
        lastSavedContentRef.current = currentContent;
        setHasUnsavedChanges(false);
        
        setAutoSaveStatus({
          isSaving: false,
          lastSaved: new Date(),
          status: 'success',
        });

        onSuccess?.(result);
        
        toast.success('Đã lưu', {
          description: 'Nội dung của bạn đã được lưu thành công.',
          duration: 2000,
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      
      setAutoSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        status: 'error',
        error: err.message,
      }));
      
      onError?.(err);
      
      toast.error('Lưu thất bại', {
        description: err.message,
        duration: 5000,
      });
    }
  }, [editor, sessionId, onSave, enabled, onSuccess, onError]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, debounceMs);
  }, [saveContent, debounceMs]);

  // Force save
  const forceSave = useCallback(() => {
    saveContent(true);
  }, [saveContent]);

  // Mark content as changed
  const markAsChanged = useCallback(() => {
    if (editor && isInitializedRef.current) {
      const currentContent = editor.getHTML();
      if (currentContent !== lastSavedContentRef.current) {
        setHasUnsavedChanges(true);
        debouncedSave();
      }
    }
  }, [editor, debouncedSave]);

  // Handle content changes
  const handleContentUpdate = useCallback(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      // Initialize with current content
      if (editor) {
        lastSavedContentRef.current = editor.getHTML();
      }
      return;
    }
    
    markAsChanged();
  }, [editor, markAsChanged]);

  // Setup event listeners
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = ({ transaction }: { transaction: any }) => {
      if (transaction.docChanged) {
        handleContentUpdate();
      }
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, handleContentUpdate]);

  // Setup interval save
  useEffect(() => {
    if (!enabled || !intervalMs) return;

    intervalSaveRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        saveContent();
      }
    }, intervalMs);

    return () => {
      if (intervalSaveRef.current) {
        clearInterval(intervalSaveRef.current);
      }
    };
  }, [enabled, intervalMs, hasUnsavedChanges, saveContent]);

  // Setup before unload handler
  useEffect(() => {
    if (!enableBeforeUnload || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableBeforeUnload, hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (intervalSaveRef.current) {
        clearInterval(intervalSaveRef.current);
      }
    };
  }, []);

  // Initialize with editor content
  useEffect(() => {
    if (editor && !isInitializedRef.current) {
      lastSavedContentRef.current = editor.getHTML();
      isInitializedRef.current = true;
    }
  }, [editor]);

  return {
    autoSaveStatus,
    hasUnsavedChanges,
    saveContent,
    forceSave,
    markAsChanged,
    isSaving: autoSaveStatus.isSaving,
    lastSaved: autoSaveStatus.lastSaved,
    status: autoSaveStatus.status,
    error: autoSaveStatus.error,
  };
}


export default useTipTapAutoSave;