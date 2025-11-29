import { useState } from 'react';
import { useCreateSession, useDeleteSession, useSession, useSessions } from '@/hooks/useSessions';
import { useAppNavigation } from '@/lib/navigation';
import type { AnalysisSession } from '@/types/sessions';

export function useSessionPageHandlers() {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { createSession, isCreating } = useCreateSession();
  const { deleteSession } = useDeleteSession();
  const { session, analyses, settings, isLoading: isSessionLoading, error: sessionError } = useSession(selectedSessionId || '');
  const { refetch } = useSessions();
  const { navigateToAnalysis } = useAppNavigation();

  const handleCreateSession = async (data: { title: string; description: string }) => {
    try {
      const newSession = await createSession({
        title: data.title,
        description: data.description,
        session_type: 'mixed' // Hardcoded as required
      });
      
      // Refetch sessions list
      refetch();
      
      // Redirect to the newly created session detail page
      if (newSession?.id) {
        setSelectedSessionId(newSession.id);
        setCurrentView('detail');
      }
      
      return newSession;
    } catch (error) {
      // Error handling is managed by the CreateSessionDialog component
      throw error;
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

  return {
    // State
    currentView,
    selectedSessionId,
    isCreateDialogOpen,
    session,
    analyses,
    settings,
    isSessionLoading,
    sessionError,
    isCreating,
    
    // Actions
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
  };
}