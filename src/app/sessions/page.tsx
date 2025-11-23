'use client';

import { useState } from 'react';
import { SessionList } from '@/components/sessions/SessionList';
import { SessionDetail } from '@/components/sessions/SessionDetail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft } from 'lucide-react';
import { useSessions, useCreateSession, useDeleteSession, useSession } from '@/hooks/useSessions';
import type { AnalysisSession } from '@/types/sessions';
import AuthGuard from '@/components/auth/auth-guard';

type View = 'list' | 'detail' | 'create';

interface CreateSessionFormData {
  title: string;
  description: string;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
}

export default function SessionsPage() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateSessionFormData>({
    title: '',
    description: '',
    session_type: 'mixed'
  });

  const { createSession } = useCreateSession();
  const { deleteSession } = useDeleteSession();
  const { sessions, isLoading, error, refetch } = useSessions();
  const { session, analyses, settings, isLoading: isSessionLoading, error: sessionError } = useSession(selectedSessionId || '');

  const handleCreateSession = async () => {
    if (!createFormData.title.trim()) return;

    try {
      await createSession({
        title: createFormData.title,
        description: createFormData.description,
        session_type: createFormData.session_type
      });

      // Reset form and close dialog
      setCreateFormData({
        title: '',
        description: '',
        session_type: 'mixed'
      });
      setIsCreateDialogOpen(false);
      
      // Refetch sessions list
      refetch();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleOpenSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedSessionId(null);
    setCurrentView('list');
  };

  const handleEditSession = (session: AnalysisSession) => {
    // TODO: Implement edit session dialog
    console.log('Edit session:', session);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      
      // If we're in detail view of the deleted session, go back to list
      if (selectedSessionId === sessionId) {
        handleBackToList();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSessionSettings = (sessionId: string) => {
    // TODO: Implement session settings dialog
    console.log('Session settings:', sessionId);
  };

  return (
    <AuthGuard redirectTo="/auth/signin">
      <div className="container mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8 max-w-7xl min-h-screen">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Quản lý phiên làm việc
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Tạo và quản lý các phiên phân tích của bạn
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {currentView === 'detail' && (
                <Button variant="outline" onClick={handleBackToList} className="flex-1 sm:flex-none">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Quay lại</span>
                  <span className="sm:hidden">Quay</span>
                </Button>
              )}
              <Button onClick={() => setIsCreateDialogOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tạo phiên mới</span>
                <span className="sm:hidden">Tạo mới</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'list' && (
          <SessionList
            onCreateSession={() => setIsCreateDialogOpen(true)}
            onOpenSession={handleOpenSession}
            onEditSession={handleEditSession}
            onSessionSettings={handleSessionSettings}
          />
        )}

        {currentView === 'detail' && selectedSessionId && (
          <SessionDetail
            session={session}
            analyses={analyses}
            settings={settings}
            isLoading={isSessionLoading}
            error={sessionError?.message || null}
            onBack={handleBackToList}
            onEdit={handleEditSession}
            onSettings={handleSessionSettings}
            onDelete={handleDeleteSession}
          />
        )}

        {/* Create Session Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px] mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo phiên làm việc mới</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề phiên làm việc..."
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả về phiên làm việc này (tùy chọn)..."
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_type">Loại phiên</Label>
                <Select 
                  value={createFormData.session_type} 
                  onValueChange={(value: 'word' | 'sentence' | 'paragraph' | 'mixed') => 
                    setCreateFormData(prev => ({ ...prev, session_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Phân tích từ</SelectItem>
                    <SelectItem value="sentence">Phân tích câu</SelectItem>
                    <SelectItem value="paragraph">Phân tích đoạn văn</SelectItem>
                    <SelectItem value="mixed">Hỗn hợp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Hủy
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={!createFormData.title.trim()}
                className="w-full sm:w-auto"
              >
                Tạo phiên
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}