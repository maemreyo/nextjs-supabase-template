import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface DeleteAnalysisResponse {
  success: boolean;
  data?: {
    deletedId: string;
    deletedType: string;
    sessionUpdated?: boolean;
  };
  error?: string;
}

// DELETE /api/analyses/[id] - Delete analysis by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  apiLogger.start('Handling DELETE /api/analyses/[id]', {
    timestamp: new Date().toISOString()
  })
  
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

    const { id: analysisId } = await params;

    if (!analysisId) {
      apiLogger.warn('Analysis ID is required', {
        error: 'Missing analysis ID'
      })
      
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Find the analysis in all three tables to determine its type
    let analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph' | null = null;
    let analysisData: any = null;

    // Check word_analyses table
    const { data: wordAnalysis, error: wordError } = await supabase
      .from('word_analyses')
      .select('*')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (!wordError && wordAnalysis) {
      analysisType = 'word';
      analysisData = wordAnalysis;
    } else {
      // Check sentence_analyses table
      const { data: sentenceAnalysis, error: sentenceError } = await supabase
        .from('sentence_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (!sentenceError && sentenceAnalysis) {
        analysisType = 'sentence';
        analysisData = sentenceAnalysis;
      } else {
        // Check phrase_analyses table
        const { data: phraseAnalysis, error: phraseError } = await supabase
          .from('phrase_analyses')
          .select('*')
          .eq('id', analysisId)
          .eq('user_id', user.id)
          .single();

        if (!phraseError && phraseAnalysis) {
          analysisType = 'phrase';
          analysisData = phraseAnalysis;
        } else {
          // Check paragraph_analyses table
          const { data: paragraphAnalysis, error: paragraphError } = await supabase
            .from('paragraph_analyses')
            .select(`
              *,
              paragraph_structure_breakdown(*),
              paragraph_constructive_feedback(*)
            `)
            .eq('id', analysisId)
            .eq('user_id', user.id)
            .single();

          if (!paragraphError && paragraphAnalysis) {
            analysisType = 'paragraph';
            analysisData = paragraphAnalysis;
          }
        }
      }
    }

    if (!analysisType || !analysisData) {
      return NextResponse.json(
        { error: 'Analysis not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete related data based on analysis type
    if (analysisType === 'word') {
      // Delete synonyms
      const { error: synonymError } = await supabase
        .from('word_synonyms')
        .delete()
        .eq('word_analysis_id', analysisId);

      if (synonymError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete antonyms
      const { error: antonymError } = await supabase
        .from('word_antonyms')
        .delete()
        .eq('word_analysis_id', analysisId);

      if (antonymError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete collocations
      const { error: collocationError } = await supabase
        .from('word_collocations')
        .delete()
        .eq('word_analysis_id', analysisId);

      if (collocationError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete the main word analysis
      const { error: deleteError } = await supabase
        .from('word_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (deleteError) {

        throw deleteError;
      }

    } else if (analysisType === 'sentence') {
      // Delete key components
      const { error: keyComponentsError } = await supabase
        .from('sentence_key_components')
        .delete()
        .eq('sentence_analysis_id', analysisId);

      if (keyComponentsError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete rewrite suggestions
      const { error: rewriteSuggestionsError } = await supabase
        .from('sentence_rewrite_suggestions')
        .delete()
        .eq('sentence_analysis_id', analysisId);

      if (rewriteSuggestionsError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete the main sentence analysis
      const { error: deleteError } = await supabase
        .from('sentence_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (deleteError) {

        throw deleteError;
      }

    } else if (analysisType === 'phrase') {
      // Delete the main phrase analysis
      const { error: deleteError } = await supabase
        .from('phrase_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

    } else if (analysisType === 'paragraph') {
      // Delete structure breakdown
      const { error: structureBreakdownError } = await supabase
        .from('paragraph_structure_breakdown')
        .delete()
        .eq('paragraph_analysis_id', analysisId);

      if (structureBreakdownError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete constructive feedback
      const { error: feedbackError } = await supabase
        .from('paragraph_constructive_feedback')
        .delete()
        .eq('paragraph_analysis_id', analysisId);

      if (feedbackError) {

        // Don't fail the whole operation if related data deletion fails
      }

      // Delete the main paragraph analysis
      const { error: deleteError } = await supabase
        .from('paragraph_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (deleteError) {

        throw deleteError;
      }
    }

    // Delete from session_analyses table
    const { error: sessionAnalysisError } = await supabase
      .from('session_analyses')
      .delete()
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id);

    if (sessionAnalysisError) {

      // Don't fail the whole operation if session link deletion fails
    }

    // Update session counts if the analysis was linked to a session
    let sessionUpdated = false;
    const { data: sessionAnalysis } = await supabase
      .from('session_analyses')
      .select('session_id')
      .eq('analysis_id', analysisId)
      .single();

    // Note: The above query will return null since we just deleted the session_analyses record
    // We need to check if there was a session link before deletion
    if (sessionAnalysisError === null) {
      // Find sessions that might have contained this analysis
      const { data: sessions } = await supabase
        .from('analysis_sessions')
        .select('id, word_analyses_count, sentence_analyses_count, paragraph_analyses_count, total_analyses')
        .eq('user_id', user.id);

      if (sessions && sessions.length > 0) {
        // For each session, we need to check if it contained this analysis
        // This is a bit complex since we've already deleted the session_analyses record
        // For now, we'll update all sessions owned by the user to recount their analyses
        for (const session of sessions) {
          // Count current analyses for this session
          const { count: wordCount } = await supabase
            .from('session_analyses')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('analysis_type', 'word');

          const { count: sentenceCount } = await supabase
            .from('session_analyses')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('analysis_type', 'sentence');

          const { count: paragraphCount } = await supabase
            .from('session_analyses')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)
            .eq('analysis_type', 'paragraph');

          const { count: totalCount } = await supabase
            .from('session_analyses')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          const { error: updateError } = await supabase
            .from('analysis_sessions')
            .update({
              word_analyses_count: wordCount || 0,
              sentence_analyses_count: sentenceCount || 0,
              paragraph_analyses_count: paragraphCount || 0,
              total_analyses: totalCount || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (updateError) {

            // Don't fail the whole operation if session update fails
          } else {
            sessionUpdated = true;
          }
        }
      }
    }



    const response: DeleteAnalysisResponse = {
      success: true,
      data: {
        deletedId: analysisId,
        deletedType: analysisType,
        sessionUpdated
      }
    };

    apiLogger.success('Analysis deleted successfully', {
      analysisId,
      analysisType,
      sessionUpdated
    })

    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Error in delete analysis API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}

// GET /api/analyses/[id] - Get analysis by ID
export async function GET(
  request: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
apiLogger.start('Handling GET /api/analyses/[id]', {
  timestamp: new Date().toISOString(),
  analysisId: (await params).id
})

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

  const { id: analysisId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const analysisTypeFromParam = searchParams.get('type') as 'word' | 'sentence' | 'paragraph' | 'phrase' | null;

  if (!analysisId) {
    apiLogger.warn('Analysis ID is required', {
      error: 'Missing analysis ID'
    })
    
    return NextResponse.json(
      { error: 'Analysis ID is required' },
      { status: 400 }
    );
  }

  // Parse analysis ID to extract type prefix if present (e.g., "word_abc123" -> type: "word", id: "abc123")
  let idPrefix = '';
  let actualId = analysisId;
  const idParts = analysisId.split('_', 2);
  
  if (idParts.length === 2 && idParts[0] && ['word', 'sentence', 'paragraph', 'phrase'].includes(idParts[0])) {
    idPrefix = idParts[0];
    actualId = idParts[1] || analysisId; // Fallback to original ID if second part is missing
  }

  // Determine which type to use: URL parameter takes priority, then ID prefix, then fallback to search all
  let targetType: 'word' | 'sentence' | 'paragraph' | 'phrase' | null = analysisTypeFromParam;
  
  if (!targetType && idPrefix) {
    targetType = idPrefix as 'word' | 'sentence' | 'paragraph' | 'phrase';
    apiLogger.info('Using analysis type from ID prefix', {
      analysisType: targetType,
      analysisId,
      actualId
    });
  }

  let analysisData: any = null;
  let analysisType: 'word' | 'sentence' | 'paragraph' | 'phrase' | null = null;

  // If we have a specific type, query only that table
  if (targetType) {
    apiLogger.info('Querying specific analysis type', {
      targetType,
      actualId
    });

    switch (targetType) {
      case 'word':
        {
          const { data: wordAnalysis, error: wordError } = await supabase
            .from('word_analyses')
            .select(`
              *,
              word_synonyms(*),
              word_antonyms(*),
              word_collocations(*)
            `)
            .eq('id', actualId)
            .eq('user_id', user.id)
            .single();

          if (!wordError && wordAnalysis) {
            analysisData = { ...wordAnalysis, analysis_type: 'word' };
            analysisType = 'word';
          }
        }
        break;

      case 'sentence':
        {
          const { data: sentenceAnalysis, error: sentenceError } = await supabase
            .from('sentence_analyses')
            .select(`
              *,
              sentence_key_components(*),
              sentence_rewrite_suggestions(*)
            `)
            .eq('id', actualId)
            .eq('user_id', user.id)
            .single();

          if (!sentenceError && sentenceAnalysis) {
            analysisData = { ...sentenceAnalysis, analysis_type: 'sentence' };
            analysisType = 'sentence';
          }
        }
        break;

      case 'phrase':
        {
          const { data: phraseAnalysis, error: phraseError } = await supabase
            .from('phrase_analyses')
            .select('*')
            .eq('id', actualId)
            .eq('user_id', user.id)
            .single();

          if (!phraseError && phraseAnalysis) {
            analysisData = { ...phraseAnalysis, analysis_type: 'phrase' };
            analysisType = 'phrase';
          }
        }
        break;

      case 'paragraph':
        {
          const { data: paragraphAnalysis, error: paragraphError } = await supabase
            .from('paragraph_analyses')
            .select(`
              *,
              paragraph_structure_breakdown(*),
              paragraph_constructive_feedback(*)
            `)
            .eq('id', actualId)
            .eq('user_id', user.id)
            .single();

          if (!paragraphError && paragraphAnalysis) {
            analysisData = { ...paragraphAnalysis, analysis_type: 'paragraph' };
            analysisType = 'paragraph';
          }
        }
        break;
    }
  } else {
    // Fallback: search all tables if no type specified
    apiLogger.info('No type specified, searching all tables', {
      analysisId: actualId
    });

    // Check word_analyses table
    const { data: wordAnalysis, error: wordError } = await supabase
      .from('word_analyses')
      .select(`
        *,
        word_synonyms(*),
        word_antonyms(*),
        word_collocations(*)
      `)
      .eq('id', actualId)
      .eq('user_id', user.id)
      .single();

    if (!wordError && wordAnalysis) {
      analysisData = { ...wordAnalysis, analysis_type: 'word' };
      analysisType = 'word';
    } else {
      // Check sentence_analyses table
      const { data: sentenceAnalysis, error: sentenceError } = await supabase
        .from('sentence_analyses')
        .select(`
          *,
          sentence_key_components(*),
          sentence_rewrite_suggestions(*)
        `)
        .eq('id', actualId)
        .eq('user_id', user.id)
        .single();

      if (!sentenceError && sentenceAnalysis) {
        analysisData = { ...sentenceAnalysis, analysis_type: 'sentence' };
        analysisType = 'sentence';
      } else {
        // Check phrase_analyses table
        const { data: phraseAnalysis, error: phraseError } = await supabase
          .from('phrase_analyses')
          .select('*')
          .eq('id', actualId)
          .eq('user_id', user.id)
          .single();

        if (!phraseError && phraseAnalysis) {
          analysisData = { ...phraseAnalysis, analysis_type: 'phrase' };
          analysisType = 'phrase';
        } else {
          // Check paragraph_analyses table
          const { data: paragraphAnalysis, error: paragraphError } = await supabase
            .from('paragraph_analyses')
            .select(`
              *,
              paragraph_structure_breakdown(*),
              paragraph_constructive_feedback(*)
            `)
            .eq('id', actualId)
            .eq('user_id', user.id)
            .single();

          if (!paragraphError && paragraphAnalysis) {
            analysisData = { ...paragraphAnalysis, analysis_type: 'paragraph' };
            analysisType = 'paragraph';
          }
        }
      }
    }
  }

    if (!analysisData) {
      apiLogger.warn('Analysis not found', {
        analysisId: actualId,
        targetType,
        userId: user.id
      });
      
      return NextResponse.json(
        { error: 'Analysis not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    // Get session information if available
    const { data: sessionAnalysis } = await supabase
      .from('session_analyses')
      .select('*')
      .eq('analysis_id', actualId)
      .single();

    if (sessionAnalysis) {
      analysisData.session_analysis = sessionAnalysis;
    }

    // Create response structure as specified in task requirements
    const responseData = {
      id: analysisData.id,
      content: analysisData.content,
      analysis_type: analysisData.analysis_type || analysisType,
      highlight_id: analysisData.highlight_id || null
    };

    apiLogger.success('Analysis retrieved successfully', {
      analysisId: actualId,
      analysisType,
      targetType,
      responseData
    })

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    apiLogger.error('Error in get analysis API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}