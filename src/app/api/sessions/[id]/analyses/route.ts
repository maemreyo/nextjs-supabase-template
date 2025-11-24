import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import type { SessionAnalysis, SessionAnalysisInsert } from '@/types/sessions';

// GET /api/sessions/[id]/analyses - Get session analyses
export const GET = withAuth(
  async (request, { user, supabase }, { params }) => {
    const { id: sessionId } = await params;

    // Get session analyses
    const { data: analyses, error: fetchError } = await supabase
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return createSuccessResponse(analyses || []);
  }
);

// POST /api/sessions/[id]/analyses - Add analysis to session
export const POST = withAuth(
  async (request, { user, supabase }, { params }) => {
    const { id: sessionId } = await params;
    const analysisData: SessionAnalysisInsert = await request.json();

    // Validate required fields
    if (!analysisData.analysis_type || !analysisData.analysis_id) {
      return createErrorResponse('analysis_type and analysis_id are required', 400);
    }

    // Get next position
    const { data: existingAnalyses } = await supabase
      .from('session_analyses')
      .select('position')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingAnalyses && existingAnalyses.length > 0
      ? (existingAnalyses[0]?.position ?? 0) + 1
      : 0;

    // Insert analysis
    const { data: analysis, error: insertError } = await supabase
      .from('session_analyses')
      .insert({
        ...analysisData,
        session_id: sessionId,
        user_id: user.id,
        position: nextPosition
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return createSuccessResponse(analysis);
  }
);

// DELETE /api/sessions/[id]/analyses/[analysisId] - Remove analysis from session
export const DELETE = withAuth(
  async (request, { user, supabase }, { params }) => {
    // For DELETE, we need to extract analysisId from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const analysisId = pathSegments[pathSegments.length - 1];
    const { id: sessionId } = await params;
    
    if (!analysisId) {
      return createErrorResponse('Analysis ID is required', 400);
    }

    // Check if user owns the analysis
    const { data: analysis, error: checkError } = await supabase
      .from('session_analyses')
      .select('user_id')
      .eq('id', analysisId)
      .single();

    if (checkError || !analysis || analysis.user_id !== user.id) {
      return createErrorResponse('Analysis not found or access denied', 404);
    }

    // Delete analysis
    const { error: deleteError } = await supabase
      .from('session_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return createSuccessResponse({ id: analysisId });
  }
);

// PATCH /api/sessions/[id]/analyses/reorder - Reorder session analyses
export const PATCH = withAuth(
  async (request, { user, supabase }, { params }) => {
    const { id: sessionId } = await params;
    const { analysis_ids } = await request.json();

    if (!Array.isArray(analysis_ids) || analysis_ids.length === 0) {
      return createErrorResponse('analysis_ids array is required', 400);
    }

    // Update positions individually since we don't have the RPC function
    for (let i = 0; i < analysis_ids.length; i++) {
      const { error: updateError } = await supabase
        .from('session_analyses')
        .update({ position: i })
        .eq('id', analysis_ids[i])
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
    }

    return createSuccessResponse({ updated: true });
  }
);