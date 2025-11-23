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
import {
  Plus,
  ArrowLeft,
  Home,
  FileText
} from 'lucide-react';
import { useSessions, useCreateSession, useDeleteSession, useSession } from '@/hooks/useSessions';
import type { AnalysisSession } from '@/types/sessions';
import AuthGuard from '@/components/auth/auth-guard';
import { useAppNavigation, createBreadcrumbItems } from '@/lib/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
  const { navigateToAnalysis } = useAppNavigation();

  const handleCreateSession = async () => {
    if (!createFormData.title.trim()) return;

    try {
      const newSession = await createSession({
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
      
      // Redirect to the newly created session detail page
      if (newSession?.id) {
        setSelectedSessionId(newSession.id);
        setCurrentView('detail');
      }
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

  const handleDuplicateSession = async (session: AnalysisSession) => {
    // TODO: Implement duplicate session
    console.log('Duplicate session:', session);
  };

  const handleArchiveSession = async (session: AnalysisSession) => {
    // TODO: Implement archive session
    console.log('Archive session:', session);
  };

  const handleExportSession = async (session: AnalysisSession) => {
    // TODO: Implement export session
    console.log('Export session:', session);
  };

  const handleShareSession = async (session: AnalysisSession) => {
    // TODO: Implement share session
    console.log('Share session:', session);
  };

  const handleOpenInEditor = (session: AnalysisSession) => {
    navigateToAnalysis(session.id);
  };

  // Create breadcrumb items
  const breadcrumbItems = createBreadcrumbItems('/sessions');

  return (
    <AuthGuard redirectTo="/auth/signin">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:px-8 max-w-7xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-4 sm:mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  Quản lý phiên phân tích
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Tạo và quản lý các phiên phân tích ngôn ngữ của bạn
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 w-full sm:w-auto">
                {currentView === 'detail' && (
                  <Button 
                    variant="outline" 
                    onClick={handleBackToList} 
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Quay lại danh sách</span>
                    <span className="sm:hidden">Quay lại</span>
                  </Button>
                )}
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tạo phiên mới</span>
                  <span className="sm:hidden">Tạo mới</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="space-y-6">
            {currentView === 'list' && (
              <SessionList
                onOpenSession={handleOpenSession}
                onEditSession={handleEditSession}
                onSessionSettings={handleSessionSettings}
                onDuplicateSession={handleDuplicateSession}
                onArchiveSession={handleArchiveSession}
                onExportSession={handleExportSession}
                onShareSession={handleShareSession}
                onOpenInEditor={handleOpenInEditor}
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
          </main>

          {/* Create Session Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[425px] mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Tạo phiên làm việc mới
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
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
                    autoFocus
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
                    className="w-full resize-none"
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
                      <SelectItem value="word">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                          Phân tích từ
                        </div>
                      </SelectItem>
                      <SelectItem value="sentence">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          Phân tích câu
                        </div>
                      </SelectItem>
                      <SelectItem value="paragraph">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Phân tích đoạn văn
                        </div>
                      </SelectItem>
                      <SelectItem value="mixed">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          Hỗn hợp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)} 
                  className="w-full sm:w-auto"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!createFormData.title.trim()}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo phiên
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  );
}