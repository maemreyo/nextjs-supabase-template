import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import type { AnalysisEditorProps, WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from './types';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const urlSessionId = NavigationValidation.getValidatedSessionId(searchParams);
  const sessionId = propSessionId || urlSessionId || undefined;
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();

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

  // Hook for loading session data
  const {
    session,
    analyses,
    settings,
    isLoading: isSessionLoading,
    error: sessionError,
    getSessionText,
    getSessionHTML,
    getWordList
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

  console.log("initialContent", initialContent)

  // TipTap editor hook
  const {
    editor,
    EditorContent,
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
    analysisType,
    setAnalysisType,
    expandToWord,
    expandToSentence,
    expandToParagraph,
    clearSelection,
    hideBubbleMenu,
    triggerManualAnalysis,
  } = useTipTapSelection({
    editor,
    onTextSelect: (text, type) => {
      // Handle text selection
    },
    onAnalysisRequest: (text, type) => {
      // Handle analysis request
      handleAnalysisRequest(text, type);
    },
    autoAnalysisEnabled,
  });

  // TipTap auto-save hook
  const {
    autoSaveStatus,
    hasUnsavedChanges,
    forceSave,
    markAsChanged,
  } = useTipTapAutoSave({
    editor,
    sessionId,
    enabled: autoSaveEnabled && !!sessionId,
    debounceMs: 3000,
    intervalMs: 5 * 60 * 1000,
    enableBeforeUnload: false,
    enableNavigationSave: false,
    onSuccess: (data) => {
      console.log('🔍 [DEBUG] AnalysisEditor - Save successful', data);
    },
    onError: (error) => {
      console.error('🔍 [DEBUG] AnalysisEditor - Save failed', error);
    }
  });

  // Track last analysis request to prevent duplicates
  const lastAnalysisRef = useRef<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    timestamp: number;
  } | null>(null);

  const { sessions, createSession, addAnalysisToSession, setCurrentSession } = useSessionStore();

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

  // Enhanced highlight colors with better contrast for both light and dark themes
  const highlightColors = [
    '#fef08a', // Light yellow - good for both themes
    '#bbf7d0', // Light green - good for both themes
    '#bfdbfe', // Light blue - good for both themes
    '#fca5a5', // Light red with better contrast
    '#e9d5ff', // Light purple - good for both themes
  ];

  // Handle analysis request function
  const handleAnalysisRequest = useCallback(async (text: string, type: 'word' | 'sentence' | 'paragraph') => {
    console.log('🔍 [DEBUG] handleAnalysisRequest called', { text, type });

    setIsAnalyzing(true);
    try {
      const result = await onAnalyze?.(text, type);

      if (result) {
        const analysisData = {
          text,
          type,
          data: result
        };

        setLastAnalysisResult(analysisData);
        onAnalysisComplete?.(analysisData);
      }
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  }, [onAnalyze, onAnalysisComplete]);

  // Handle highlight with TipTap
  const handleHighlight = useCallback((color: string) => {
    formatCommands.setHighlight(color);
    hideBubbleMenu();
  }, [formatCommands, hideBubbleMenu]);

  // Handle analysis
  const handleAnalyze = useCallback(async () => {

    const textToAnalyze = selection.text || getContent.text || '';
    if (!textToAnalyze.trim()) return;

    // Update the last analysis ref to prevent duplicates
    lastAnalysisRef.current = {
      text: textToAnalyze,
      type: analysisType,
      timestamp: Date.now()
    };

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
      }

      hideBubbleMenu();
    } catch (err) {
      // Error is now handled at page level
      console.error(err instanceof Error ? err.message : 'Phân tích thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selection, analysisType, onAnalyze, getContent.text, onAnalysisComplete, hideBubbleMenu, sessionId]);

  // Initialize content once and load session data
  useEffect(() => {
    console.log('🔍 [DEBUG] AnalysisEditor - Initialize effect triggered', {
      hasEditor: !!editor,
      initialText,
      sessionId,
      hasSessionData: !!session,
      isSessionLoading
    });

    // Set current session in store when session data is loaded
    if (session && !isSessionLoading) {
      setCurrentSession(session);
    }
  }, [initialText, sessionId, session, isSessionLoading, setCurrentSession]);

  // Setup event listeners
  useEffect(() => {
    console.log('🔍 [DEBUG] AnalysisEditor - Event listeners setup effect triggered');

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('🔍 [DEBUG] AnalysisEditor - Save shortcut triggered');

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
            console.log('🔍 [DEBUG] AnalysisEditor - Saving editor content from keyboard shortcut', {
              textLength: editorText.length,
              hasSessionId: !!sessionId,
            });

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
      }

      // Ctrl+Shift+S or Cmd+Shift+S for save as new session
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log('🔍 [DEBUG] AnalysisEditor - Save as new session shortcut triggered');
        // We'll implement this later
      }

      // Escape to hide bubble menu
      if (e.key === 'Escape') {
        hideBubbleMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lastAnalysisResult, sessionId, forceSave, saveAnalysis, getContent.text, hideBubbleMenu]);

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

  return (
    <div className={`h-full flex flex-col ${className}`}>
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
                    console.log('🔍 [DEBUG] AnalysisEditor - Saving editor content', {
                      textLength: editorText.length,
                      hasSessionId: !!sessionId,
                    });

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
              }}
              disabled={isSaving || (!lastAnalysisResult && !getContent.text)}
              className="h-7 px-2"
              title={sessionId ? "Lưu kết quả phân tích vào session (Ctrl+S)" : "Lưu kết quả phân tích (Ctrl+S)"}
            >
              {(isSaving) ? (
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
            <ToolBtn onClick={() => formatCommands.bold()} active={activeFormats.bold} title="Bold">
              <Bold size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.italic()} active={activeFormats.italic} title="Italic">
              <Italic size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.underline()} active={activeFormats.underline} title="Underline">
              <Underline size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.strike()} active={activeFormats.strike} title="Strike">
              <Strikethrough size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.clearFormat()} title="Clear">
              <Code size={16} />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatCommands.bulletList()} title="Bullet list">
              <List size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.orderedList()} title="Ordered list">
              <ListOrdered size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.blockquote()} title="Quote">
              <Quote size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.horizontalRule()} title="Horizontal rule">
              <Minus size={16} />
            </ToolBtn>
          </div>

          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatCommands.undo()} title="Undo">
              <Undo size={16} />
            </ToolBtn>
            <ToolBtn onClick={() => formatCommands.redo()} title="Redo">
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
            {selection.text && (
              <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                <MousePointer className="h-3 w-3 mr-1" />
                Đã chọn: {selection.text.length} ký tự
              </Badge>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          {(() => {
            console.log('🔍 [DEBUG] AnalysisEditor - Rendering editor div');
            return null;
          })()}
          <div className="max-w-4xl mx-auto">
            <EditorContent
              editor={editor}
              className="min-h-96 p-6 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 prose max-w-none"
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
          <Badge variant="secondary" className="text-xs px-2 border-r">{selection.type}</Badge>
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
                  forceSave();
                } else {
                  // Save without session (fallback)
                  saveAnalysis({
                    type: lastAnalysisResult.type,
                    text: lastAnalysisResult.text,
                    analysisData: lastAnalysisResult.data,
                  });
                }
              }}
              disabled={isSaving}
              className="h-7 px-2 text-xs"
              title={sessionId ? "Lưu kết quả phân tích vào session" : "Lưu kết quả phân tích"}
            >
              {isSaving ? (
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
            onClick={() => console.log('Pronounce:', selection.text)}
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

  {/* Session Quick Actions Dialog */ }
  <SessionQuickActions
    currentSession={session}
    isOpen={sessionQuickActionsOpen}
    onOpenChange={setSessionQuickActionsOpen}
  />

  console.log('🔍 [DEBUG] AnalysisEditor - Component finished');
}

export default AnalysisEditor;