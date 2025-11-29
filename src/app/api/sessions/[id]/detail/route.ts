import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface SessionDetailResponse {
  success: boolean;
  data?: {
    session: Database['public']['Tables']['analysis_sessions']['Row'];
    settings?: Database['public']['Tables']['session_settings']['Row'];
    tags?: any[]; // Using any for now due to complex joins
  };
  error?: string;
}

// GET /api/sessions/[id]/detail - Load session details without analyses (fast)
export const GET = withAuth(
  async (request, { user, supabase, params }) => {

    
    try {
      // Extract session ID from params (Next.js 16 compatible)
      const sessionId = params?.id;


      if (!sessionId) {

        return createErrorResponse('Session ID is required', 400);
      }


  
      // Get session details including all content columns

      const { data: session, error: sessionError } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
  
      
  
      if (sessionError || !session) {
        apiLogger.warn('Session not found or access denied', {
          userId: user.id,
          sessionId,
          error: sessionError?.message || 'Session not found'
        })
        
        return createErrorResponse('Session not found or access denied', 404);
      }

      // Get session settings
      const { data: settings, error: settingsError } = await supabase
        .from('session_settings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {

        // Don't fail the request if settings are not found
      }

      // Get session tags
      let tags: any[] = [];
      try {
        const { data: tagRelations, error: tagRelationsError } = await supabase
          .from('session_tag_relations')
          .select('tag_id')
          .eq('session_id', sessionId);

        if (!tagRelationsError && tagRelations) {
          const tagIds = tagRelations
            .map(relation => relation.tag_id)
            .filter((tagId): tagId is string => tagId !== null);
          if (tagIds.length > 0) {
            const { data: tagData } = await supabase
              .from('session_tags')
              .select('*')
              .in('id', tagIds);
            tags = tagData || [];
          }
        } else if (tagRelationsError) {

        }
      } catch (error) {

        // Don't fail the request if tags are not found
      }

      // Update last_accessed_at
      await supabase
        .from('analysis_sessions')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', sessionId);

      const responseData = {
        session,
        settings: settings || undefined,
        tags,
      };


      apiLogger.success('Session detail retrieved successfully', {
        userId: user.id,
        sessionId,
        hasSettings: !!settings,
        tagsCount: tags.length
      })

      return createSuccessResponse(responseData);
      
    } catch (error) {
      apiLogger.error('Error in session detail API', {
        userId: user?.id,
        sessionId: params?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      return createErrorResponse('Internal server error', 500);
    }
  }
);