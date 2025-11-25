import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';

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
    console.log('🔍 [DEBUG] API detail route - Starting request');
    
    try {
      // Extract session ID from params (Next.js 16 compatible)
      const sessionId = params?.id;
      console.log('🔍 [DEBUG] API detail route - Session ID extracted:', sessionId);

      if (!sessionId) {
        console.error('🔍 [DEBUG] API detail route - Session ID is empty or undefined');
        return createErrorResponse('Session ID is required', 400);
      }

      console.log('🔍 [DEBUG] API detail route - Processing session ID:', sessionId);
  
      // Get session details including all content columns
      console.log('🔍 [DEBUG] API detail route - Fetching session data...');
      const { data: session, error: sessionError } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
  
      console.log('🔍 [DEBUG] API detail route - Session query result:', {
        sessionError,
        hasSession: !!session,
        sessionId: session?.id,
        userId: session?.user_id,
        hasContent: !!session?.content,
        hasContentHTML: !!session?.content_html,
        hasContentData: !!session?.content_data,
        hasContentPlain: !!session?.content_plain,
        contentFormat: session?.content_format
      });
  
      if (sessionError || !session) {
        console.error('🔍 [DEBUG] API detail route - Session not found or error:', { sessionError, sessionId });
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
        console.error('Error fetching session settings:', settingsError);
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
          console.error('Error fetching session tags:', tagRelationsError);
        }
      } catch (error) {
        console.error('Error fetching session tags:', error);
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

      console.log('🔍 [DEBUG] API detail route - Successfully processed session:', sessionId);
      return createSuccessResponse(responseData);
      
    } catch (error) {
      console.error('🔍 [DEBUG] API detail route - Unexpected error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: params?.id || 'unknown'
      });
      return createErrorResponse('Internal server error', 500);
    }
  }
);