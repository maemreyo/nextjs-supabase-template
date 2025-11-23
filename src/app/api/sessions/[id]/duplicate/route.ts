import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface DuplicateSessionRequest {
  title?: string;
  description?: string;
  includeAnalyses?: boolean;
  includeSettings?: boolean;
  includeTags?: boolean;
}

interface DuplicateSessionResponse {
  success: boolean;
  data?: {
    originalSession: Database['public']['Tables']['analysis_sessions']['Row'];
    duplicatedSession: Database['public']['Tables']['analysis_sessions']['Row'];
    duplicatedAnalyses?: number;
    duplicatedSettings?: boolean;
    duplicatedTags?: number;
  };
  error?: string;
}

// POST /api/sessions/[id]/duplicate - Duplicate a session with optional content
export async function POST(
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

    // Parse request body
    const body: DuplicateSessionRequest = await request.json();

    // Get original session
    const { data: originalSession, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !originalSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Create duplicated session
    const duplicatedSessionData: Database['public']['Tables']['analysis_sessions']['Insert'] = {
      user_id: user.id,
      title: body.title || `${originalSession.title} (Copy)`,
      description: body.description || originalSession.description,
      session_type: originalSession.session_type,
      status: 'active',
      total_analyses: 0,
      word_analyses_count: 0,
      sentence_analyses_count: 0,
      paragraph_analyses_count: 0,
    };

    const { data: duplicatedSession, error: duplicateError } = await supabase
      .from('analysis_sessions')
      .insert(duplicatedSessionData)
      .select()
      .single();

    if (duplicateError || !duplicatedSession) {
      console.error('Error duplicating session:', duplicateError);
      return NextResponse.json(
        { error: 'Failed to duplicate session' },
        { status: 500 }
      );
    }

    let duplicatedAnalyses = 0;
    let duplicatedSettings = false;
    let duplicatedTags = 0;

    // Duplicate analyses if requested
    if (body.includeAnalyses) {
      // Get original session analyses
      const { data: originalAnalyses, error: analysesError } = await supabase
        .from('session_analyses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (!analysesError && originalAnalyses) {
        // Create duplicate analyses
        const duplicateAnalysesData = originalAnalyses.map(analysis => ({
          session_id: duplicatedSession.id,
          analysis_id: analysis.analysis_id,
          analysis_type: analysis.analysis_type,
          analysis_title: analysis.analysis_title,
          analysis_summary: analysis.analysis_summary,
          analysis_data: analysis.analysis_data,
          position: analysis.position,
          user_id: user.id,
        }));

        const { error: insertAnalysesError } = await supabase
          .from('session_analyses')
          .insert(duplicateAnalysesData);

        if (!insertAnalysesError) {
          duplicatedAnalyses = duplicateAnalysesData.length;

          // Update session counts
          const wordCount = duplicateAnalysesData.filter(a => a.analysis_type === 'word').length;
          const sentenceCount = duplicateAnalysesData.filter(a => a.analysis_type === 'sentence').length;
          const paragraphCount = duplicateAnalysesData.filter(a => a.analysis_type === 'paragraph').length;

          await supabase
            .from('analysis_sessions')
            .update({
              total_analyses: duplicatedAnalyses,
              word_analyses_count: wordCount,
              sentence_analyses_count: sentenceCount,
              paragraph_analyses_count: paragraphCount,
            })
            .eq('id', duplicatedSession.id);
        }
      }
    }

    // Duplicate settings if requested
    if (body.includeSettings) {
      const { data: originalSettings, error: settingsError } = await supabase
        .from('session_settings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!settingsError && originalSettings) {
        const { error: insertSettingsError } = await supabase
          .from('session_settings')
          .insert({
            session_id: duplicatedSession.id,
            user_id: user.id,
            auto_save: originalSettings.auto_save,
            show_summaries: originalSettings.show_summaries,
            compact_view: originalSettings.compact_view,
            preferred_ai_provider: originalSettings.preferred_ai_provider,
            preferred_ai_model: originalSettings.preferred_ai_model,
            analysis_depth: originalSettings.analysis_depth,
            default_export_format: originalSettings.default_export_format,
            include_metadata: originalSettings.include_metadata,
            email_notifications: originalSettings.email_notifications,
            session_reminders: originalSettings.session_reminders,
          });

        if (!insertSettingsError) {
          duplicatedSettings = true;
        }
      }
    }

    // Duplicate tags if requested
    if (body.includeTags) {
      const { data: originalTagRelations, error: tagRelationsError } = await supabase
        .from('session_tag_relations')
        .select('tag_id')
        .eq('session_id', sessionId);

      if (!tagRelationsError && originalTagRelations) {
        const duplicateTagRelationsData = originalTagRelations.map(relation => ({
          session_id: duplicatedSession.id,
          tag_id: relation.tag_id,
        }));

        const { error: insertTagRelationsError } = await supabase
          .from('session_tag_relations')
          .insert(duplicateTagRelationsData);

        if (!insertTagRelationsError) {
          duplicatedTags = duplicateTagRelationsData.length;
        }
      }
    }

    const response: DuplicateSessionResponse = {
      success: true,
      data: {
        originalSession,
        duplicatedSession,
        duplicatedAnalyses: body.includeAnalyses ? duplicatedAnalyses : undefined,
        duplicatedSettings: body.includeSettings ? duplicatedSettings : undefined,
        duplicatedTags: body.includeTags ? duplicatedTags : undefined,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session duplicate POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}