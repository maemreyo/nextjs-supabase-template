import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface RenameSessionRequest {
  title: string;
  description?: string;
}

interface RenameSessionResponse {
  success: boolean;
  data?: {
    session: Database['public']['Tables']['analysis_sessions']['Row'];
    previousTitle: string;
    previousDescription?: string;
  };
  error?: string;
}

// PUT /api/sessions/[id]/rename - Rename a session
export const PUT = withAuth(
  async (request, { user, supabase, params }) => {
    apiLogger.start('Handling PUT /api/sessions/[id]/rename', {
      userId: user.id,
      sessionId: params?.id,
      timestamp: new Date().toISOString()
    })
    
    const sessionId = params?.id;

    if (!sessionId) {
      apiLogger.warn('Session ID is required', {
        error: 'Missing session ID'
      })
      
      return createErrorResponse('Session ID is required', 400);
    }

    // Parse request body
    const body: RenameSessionRequest = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return createErrorResponse('Title is required and cannot be empty', 400);
    }

    // Validate title length
    if (body.title.length > 200) {
      apiLogger.warn('Title must be 200 characters or less', {
        userId: user.id,
        sessionId: params?.id,
        titleLength: body.title.length
      })
      
      return createErrorResponse('Title must be 200 characters or less', 400);
    }

    // Validate description length if provided
    if (body.description && body.description.length > 1000) {
      return createErrorResponse('Description must be 1000 characters or less', 400);
    }

    // Get current session to track changes
    const { data: currentSession, error: fetchError } = await supabase
      .from('analysis_sessions')
      .select('title, description')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentSession) {
      apiLogger.warn('Session not found or access denied', {
        userId: user.id,
        sessionId: params?.id,
        error: fetchError?.message || 'Session not found'
      })
      
      return createErrorResponse('Session not found or access denied', 404);
    }

    // Check if title is actually different
    if (currentSession.title === body.title &&
        (currentSession.description || null) === (body.description || null)) {
      apiLogger.warn('No changes detected in session rename', {
        userId: user.id,
        sessionId: params?.id,
        currentTitle: currentSession.title,
        newTitle: body.title
      })
      
      return createErrorResponse('No changes detected', 400);
    }

    // Update session
    const updateData: Database['public']['Tables']['analysis_sessions']['Update'] = {
      title: body.title.trim(),
      description: body.description ? body.description.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      apiLogger.error('Failed to rename session', {
        userId: user.id,
        sessionId: params?.id,
        error: updateError.message
      })

      return createErrorResponse('Failed to rename session', 500);
    }

    const responseData = {
      session: updatedSession,
      previousTitle: currentSession.title,
      previousDescription: currentSession.description || undefined,
    };

    apiLogger.success('Session renamed successfully', {
      userId: user.id,
      sessionId: params?.id,
      previousTitle: currentSession.title,
      newTitle: updatedSession.title
    })

    return createSuccessResponse(responseData);
  }
);