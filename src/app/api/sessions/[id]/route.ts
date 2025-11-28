import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import type { AnalysisSession, AnalysisSessionUpdate } from '@/types/sessions';

// GET /api/sessions/[id] - Get specific session
export const GET = withAuth(
  async (request, { user, supabase, params }) => {
    const { id: sessionId } = params;

    // Get session with analyses and settings
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select(`
        *,
        session_settings!inner(*),
        session_analyses!inner(*)
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return createErrorResponse('Session not found', 404);
    }

    return createSuccessResponse(session);
  }
);

// PATCH /api/sessions/[id] - Update specific session
export const PATCH = withAuth(
  async (request, { user, supabase, params }) => {
    const { id: sessionId } = params;
    const updates: AnalysisSessionUpdate = await request.json();

    // Check if user owns the session
    const { data: existingSession, error: checkError } = await supabase
      .from('analysis_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (checkError || !existingSession || existingSession.user_id !== user.id) {
      return createErrorResponse('Session not found or access denied', 404);
    }

    // Update session
    const { data: session, error: updateError } = await supabase
      .from('analysis_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !session) {
      return createErrorResponse('Failed to update session', 500);
    }

    return createSuccessResponse(session);
  }
);

// DELETE /api/sessions/[id] - Delete specific session
export const DELETE = withAuth(
  async (request, { user, supabase, params }) => {
    const { id: sessionId } = params;

    // Check if user owns the session
    const { data: existingSession, error: checkError } = await supabase
      .from('analysis_sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();

    if (checkError || !existingSession || existingSession.user_id !== user.id) {
      return createErrorResponse('Session not found or access denied', 404);
    }

    // Delete session (cascade delete will handle related records)
    const { error: deleteError } = await supabase
      .from('analysis_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      return createErrorResponse('Failed to delete session', 500);
    }

    return createSuccessResponse({ id: sessionId });
  }
);