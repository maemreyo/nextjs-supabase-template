import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { AnalysisEditorProps, WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';
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
import SessionHeader from './SessionHeader';

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
  sessionId: propSessionId
}: AnalysisEditorProps & {
  onAnalysisComplete?: (result: {
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
  }) => void;
  sessionId?: string;
}) {
  // Get sessionId from URL parameters if not provided as prop
  const searchParams = useSearchParams();
  const urlSessionId = NavigationValidation.getValidatedSessionId(searchParams);
  const sessionId = propSessionId || urlSessionId || undefined;
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();

  // Performance monitoring
  const performanceMetrics = usePerformanceMonitor('AnalysisEditor');

  // Local state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveToSessionDialogOpen, setSaveToSessionDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionQuickActionsOpen, setSessionQuickActionsOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<'word' | 'sentence' | 'paragraph'>('word');

  // Session store
  const { sessions, createSession, setCurrentSession } = useSessionStore();

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
    onTextSelect,
    onAnalysisRequest: (text, type) => {
      handleAnalysisRequest(text, type);
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
      console.error('AnalysisEditor - Save failed', error);
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
    onAnalyze: onAnalyze ? async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
      return await onAnalyze(text, type);
    } : undefined,
    onAnalysisComplete,
  });

  // Hook for saving analysis (fallback when no session)
  const { saveAnalysis, isLoading: isSaving } = useAnalysisSave({
    onSuccess: (data) => {
      toast.success('Đã lưu phân tích thành công', {
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('AnalysisEditor - Failed to save analysis', error);
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
  const handleAnalysisRequest = useMemoizedCallback(async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
    // Validate and sanitize input
    const validation = validateAnalysisText(text, {
      maxLength: 10000,
      allowEmpty: false
    });

    if (!validation.isValid) {
      toast.error('Invalid input', {
        description: validation.errors.join(', '),
        duration: 3000,
      });
      return;
    }

    // Additional security check
    const securityResult = securityCheck(validation.sanitized);
    if (!securityResult.isSafe) {
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

    // Validate and sanitize input
    const validation = validateAnalysisText(textToAnalyze, {
      maxLength: 10000,
      allowEmpty: false
    });

    if (!validation.isValid) {
      toast.error('Invalid input', {
        description: validation.errors.join(', '),
        duration: 3000,
      });
      return;
    }

    // Additional security check
    const securityResult = securityCheck(validation.sanitized);
    if (!securityResult.isSafe) {
      toast.error('Security check failed', {
        description: 'Input contains potentially dangerous content',
        duration: 3000,
      });
      return;
    }

    await triggerAnalysis(securityResult.sanitized, analysisType);
    hideBubbleMenu();
  }, [selection.text, analysisType, triggerAnalysis, getContent.text, hideBubbleMenu]);

  // Handle save
  const handleSave = useCallback(() => {
    if (lastAnalysisResult) {
      if (sessionId) {
        forceSave();
      } else {
        saveAnalysis({
          type: lastAnalysisResult.type,
          text: lastAnalysisResult.text,
          analysisData: lastAnalysisResult.data,
        });
      }
    } else {
      // Save current editor content
      const editorText = getContent.text || '';
      if (editorText.trim()) {
        if (sessionId) {
          forceSave();
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
  }, [lastAnalysisResult, sessionId, forceSave, saveAnalysis, getContent.text]);

  // Handle pronounce
  const handlePronounce = useCallback((text: string) => {
    console.log('Pronounce:', text);
    // Implement pronunciation logic here
  }, []);

  // Initialize content once and load session data
  useEffect(() => {
    // Set current session in store when session data is loaded
    if (session && !isSessionLoading) {
      setCurrentSession(session);
    }
  }, [sessionId, session, isSessionLoading, setCurrentSession]);

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
    
    // Validate session title
    const titleValidation = validateInput(title, 'analysisText', {
      maxLength: 100,
      allowEmpty: false
    });

    if (!titleValidation.isValid) {
      toast.error('Invalid session title', {
        description: titleValidation.errors.join(', '),
        duration: 3000,
      });
      return;
    }

    const newSession = await createSession({
      title: titleValidation.sanitized || title,
      session_type: 'mixed'
    });
    navigateToAnalysis(newSession.id);
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
    >
      <div className={`h-full flex flex-col ${className}`}>
        {/* Session Header */}
        <SessionHeader
          session={session}
          analysesCount={analyses.length}
          isLoading={isSessionLoading}
          onNavigateBack={navigateToSessions}
          onNavigateToSessions={navigateToSessions}
          onCreateNewSession={handleCreateNewSession}
        />

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
              type: selection.type === 'phrase' ? 'sentence' : selection.type,
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
            lastAnalysisResult={lastAnalysisResult}
            onAnalyze={handleAnalyze}
          /> */}
        </Card>

        {/* Bubble Menu */}
        <BubbleMenu
          position={bubbleMenuPosition}
          selection={{
            text: selection.text,
            type: selection.type === 'phrase' ? 'sentence' : selection.type,
          }}
          analysisType={analysisType}
          isAnalyzing={effectiveIsAnalyzing}
          isSaving={isSaving}
          lastAnalysisResult={lastAnalysisResult}
          autoSaveEnabled={autoSaveEnabled}
          sessionId={sessionId}
          onAnalyze={handleAnalyze}
          onSave={handleSave}
          onPronounce={handlePronounce}
          onHighlight={handleHighlight}
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