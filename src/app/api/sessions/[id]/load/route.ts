import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';

interface SessionLoadResponse {
  success: boolean;
  data?: {
    session: Database['public']['Tables']['analysis_sessions']['Row'];
    analyses: any[]; // Using any for now due to complex joins
    settings?: Database['public']['Tables']['session_settings']['Row'];
    tags?: any[]; // Using any for now due to complex joins
  };
  error?: string;
}

// GET /api/sessions/[id]/load - Load session details with all analyses
export const GET = withAuth(
  async (request, { user, supabase, params }) => {
    console.log('🔍 [DEBUG] API load route - Starting request');
    
    try {
      // Extract session ID from params (Next.js 16 compatible)
      const sessionId = params?.id;
      console.log('🔍 [DEBUG] API load route - Session ID extracted:', sessionId);

      if (!sessionId) {
        console.error('🔍 [DEBUG] API load route - Session ID is empty or undefined');
        return createErrorResponse('Session ID is required', 400);
      }

      console.log('🔍 [DEBUG] API load route - Processing session ID:', sessionId);
  
      // Get session details including all content columns
      console.log('🔍 [DEBUG] API load route - Fetching session data...');
      const { data: session, error: sessionError } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();
  
      console.log('🔍 [DEBUG] API load route - Session query result:', {
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
        console.error('🔍 [DEBUG] API load route - Session not found or error:', { sessionError, sessionId });
        return createErrorResponse('Session not found or access denied', 404);
      }

    // Get session analyses with related data
    console.log('🔍 [DEBUG] API load route - Fetching session analyses...');
    const { data: sessionAnalyses, error: analysesError } = await supabase
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    console.log('🔍 [DEBUG] API load route - Session analyses result:', {
      analysesError,
      count: sessionAnalyses?.length || 0
    });

    // Get word analyses directly for this session (document_id = session_id)
    console.log('🔍 [DEBUG] API load route - Fetching word analyses...');
    const { data: wordAnalyses, error: wordAnalysesError } = await supabase
      .from('word_analyses')
      .select('*')
      .eq('document_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    console.log('🔍 [DEBUG] API load route - Word analyses result:', {
      wordAnalysesError,
      count: wordAnalyses?.length || 0
    });

    // Fetch related analysis data separately for session_analyses
    console.log('🔍 [DEBUG] API load route - Fetching related analysis data...');
    let sessionAnalysesWithDetails = [];
    try {
      sessionAnalysesWithDetails = await Promise.all(
        (sessionAnalyses || []).map(async (analysis) => {
          console.log('🔍 [DEBUG] API load route - Processing analysis:', {
            id: analysis.id,
            type: analysis.analysis_type,
            analysisId: analysis.analysis_id
          });
          
          let relatedData = {};
          
          try {
            if (analysis.analysis_type === 'word') {
              const { data: wordData } = await supabase
                .from('word_analyses')
                .select('*')
                .eq('id', analysis.analysis_id)
                .single();
              relatedData = { word_analysis: wordData };
            } else if (analysis.analysis_type === 'sentence') {
              const { data: sentenceData } = await supabase
                .from('sentence_analyses')
                .select('*')
                .eq('id', analysis.analysis_id)
                .single();
              relatedData = { sentence_analysis: sentenceData };
            } else if (analysis.analysis_type === 'paragraph') {
              const { data: paragraphData } = await supabase
                .from('paragraph_analyses')
                .select('*')
                .eq('id', analysis.analysis_id)
                .single();
              relatedData = { paragraph_analysis: paragraphData };
            }
          } catch (relatedError) {
            console.error('🔍 [DEBUG] API load route - Error fetching related data:', {
              analysisId: analysis.id,
              analysisType: analysis.analysis_type,
              relatedError
            });
          }
          
          return { ...analysis, ...relatedData };
        })
      );
    } catch (promiseAllError) {
      console.error('🔍 [DEBUG] API load route - Promise.all error:', promiseAllError);
      return createErrorResponse('Failed to fetch related analysis data', 500);
    }

    // Convert word analyses to session analysis format
    const wordAnalysesAsSessionAnalyses = (wordAnalyses || []).map((wordAnalysis, index) => ({
      id: `word_${wordAnalysis.id}`, // Temporary ID for frontend
      analysis_id: wordAnalysis.id,
      analysis_type: 'word' as const,
      session_id: sessionId,
      user_id: wordAnalysis.user_id,
      position: 1000 + index, // Position after regular session analyses
      analysis_title: `Word: ${wordAnalysis.word}`,
      analysis_summary: `Analysis of word "${wordAnalysis.word}"`,
      word_analysis: wordAnalysis
    }));

    // Combine both types of analyses
    const allAnalyses = [
      ...sessionAnalysesWithDetails,
      ...wordAnalysesAsSessionAnalyses
    ].sort((a, b) => (a.position || 0) - (b.position || 0));

    if (analysesError || wordAnalysesError) {
      console.error('Error fetching analyses:', { analysesError, wordAnalysesError });
      return createErrorResponse('Failed to fetch analyses', 500);
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
      analyses: allAnalyses,
      settings: settings || undefined,
      tags,
    };

    console.log('🔍 [DEBUG] API load route - Successfully processed session:', sessionId);
    return createSuccessResponse(responseData);
    
    } catch (error) {
      console.error('🔍 [DEBUG] API load route - Unexpected error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: params?.id || 'unknown'
      });
      return createErrorResponse('Internal server error', 500);
    }
  }
);