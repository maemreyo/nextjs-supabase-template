import React, { useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { AnalysisEditorProps, WordAnalysis, SentenceAnalysis, ParagraphAnalysis, PhraseAnalysis } from './types';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/hooks/stores/use-session-store';
import { useAnalysisSave } from '@/hooks/useAnalysisSave';
import { useSessionData } from '@/hooks/useSessionData';
import useTipTapEditor from '@/hooks/useTipTapEditor';
import useTipTapSelection from '@/hooks/useTipTapSelection';
import useTipTapAutoSave from '@/hooks/useTipTapAutoSave';
import { useAppNavigation, NavigationValidation } from '@/lib/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SessionQuickActions from './SessionQuickActions';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { clientLogger, analysisLogger } from '@/services/logger';

// Security imports
import { validateInput, validateAnalysisText, securityCheck } from '@/lib/security/input-validator';
import { sanitizeHTML, sanitizeTipTapContent, validateAndSanitizeContent } from '@/lib/security/content-sanitizer';
import { validateSessionForAPI } from '@/lib/security/session-validator';

// Performance imports
import { useMemoizedCallback } from '@/lib/performance/client-hooks';
import { usePerformanceMonitor, useDebouncedCallback } from '@/lib/performance/optimization-hooks';

// Import new components
import EditorToolbar from './EditorToolbar';
import EditorContent from './EditorContent';
import EditorStatusBar from './EditorStatusBar';
import BubbleMenu from './BubbleMenu';
import AnalysisDynamicIslandStatusBar from './AnalysisDynamicIslandStatusBar';

// Import new hooks
import useAnalysisLogic from '@/hooks/useAnalysisLogic';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';

export function AnalysisEditor({
  onTextSelect,
  onAnalyze,
  onAnalysisComplete,
  initialText = "",
  className = "",
  isAnalyzing: parentIsAnalyzing = false,
  sessionId: propSessionId,
  onEditorReady,
  onOverlayVisibilityChange
}: AnalysisEditorProps & {
  onAnalysisComplete?: (result: {
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: WordAnalysis | PhraseAnalysis | SentenceAnalysis | ParagraphAnalysis;
  }) => void;
  sessionId?: string;
}) {
  // Get sessionId from URL parameters if not provided as prop
  const searchParams = useSearchParams();
  
  // For Next.js 16, we need to handle searchParams carefully
  // Let's access the sessionId directly from the searchParams object
  let urlSessionId: string | null = null;
  try {
    // Try to get sessionId directly - this should work with both old and new Next.js
    urlSessionId = (searchParams as any)?.get?.('sessionId');
    
    // Validate the sessionId if we got one
    if (urlSessionId && NavigationValidation.isValidSessionId(urlSessionId)) {
      // Valid sessionId
    } else {
      urlSessionId = null;
    }
  } catch (error) {
    urlSessionId = null;
  }
  
  const sessionId = propSessionId || urlSessionId || undefined;
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();

  // Local state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionQuickActionsOpen, setSessionQuickActionsOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<'word' | 'phrase' | 'sentence' | 'paragraph'>('word');
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  // Dynamic Island state
  const [dynamicIslandVisible, setDynamicIslandVisible] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Refs để tránh race conditions
  const analysisInProgressRef = useRef(false);
  const lastAnalysisRequestRef = useRef<string>('');

  // Session store - separate state and actions to avoid dependency issues
  const sessions = useSessionStore(state => state.sessions);
  const createSession = useSessionStore(state => state.createSession);
  const setCurrentSession = useSessionStore(state => state.setCurrentSession);

  // Hook for loading session data
  const {
    session,
    analyses,
    isLoading: isSessionLoading,
    error: sessionError,
    getSessionText,
    getSessionHTML,
  } = useSessionData(sessionId, {
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize TipTap editor with session content
  const initialContent = useMemo(() => {
    if (sessionId && session) {
      return getSessionHTML() || getSessionText() || '';
    }
    return initialText;
  }, [sessionId, session, getSessionHTML, getSessionText, initialText]);

  // TipTap editor hook
  const {
    editor,
    EditorContent: TipTapEditorContent,
    formatCommands,
    activeFormats,
    getContent,
    setContent,
    textStats,
    isEditable,
  } = useTipTapEditor({
    initialContent,
    placeholder: 'Bắt đầu gõ văn bản của bạn...',
    editable: true,
    onUpdate: ({ html, json, text }) => {
      // Content update logic
    },
  });

  // Notify parent when editor is ready
  React.useEffect(() => {
    if (editor && onEditorReady) {
      clientLogger.info('AnalysisEditor', { type: 'editor_ready', sessionId });
      clientLogger.info('AnalysisEditor mounted', {
        sessionId,
        initialContentLength: initialContent.length,
        mountTime: Date.now()
      });
      onEditorReady(editor);
    }
  }, [editor, onEditorReady, sessionId]);

  // TipTap selection hook
  const {
    selection,
    bubbleMenuPosition,
    expandToWord,
    expandToSentence,
    expandToParagraph,
    clearSelection,
    hideBubbleMenu,
    triggerManualAnalysis,
  } = useTipTapSelection({
    editor,
    onTextSelect: onTextSelect,
    onAnalysisRequest: (selectionInfo) => {
      handleAnalysisRequest(selectionInfo.text, selectionInfo.type);
    },
    autoAnalysisEnabled: true,
  });

  // TipTap auto-save hook
  const {
    autoSaveStatus,
    hasUnsavedChanges,
    forceSave,
  } = useTipTapAutoSave({
    editor,
    sessionId,
    enabled: autoSaveEnabled && !!sessionId,
    debounceMs: 3000,
    intervalMs: 5 * 60 * 1000,
    enableBeforeUnload: false,
    enableNavigationSave: false,
    onSuccess: (data) => {
      // Save successful - could show toast notification here if needed
    },
    onError: (error) => {
      toast.error('Lưu thất bại', {
        description: 'Không thể lưu nội dung. Vui lòng thử lại.',
        duration: 3000,
      });
    }
  });

  // Analysis logic hook
  const {
    isAnalyzing,
    lastAnalysisResult,
    triggerAnalysis,
    setLastResult,
  } = useAnalysisLogic({
    onAnalyze: onAnalyze ? async (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
      try {
        setAnalysisError(null);
        setAnalysisProgress(0);
        return await onAnalyze(text, type);
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
        throw error;
      }
    } : undefined,
    onAnalysisComplete: (result) => {
      setAnalysisProgress(100);
      onAnalysisComplete?.(result);
      
      // Refetch session analyses after successful analysis if autoSave is enabled
      if (sessionId && autoSaveEnabled) {
        queryClient.invalidateQueries({
          queryKey: ['word-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['phrase-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['sentence-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['paragraph-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['session-analyses', sessionId],
        });
      }
    },
  });

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Hook for saving analysis (fallback when no session)
  const { saveAnalysis, isLoading: isSaving } = useAnalysisSave({
    onSuccess: (data) => {
      toast.success('Đã lưu phân tích thành công', {
        duration: 2000,
      });
      
      // Refetch session analyses after successful save
      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ['word-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['phrase-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['sentence-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['paragraph-analyses', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['session-analyses', sessionId],
        });
      }
    },
    onError: (error) => {
      toast.error('Lưu phân tích thất bại', {
        description: error.message || 'Không thể lưu kết quả phân tích. Vui lòng thử lại.',
        duration: 3000,
      });
    }
  });

  // Enhanced highlight colors with better contrast for both light and dark themes
  const highlightColors = [
    '#fef08a', // Light yellow - good for both themes
    '#bbf7d0', // Light green - good for both themes
    '#bfdbfe', // Light blue - good for both themes
    '#fca5a5', // Light red with better contrast
    '#e9d5ff', // Light purple - good for both themes
  ];

  // Handle analysis request function with security validation
  const handleAnalysisRequest = useMemoizedCallback(async (text: string, type: 'word' | 'phrase' | 'sentence' | 'paragraph') => {
    clientLogger.info('AnalysisEditor', { type: 'analysis_request', textLength: text.length, analysisType: type });
    
    // Validate and sanitize input
    const validation = validateAnalysisText(text, {
      maxLength: 10000,
      allowEmpty: false
    });

    if (!validation.isValid) {
      clientLogger.warn('AnalysisEditor', { type: 'validation_failed', errors: validation.errors });
      toast.error('Invalid input', {
        description: validation.errors.join(', '),
        duration: 3000,
      });
      return;
    }

    // Additional security check
    const securityResult = securityCheck(validation.sanitized);
    if (!securityResult.isSafe) {
      clientLogger.warn('AnalysisEditor', { type: 'security_check_failed', textLength: validation.sanitized.length });
      toast.error('Security check failed', {
        description: 'Input contains potentially dangerous content',
        duration: 3000,
      });
      return;
    }

    await triggerAnalysis(securityResult.sanitized, type);
  }, [triggerAnalysis]);

  // Handle highlight with TipTap
  const handleHighlight = useCallback((color: string) => {
    formatCommands.setHighlight(color);
    hideBubbleMenu();
  }, [formatCommands, hideBubbleMenu]);

  // Handle analysis with security validation
  const handleAnalyze = useMemoizedCallback(async () => {
    const textToAnalyze = selection.text || getContent.text || '';
    if (!textToAnalyze.trim()) return;

    clientLogger.info('AnalysisEditor', { type: 'analyze_clicked', textLength: textToAnalyze.length, selectionType: selection.type });
    
    // Tạo unique key cho request này để tránh duplicate
    const requestKey = `${textToAnalyze.trim()}-${selection.type}`;
    
    // Kiểm tra race condition
    if (analysisInProgressRef.current) {
      clientLogger.debug('AnalysisEditor', { type: 'analysis_in_progress', requestKey });
      return;
    }
    
    // Kiểm tra duplicate request
    if (lastAnalysisRequestRef.current === requestKey) {
      clientLogger.debug('AnalysisEditor', { type: 'duplicate_request_prevented', requestKey });
      return;
    }
    
    // Đặt flags để theo dõi
    analysisInProgressRef.current = true;
    lastAnalysisRequestRef.current = requestKey;

    try {
      // Validate and sanitize input
      const validation = validateAnalysisText(textToAnalyze, {
        maxLength: 10000,
        allowEmpty: false
      });

      if (!validation.isValid) {
        clientLogger.warn('AnalysisEditor', { type: 'validation_failed', errors: validation.errors });
        toast.error('Invalid input', {
          description: validation.errors.join(', '),
          duration: 3000,
        });
        return;
      }

      // Additional security check
      const securityResult = securityCheck(validation.sanitized);
      if (!securityResult.isSafe) {
        clientLogger.warn('AnalysisEditor', { type: 'security_check_failed', textLength: validation.sanitized.length });
        toast.error('Security check failed', {
          description: 'Input contains potentially dangerous content',
          duration: 3000,
        });
        return;
      }

      // FIX: Luôn sử dụng selection.type trực tiếp, không fallback sang analysisType state
      // selection.type luôn có giá trị hợp lệ khi có text được chọn
      const analysisTypeToUse = selection.type;
      
      clientLogger.info('AnalysisEditor', { type: 'analysis_started', analysisType: analysisTypeToUse, textLength: securityResult.sanitized.length });
      
      await triggerAnalysis(securityResult.sanitized, analysisTypeToUse);
      hideBubbleMenu();
    } catch (error) {
      clientLogger.error('AnalysisEditor', { type: 'analysis_failed', error: error instanceof Error ? error.message : 'Unknown error' });
      setAnalysisError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
      toast.error('Phân tích thất bại', {
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
        duration: 3000,
      });
    } finally {
      // Reset flags sau khi hoàn thành
      analysisInProgressRef.current = false;
      lastAnalysisRequestRef.current = '';
    }
  }, [selection.text, selection.type, triggerAnalysis, getContent.text, hideBubbleMenu]);

  // Handle save
  const handleSave = useCallback(() => {
    clientLogger.info('AnalysisEditor', { type: 'save_clicked', hasAnalysisResult: !!lastAnalysisResult, sessionId });
    
    if (lastAnalysisResult && lastAnalysisResult.data) {
      if (sessionId) {
        clientLogger.info('AnalysisEditor', { type: 'save_to_session', sessionId });
        forceSave();
      } else {
        clientLogger.info('AnalysisEditor', { type: 'save_analysis', analysisType: lastAnalysisResult.type });
        saveAnalysis({
          type: lastAnalysisResult.type as any,
          text: lastAnalysisResult.text,
          analysisData: lastAnalysisResult.data,
        });
      }
    } else {
      // Save current editor content
      const editorText = getContent.text || '';
      if (editorText.trim()) {
        if (sessionId) {
          clientLogger.info('AnalysisEditor', { type: 'save_editor_content_to_session', sessionId, textLength: editorText.length });
          forceSave();
        } else {
          clientLogger.warn('AnalysisEditor', { type: 'save_failed_no_session' });
          toast.error('Không có session để lưu', {
            description: 'Vui lòng tạo hoặc chọn session trước khi lưu.',
            duration: 3000,
          });
        }
      } else {
        clientLogger.warn('AnalysisEditor', { type: 'save_failed_no_content' });
        toast.error('Không có nội dung để lưu', {
          description: 'Vui lòng nhập nội dung trước khi lưu.',
          duration: 3000,
        });
      }
    }
  }, [lastAnalysisResult, sessionId, forceSave, saveAnalysis, getContent.text]);

  // Handle pronounce
  const handlePronounce = useCallback((text: string) => {
    // Implement pronunciation logic here
  }, []);

  // Handle overlay visibility change
  const handleOverlayVisibilityChange = useCallback((isVisible: boolean) => {
    setOverlayVisible(isVisible);
  }, []);

  // Handle Dynamic Island trigger
  const handleDynamicIslandTrigger = useCallback(() => {
    // Chỉ trigger nếu không có analysis đang chạy
    if (!analysisInProgressRef.current) {
      setDynamicIslandVisible(true);
      setAnalysisProgress(0);
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
    }
  }, []);

  // Handle Dynamic Island close
  const handleDynamicIslandClose = useCallback(() => {
    setDynamicIslandVisible(false);
    setAnalysisError(null);
    setAnalysisProgress(0);
  }, []);

  // Handle view details from Dynamic Island
  const handleDynamicIslandViewDetails = useCallback(() => {
    // This will trigger the detail dialog in the parent component
    // We'll use the existing onAnalysisComplete callback
    if (lastAnalysisResult) {
      onAnalysisComplete?.(lastAnalysisResult);
    }
  }, [lastAnalysisResult, onAnalysisComplete]);

  // Update Dynamic Island visibility when analysis completes
  useEffect(() => {
    if (isAnalyzing) {
      setDynamicIslandVisible(true);
      setAnalysisError(null);
    } else if (lastAnalysisResult) {
      setAnalysisProgress(100);
      // Keep the Dynamic Island visible to show results
      // Reset flags khi analysis hoàn thành
      analysisInProgressRef.current = false;
      lastAnalysisRequestRef.current = '';
    } else if (analysisError) {
      // Keep visible to show error
      // Reset flags khi có lỗi
      analysisInProgressRef.current = false;
      lastAnalysisRequestRef.current = '';
    }
  }, [isAnalyzing, lastAnalysisResult, analysisError]);

  // Initialize content once and load session data
  useEffect(() => {
    // Set current session in store when session data is loaded
    if (session && !isSessionLoading) {
      // Use direct store access to avoid dependency issues
      useSessionStore.getState().setCurrentSession(session);
    }
  }, [sessionId, session, isSessionLoading]); // Removed setCurrentSession from deps

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    lastAnalysisResult,
    sessionId,
    getContent: {
      text: () => getContent.text,
      html: () => getContent.html,
      json: () => getContent.json,
    },
    forceSave,
    saveAnalysis,
    isSaving,
    hideBubbleMenu,
    onExpandToWord: expandToWord,
    onExpandToSentence: expandToSentence,
    onExpandToParagraph: expandToParagraph,
    triggerManualAnalysis: handleAnalyze,
  });

  // Handle new session creation with validation
  const handleCreateNewSession = useMemoizedCallback(async () => {
    const title = `Session mới - ${new Date().toLocaleDateString('vi-VN')}`;
    clientLogger.info('AnalysisEditor', { type: 'create_new_session', title });
    
    // Validate session title
    const titleValidation = validateInput(title, 'analysisText', {
      maxLength: 100,
      allowEmpty: false
    });

    if (!titleValidation.isValid) {
      clientLogger.warn('AnalysisEditor', { type: 'session_title_validation_failed', errors: titleValidation.errors });
      toast.error('Invalid session title', {
        description: titleValidation.errors.join(', '),
        duration: 3000,
      });
      return;
    }

    try {
      const newSession = await createSession({
        title: titleValidation.sanitized || title,
        session_type: 'mixed'
      });
      clientLogger.info('AnalysisEditor', { type: 'session_created_successfully', sessionId: newSession.id });
      navigateToAnalysis(newSession.id);
    } catch (error) {
      clientLogger.error('AnalysisEditor', { type: 'session_creation_failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [createSession, navigateToAnalysis]);

  // Use parent's isAnalyzing state if provided, otherwise use local state
  const effectiveIsAnalyzing = parentIsAnalyzing || isAnalyzing;

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
          <h3 className="text-lg font-semibold text-destructive mb-2">Lỗi Component</h3>
          <p className="text-sm text-muted-foreground">
            Đã xảy ra lỗi trong trình soạn thảo. Vui lòng tải lại trang.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </Button>
        </div>
      }
      onError={(error) => {
        clientLogger.error('AnalysisEditor ErrorBoundary triggered', {
          sessionId,
          error: error?.message || 'Unknown error',
          componentStack: error?.stack
        });
      }}
    >
      <div className={`h-full flex flex-col ${className}`}>
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
        {/* {isSessionLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải session...</span>
          </div>
        )} */}

        <Card className="h-full">
          {/* Toolbar */}
          <EditorToolbar
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            lastAnalysisResult={lastAnalysisResult}
            sessionId={sessionId}
            onSave={handleSave}
            onSessionActions={() => setSessionQuickActionsOpen(true)}
            formatCommands={formatCommands}
            activeFormats={activeFormats}
            selection={{
              text: selection.text,
              type: selection.type,
            }}
            expandToWord={expandToWord}
            expandToSentence={expandToSentence}
            expandToParagraph={expandToParagraph}
            highlightColors={highlightColors}
            onHighlight={handleHighlight}
          />

          {/* Editor */}
          <EditorContent
            editor={editor}
          />

          {/* Status bar */}
          {/* <EditorStatusBar
            textStats={textStats}
            hasUnsavedChanges={hasUnsavedChanges}
            isAnalyzing={effectiveIsAnalyzing}
            lastAnalysisResult={lastAnalysisResult as any}
            onAnalyze={handleAnalyze}
          /> */}
        </Card>

        {/* Bubble Menu */}
        <BubbleMenu
          position={bubbleMenuPosition as any}
          selection={{
            text: selection.text,
            type: selection.type,
          }}
          analysisType={analysisType}
          isAnalyzing={effectiveIsAnalyzing}
          isSaving={isSaving}
          lastAnalysisResult={lastAnalysisResult as any}
          autoSaveEnabled={autoSaveEnabled}
          sessionId={sessionId}
          onAnalyze={handleAnalyze}
          onSave={handleSave}
          onPronounce={handlePronounce}
          onHighlight={handleHighlight}
          onDynamicIslandTrigger={handleDynamicIslandTrigger}
        />

        {/* Dynamic Island Status Bar */}
        <AnalysisDynamicIslandStatusBar
          isVisible={dynamicIslandVisible}
          isAnalyzing={effectiveIsAnalyzing}
          analysisResult={lastAnalysisResult as any}
          error={analysisError}
          onClose={handleDynamicIslandClose}
          onViewDetails={handleDynamicIslandViewDetails}
          progress={analysisProgress}
          onDismissComplete={() => {
            analysisLogger.info('DynamicIsland dismissed from parent', {
              wasVisible: dynamicIslandVisible,
              trigger: 'onDismissComplete'
            });
            setDynamicIslandVisible(false);
          }}
        />

        {/* Session Quick Actions Dialog */}
        <SessionQuickActions
          currentSession={session}
          isOpen={sessionQuickActionsOpen}
          onOpenChange={setSessionQuickActionsOpen}
        />

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
                  onChange={(e) => {
                    const validation = validateInput(e.target.value, 'analysisText', {
                      maxLength: 100,
                      allowEmpty: true
                    });
                    if (validation.isValid) {
                      setSessionTitle(validation.sanitized || '');
                    }
                  }}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-type">Session Type</Label>
                <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as 'word' | 'phrase' | 'sentence' | 'paragraph')}>
                  <SelectTrigger><SelectValue placeholder="Select session type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Word Analysis</SelectItem>
                    <SelectItem value="phrase">Phrase Analysis</SelectItem>
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
                onClick={() => {
                  // This dialog is disabled - functionality moved to parent component
                  setSaveToSessionDialogOpen(false);
                  setSessionTitle('');
                  setSelectedSessionId('');
                  toast.info('Tính năng này đã được di chuyển', {
                    description: 'Vui lòng sử dụng các nút lưu trên thanh công cụ.',
                    duration: 3000,
                  });
                }}
              >
                Save to Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default AnalysisEditor;