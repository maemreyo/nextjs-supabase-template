import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session details including content column
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Get session analyses with related data
    const { data: sessionAnalyses, error: analysesError } = await supabase
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    // Fetch related analysis data separately
    const analysesWithDetails = await Promise.all(
      (sessionAnalyses || []).map(async (analysis) => {
        let relatedData = {};
        
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
        
        return { ...analysis, ...relatedData };
      })
    );

    if (analysesError) {
      console.error('Error fetching session analyses:', analysesError);
      return NextResponse.json(
        { error: 'Failed to fetch session analyses' },
        { status: 500 }
      );
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
    const { data: tagRelations, error: tagRelationsError } = await supabase
      .from('session_tag_relations')
      .select('tag_id')
      .eq('session_id', sessionId);

    let tags: any[] = [];
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
      // Don't fail the request if tags are not found
    }

    // Update last_accessed_at
    await supabase
      .from('analysis_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', sessionId);

    const response: SessionLoadResponse = {
      success: true,
      data: {
        session,
        analyses: analysesWithDetails,
        settings: settings || undefined,
        tags,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session load GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}