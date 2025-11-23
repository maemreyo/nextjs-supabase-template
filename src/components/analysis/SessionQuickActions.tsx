import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FolderOpen,
  Plus,
  Edit3,
  Copy,
  ArrowRight,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useSessionStore } from '@/stores/session-store';
import { useAppNavigation } from '@/lib/navigation';
import type { AnalysisSession } from '@/types/sessions';
import { useSupabase } from '@/components/providers/supabase-provider';

interface SessionQuickActionsProps {
  currentSession?: AnalysisSession | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionQuickActions({
  currentSession,
  isOpen,
  onOpenChange
}: SessionQuickActionsProps) {
  const { sessions, createSession } = useSessionStore();
  const { navigateToAnalysis, navigateToSessions } = useAppNavigation();
  const { getAccessToken } = useSupabase();
  
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  const resetForm = () => {
    setNewSessionTitle('');
    setNewSessionDescription('');
    setNewTitle('');
    setIsCreating(false);
    setIsRenaming(false);
  };

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast.error('Tên session không được để trống');
      return;
    }

    setIsCreating(true);
    try {
      const newSession = await createSession({
        title: newSessionTitle.trim(),
        description: newSessionDescription.trim() || undefined,
        session_type: 'mixed'
      });
      
      toast.success('Tạo session thành công', {
        description: `Session "${newSession.title}" đã được tạo.`,
        duration: 2000,
      });
      
      resetForm();
      onOpenChange(false);
      navigateToAnalysis(newSession.id);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Tạo session thất bại', {
        description: 'Không thể tạo session. Vui lòng thử lại.',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameSession = async () => {
    if (!currentSession || !newTitle.trim()) {
      toast.error('Tên session không được để trống');
      return;
    }

    setIsRenaming(true);
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

      const response = await fetch(`/api/sessions/${currentSession.id}/rename`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: newTitle.trim(),
          description: currentSession.description
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to rename session');
      }

      toast.success('Đổi tên session thành công', {
        description: `Session đã được đổi thành "${newTitle}".`,
        duration: 2000,
      });
      
      resetForm();
      onOpenChange(false);
      // Refresh the page to update the session title
      window.location.reload();
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Đổi tên session thất bại', {
        description: 'Không thể đổi tên session. Vui lòng thử lại.',
        duration: 5000,
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDuplicateSession = async () => {
    if (!currentSession) return;

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

      const response = await fetch(`/api/sessions/${currentSession.id}/duplicate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${currentSession.title} (Bản sao)`,
          includeAnalyses: true,
          includeSettings: true,
          includeTags: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to duplicate session');
      }

      const result = await response.json();
      
      toast.success('Nhân bản session thành công', {
        description: `Session "${result.data.duplicatedSession.title}" đã được tạo.`,
        duration: 2000,
      });
      
      onOpenChange(false);
      navigateToAnalysis(result.data.duplicatedSession.id);
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      toast.error('Nhân bản session thất bại', {
        description: 'Không thể nhân bản session. Vui lòng thử lại.',
        duration: 5000,
      });
    }
  };

  const handleSwitchToSession = (sessionId: string) => {
    navigateToAnalysis(sessionId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Quản lý Session Nhanh
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Session Info */}
          {currentSession && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Session hiện tại</h3>
                <Badge variant="outline" className="bg-primary/10 border-primary/30">
                  {currentSession.session_type === 'word' ? 'Từ' :
                   currentSession.session_type === 'sentence' ? 'Câu' :
                   currentSession.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tên:</span>
                  <span className="text-sm">{currentSession.title}</span>
                </div>
                
                {currentSession.description && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium">Mô tả:</span>
                    <span className="text-sm text-right max-w-[200px]">{currentSession.description}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ngày tạo:</span>
                  <span className="text-sm">
                    {new Date(currentSession.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <Separator className="my-3" />

              {/* Save Reminder */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Save className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Lưu thủ công</p>
                    <p className="text-xs">Auto-save đã được tắt để tránh spam. Hãy sử dụng nút "Lưu" hoặc phím tắt Ctrl+S để lưu kết quả phân tích của bạn.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewTitle(currentSession.title);
                    setActiveTab('manage');
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Đổi tên
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateSession}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Nhân bản
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateToSessions()}
                  className="flex items-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Danh sách
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('create')}
              className="rounded-b-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo mới
            </Button>
            <Button
              variant={activeTab === 'manage' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('manage')}
              className="rounded-b-none"
            >
              <Settings className="h-4 w-4 mr-2" />
              Quản lý
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-session-title">Tên session *</Label>
                <Input
                  id="new-session-title"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  placeholder="Nhập tên session..."
                  disabled={isCreating}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-session-description">Mô tả</Label>
                <Input
                  id="new-session-description"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  placeholder="Nhập mô tả (không bắt buộc)..."
                  disabled={isCreating}
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateSession}
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
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
              {currentSession && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rename-session">Đổi tên session</Label>
                    <Input
                      id="rename-session"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Nhập tên mới..."
                      disabled={isRenaming}
                      maxLength={200}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleRenameSession}
                      disabled={isRenaming || !newTitle.trim()}
                    >
                      {isRenaming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang đổi tên...
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Đổi tên
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              <div className="space-y-3">
                <h3 className="font-medium">Session gần đây</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSwitchToSession(session.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-xs">
                          {session.session_type === 'word' ? 'Từ' :
                           session.session_type === 'sentence' ? 'Câu' :
                           session.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
                        </Badge>
                        <span className="text-sm truncate">{session.title}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            resetForm();
            onOpenChange(false);
          }}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionQuickActions;