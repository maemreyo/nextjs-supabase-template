'use client';

import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSessionData } from '@/hooks/useSessionData';
import { useSessionStore } from '@/stores/session-store';
import { useAppNavigation, NavigationValidation } from '@/lib/navigation';

export interface UseSessionPageHandlingProps {
  enabled?: boolean;
  staleTime?: number;
}

export interface UseSessionPageHandlingReturn {
  // Session data
  sessionId: string | null;
  session: any;
  analyses: any[];
  isLoading: boolean;
  error: any;
  getWordList: () => any[];
  
  // Session actions
  handleCreateNewSession: () => Promise<void>;
  navigateToSessions: () => void;
  navigateToAnalysis: (sessionId: string) => void;
}

/**
 * Custom hook để xử lý sessionId từ URL và session data
 * Quản lý việc load session data và các actions liên quan
 */
export function useSessionPageHandling({ 
  enabled = true, 
  staleTime = 5 * 60 * 1000 // 5 minutes 
}: UseSessionPageHandlingProps = {}): UseSessionPageHandlingReturn {
  const searchParams = useSearchParams();
  
  // Extract sessionId from URL parameters
  let sessionId: string | null = null;
  try {
    // Try to get sessionId directly - this should work with both old and new Next.js
    sessionId = (searchParams as any)?.get?.('sessionId');
    
    // Validate sessionId if we got one
    if (sessionId && NavigationValidation.isValidSessionId(sessionId)) {
      // Valid sessionId
    } else {
      sessionId = null;
    }
  } catch (error) {
    console.error('[DEBUG] useSessionPageHandling - Error processing searchParams:', error);
    sessionId = null;
  }

  // Load session data
  const {
    session,
    analyses,
    isLoading: isSessionLoading,
    error: sessionError,
    getWordList
  } = useSessionData(sessionId || undefined, {
    enabled: enabled && !!sessionId,
    staleTime,
  });

  // Store actions
  const { createSession } = useSessionStore();
  const { navigateToSessions, navigateToAnalysis } = useAppNavigation();

  // Handle new session creation
  const handleCreateNewSession = useCallback(async () => {
    const title = `Session mới - ${new Date().toLocaleDateString('vi-VN')}`;
    const newSession = await createSession({
      title,
      session_type: 'mixed'
    });
    navigateToAnalysis(newSession.id);
  }, [createSession, navigateToAnalysis]);

  return {
    // Session data
    sessionId,
    session,
    analyses,
    isLoading: isSessionLoading,
    error: sessionError,
    getWordList,
    
    // Session actions
    handleCreateNewSession,
    navigateToSessions,
    navigateToAnalysis,
  };
}

export default useSessionPageHandling;