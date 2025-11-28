import React, { useState } from 'react';
import { clientLogger } from '@/services/logger';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ProgressIndicator, StepProgress } from '@/components/ui/progress-indicator';
import { StatusToast, useStatusToasts } from '@/components/ui/status-toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
// import { Slider } from '@/components/ui/slider'; // Commented out as it doesn't exist yet
import {
  Loader2,
  Plus,
  Settings,
  Timer,
  Save,
  Info,
  Zap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AutoSaveStatusIndicator from './AutoSaveStatusIndicator';
import type { AnalysisSession, SessionSettings } from '@/types/sessions';
import type { AutoSaveStatus } from '@/hooks/useSessionAutoSave';

interface SessionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSession: (data: {
    title: string;
    description?: string;
    session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
    autoSave?: boolean;
    autoSaveInterval?: number;
  }) => Promise<AnalysisSession>;
  onUpdateSettings: (sessionId: string, settings: Partial<SessionSettings>) => Promise<void>;
  currentSession?: AnalysisSession | null;
  currentSettings?: SessionSettings | null;
  autoSaveStatus?: AutoSaveStatus | null;
  loading?: boolean;
}

export function SessionManager({
  open,
  onOpenChange,
  onCreateSession,
  onUpdateSettings,
  currentSession,
  currentSettings,
  autoSaveStatus,
  loading = false
}: SessionManagerProps) {
  // New session form state
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [newSessionType, setNewSessionType] = useState<'word' | 'sentence' | 'paragraph' | 'mixed'>('mixed');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5); // minutes
  
  // Settings form state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'detailed'>('standard');
  const [preferredProvider, setPreferredProvider] = useState('');
  const [preferredModel, setPreferredModel] = useState('');
  const [compactView, setCompactView] = useState(false);
  const [showSummaries, setShowSummaries] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [sessionReminders, setSessionReminders] = useState(false);
  
  const [titleError, setTitleError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const { success, error } = useStatusToasts();

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      // Initialize with current settings
      if (currentSettings) {
        setAutoSaveEnabled(currentSettings.auto_save ?? true);
        setAutoSaveInterval(5); // Default 5 minutes
        setAnalysisDepth(currentSettings.analysis_depth ?? 'standard');
        setPreferredProvider(currentSettings.preferred_ai_provider ?? '');
        setPreferredModel(currentSettings.preferred_ai_model ?? '');
        setCompactView(currentSettings.compact_view ?? false);
        setShowSummaries(currentSettings.show_summaries ?? true);
        setEmailNotifications(currentSettings.email_notifications ?? false);
        setSessionReminders(currentSettings.session_reminders ?? false);
      }
    } else {
      // Reset form
      setNewSessionTitle('');
      setNewSessionDescription('');
      setNewSessionType('mixed');
      setAutoSaveEnabled(true);
      setAutoSaveInterval(5);
      setTitleError('');
      setSettingsError('');
    }
  }, [open, currentSettings]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!newSessionTitle.trim()) {
      setTitleError('Tên session không được để trống');
      return;
    }
    
    if (newSessionTitle.length > 200) {
      setTitleError('Tên session không được quá 200 ký tự');
      return;
    }

    if (newSessionDescription && newSessionDescription.length > 1000) {
      setTitleError('Mô tả không được quá 1000 ký tự');
      return;
    }

    setIsCreating(true);
    try {
      clientLogger.info('Creating new session', { title: newSessionTitle.trim(), type: newSessionType });
      const result = await onCreateSession({
        title: newSessionTitle.trim(),
        description: newSessionDescription.trim() || undefined,
        session_type: newSessionType,
        autoSave: autoSaveEnabled,
        autoSaveInterval: autoSaveInterval,
      });
      
      // Reset form
      setNewSessionTitle('');
      setNewSessionDescription('');
      setNewSessionType('mixed');
      setTitleError('');
      
      // Show success notification
      clientLogger.success('Session created successfully', { sessionId: result.id, title: result.title });
      success('Tạo session thành công', `Session "${result.title}" đã được tạo thành công.`);
    } catch (err) {
      clientLogger.error('Failed to create session', { title: newSessionTitle.trim(), error: err instanceof Error ? err.message : String(err) });
      setTitleError('Không thể tạo session. Vui lòng thử lại.');
      error('Tạo session thất bại');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSession) return;

    setIsUpdatingSettings(true);
    try {
      clientLogger.start('Updating session settings', { sessionId: currentSession.id });
      await onUpdateSettings(currentSession.id, {
        auto_save: autoSaveEnabled,
        analysis_depth: analysisDepth,
        preferred_ai_provider: preferredProvider || null,
        preferred_ai_model: preferredModel || null,
        compact_view: compactView,
        show_summaries: showSummaries,
        email_notifications: emailNotifications,
        session_reminders: sessionReminders,
      });
      
      setSettingsError('');
      // Show success notification
      clientLogger.success('Session settings updated successfully', { sessionId: currentSession.id });
      success('Cập nhật cài đặt thành công', 'Cài đặt session đã được cập nhật thành công.');
    } catch (err) {
      clientLogger.error('Failed to update session settings', { sessionId: currentSession.id, error: err instanceof Error ? err.message : String(err) });
      setSettingsError('Không thể cập nhật cài đặt. Vui lòng thử lại.');
      error('Cập nhật cài đặt thất bại');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const sessionTypeOptions = [
    { value: 'word', label: 'Phân tích từ', description: 'Tập trung vào phân tích từ vựng' },
    { value: 'sentence', label: 'Phân tích câu', description: 'Tập trung vào phân tích câu hoàn chỉnh' },
    { value: 'paragraph', label: 'Phân tích đoạn', description: 'Tập trung vào phân tích đoạn văn bản' },
    { value: 'mixed', label: 'Hỗn hợp', description: 'Hỗ trợ tất cả các loại phân tích' },
  ];

  const analysisDepthOptions = [
    { value: 'basic', label: 'Cơ bản', description: 'Phân tích nhanh và cơ bản' },
    { value: 'standard', label: 'Tiêu chuẩn', description: 'Cân bằng giữa tốc độ và chi tiết' },
    { value: 'detailed', label: 'Chi tiết', description: 'Phân tích sâu và toàn diện' },
  ];

  const intervalOptions = [
    { value: 1, label: '1 phút' },
    { value: 2, label: '2 phút' },
    { value: 5, label: '5 phút' },
    { value: 10, label: '10 phút' },
    { value: 15, label: '15 phút' },
    { value: 30, label: '30 phút' },
  ];

  return (
    <ErrorBoundary>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <LoadingOverlay isLoading={loading} variant="blur">
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quản lý Session & Cài đặt
              </DialogTitle>
              <DialogDescription>
                Tạo session mới, quản lý cài đặt tự động lưu và tùy chọn nâng cao.
              </DialogDescription>
            </DialogHeader>
        
        <div className="space-y-6">
          {/* Auto-save Status */}
          {autoSaveStatus && currentSession && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Tự động lưu
                </h3>
                <Badge variant="outline" className="bg-primary/10 border-primary/30">
                  {currentSession.title}
                </Badge>
              </div>
              
              <AutoSaveStatusIndicator 
                status={autoSaveStatus} 
                showNextAutoSave={true}
              />
            </div>
          )}

          <Separator />

          {/* Create New Session */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tạo Session Mới
            </h3>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-title">Tên session *</Label>
                  <Input
                    id="new-title"
                    value={newSessionTitle}
                    onChange={(e) => {
                      setNewSessionTitle(e.target.value);
                      setTitleError('');
                    }}
                    placeholder="Nhập tên session..."
                    className={cn(titleError && "border-red-500")}
                    disabled={isCreating}
                    maxLength={200}
                  />
                  {titleError && (
                    <p className="text-sm text-red-600">{titleError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-type">Loại session</Label>
                  <Select value={newSessionType} onValueChange={(value) => setNewSessionType(value as any)} disabled={isCreating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-description">Mô tả</Label>
                <Textarea
                  id="new-description"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="Nhập mô tả cho session (không bắt buộc)..."
                  disabled={isCreating}
                  maxLength={1000}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {newSessionDescription.length}/1000 ký tự
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-save-enabled"
                    checked={autoSaveEnabled}
                    onCheckedChange={(checked) => setAutoSaveEnabled(checked as boolean)}
                    disabled={isCreating}
                  />
                  <Label htmlFor="auto-save-enabled" className="text-sm font-medium">
                    Bật tự động lưu
                  </Label>
                </div>
                
                {autoSaveEnabled && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-save-interval" className="text-sm">Khoảng:</Label>
                    <Select value={autoSaveInterval.toString()} onValueChange={(value) => setAutoSaveInterval(Number(value))} disabled={isCreating}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {intervalOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isCreating || !newSessionTitle.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <Separator />

          {/* Session Settings */}
          {currentSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cài đặt Session
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  {showAdvancedSettings ? 'Thu gọn' : 'Nâng cao'}
                </Button>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-4">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="analysis-depth">Độ sâu phân tích</Label>
                    <Select value={analysisDepth} onValueChange={(value) => setAnalysisDepth(value as any)} disabled={isUpdatingSettings}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {analysisDepthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-save-settings">Tự động lưu</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-save-settings"
                        checked={autoSaveEnabled}
                        onCheckedChange={(checked) => setAutoSaveEnabled(checked as boolean)}
                        disabled={isUpdatingSettings}
                      />
                      <Label htmlFor="auto-save-settings" className="text-sm">
                        {autoSaveEnabled ? 'Đã bật' : 'Đã tắt'}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                {showAdvancedSettings && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="preferred-provider">AI Provider ưa thích</Label>
                        <Input
                          id="preferred-provider"
                          value={preferredProvider}
                          onChange={(e) => setPreferredProvider(e.target.value)}
                          placeholder="OpenAI, Anthropic, v.v..."
                          disabled={isUpdatingSettings}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="preferred-model">AI Model ưa thích</Label>
                        <Input
                          id="preferred-model"
                          value={preferredModel}
                          onChange={(e) => setPreferredModel(e.target.value)}
                          placeholder="gpt-4, claude-3, v.v..."
                          disabled={isUpdatingSettings}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="compact-view"
                          checked={compactView}
                          onCheckedChange={(checked) => setCompactView(checked as boolean)}
                          disabled={isUpdatingSettings}
                        />
                        <Label htmlFor="compact-view" className="text-sm font-medium">
                          Giao diện thu gọn
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-summaries"
                          checked={showSummaries}
                          onCheckedChange={(checked) => setShowSummaries(checked as boolean)}
                          disabled={isUpdatingSettings}
                        />
                        <Label htmlFor="show-summaries" className="text-sm font-medium">
                          Hiển thị tóm tắt
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email-notifications"
                          checked={emailNotifications}
                          onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                          disabled={isUpdatingSettings}
                        />
                        <Label htmlFor="email-notifications" className="text-sm font-medium">
                          Thông báo email
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="session-reminders"
                          checked={sessionReminders}
                          onCheckedChange={(checked) => setSessionReminders(checked as boolean)}
                          disabled={isUpdatingSettings}
                        />
                        <Label htmlFor="session-reminders" className="text-sm font-medium">
                          Nhắc nhở session
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {settingsError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{settingsError}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdatingSettings}
                  >
                    {isUpdatingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Cập nhật Cài đặt
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
        </DialogContent>
      </LoadingOverlay>
    </Dialog>
  </ErrorBoundary>
);
}

export default SessionManager;