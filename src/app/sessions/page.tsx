'use client';

import { SessionList } from '@/components/sessions/SessionList';
import { SessionDetail } from '@/components/sessions/SessionDetail';
import { CreateSessionDialog } from '@/components/sessions/CreateSessionDialog';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ArrowLeft,
  Home,
  FileText
} from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useSessionPageHandlers } from '@/hooks/useSessionPageHandlers';
import AuthGuard from '@/components/auth/auth-guard';
import { createBreadcrumbItems } from '@/lib/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { sessionLogger } from '@/services/logger';

export default function SessionsPage() {
  sessionLogger.debug('SessionsPage rendering')
  
  const { sessions, isLoading, error, refetch } = useSessions();
  const {
    currentView,
    selectedSessionId,
    isCreateDialogOpen,
    session,
    analyses,
    settings,
    isSessionLoading,
    sessionError,
    isCreating,
    setIsCreateDialogOpen,
    handleCreateSession,
    handleOpenSession,
    handleBackToList,
    handleEditSession,
    handleDeleteSession,
    handleSessionSettings,
    handleDuplicateSession,
    handleArchiveSession,
    handleExportSession,
    handleShareSession,
    handleOpenInEditor,
  } = useSessionPageHandlers();

  // Create breadcrumb items
  const breadcrumbItems = createBreadcrumbItems('/sessions');

  sessionLogger.debug('SessionsPage rendering with AuthGuard')
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
          <CreateSessionDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onCreate={handleCreateSession}
            isCreating={isCreating}
          />
        </div>
      </div>
    </AuthGuard>
  );
}