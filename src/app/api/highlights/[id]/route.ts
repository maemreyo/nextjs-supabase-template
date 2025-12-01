import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface UpdateHighlightRequest {
  color?: string;
  status?: 'pending_analysis' | 'analyzed' | 'error';
  content?: string;
}

interface AnalyzeHighlightRequest {
  provider?: string;
  model?: string;
}

// GET /api/highlights/[id] - Get a specific highlight
export const GET = withAuth(
  async (request: NextRequest, context: { user: any; supabase: any; params?: Promise<{ id: string }> | { id: string } | undefined }) => {
    const { user, supabase, params } = context;
    apiLogger.start('Get highlight by ID', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle both Promise and resolved params
      let resolvedParams: { id: string };
      if (!params) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }
      
      if (params instanceof Promise) {
        resolvedParams = await params;
      } else {
        resolvedParams = params as { id: string };
      }
      
      const { id } = resolvedParams;

      if (!id) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }

      // Fetch highlight with related analysis data
      const { data, error } = await supabase
        .from('highlights')
        .select(`
          *,
          word_analyses:word_analyses!highlights_word_analysis_fkey(
            id,
            word,
            ipa,
            pos,
            cefr,
            tone,
            root_meaning,
            context_meaning,
            vietnamese_translation,
            inference_clues,
            inference_reasoning,
            sentence_context,
            example_translation,
            created_at
          ),
          phrase_analyses:phrase_analyses!highlights_phrase_analysis_fkey(
            id,
            phrase,
            part_of_speech,
            phrase_type,
            complexity_level,
            register_level,
            literal_meaning,
            contextual_meaning,
            vietnamese_translation,
            stylistic_notes,
            grammatical_pattern,
            usage_examples,
            example_translations,
            cultural_notes,
            register_explanation,
            common_mistakes,
            memory_aid,
            usage_tips,
            created_at
          ),
          sentence_analyses:sentence_analyses!highlights_sentence_analysis_fkey(
            id,
            sentence,
            complexity_level,
            sentence_type,
            main_idea,
            subtext,
            sentiment,
            subject,
            main_verb,
            object,
            clauses,
            function,
            relation_to_previous,
            literal_translation,
            natural_translation,
            paragraph_context,
            created_at
          ),
          paragraph_analyses:paragraph_analyses!highlights_paragraph_analysis_fkey(
            id,
            paragraph,
            type,
            tone,
            target_audience,
            main_topic,
            sentiment_label,
            sentiment_intensity,
            sentiment_justification,
            keywords,
            logic_score,
            flow_score,
            transition_words,
            gap_analysis,
            vocabulary_level,
            sentence_variety,
            better_version,
            created_at
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          apiLogger.warn('Highlight not found', {
            userId: user.id,
            highlightId: id
          });
          
          return createErrorResponse(
            'Highlight not found',
            404
          );
        }
        
        apiLogger.error('Failed to fetch highlight', {
          userId: user.id,
          highlightId: id,
          error: error.message
        });
        
        throw error;
      }

      apiLogger.success('Highlight fetched successfully', {
        userId: user.id,
        highlightId: id,
        type: data.highlight_type,
        hasAnalysis: !!data.word_analyses || !!data.phrase_analyses || !!data.sentence_analyses || !!data.paragraph_analyses
      });

      return createSuccessResponse(data);

    } catch (error) {
      apiLogger.error('Error in get highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);

// PUT /api/highlights/[id] - Update a highlight
export const PUT = withAuth(
  async (request: NextRequest, context: { user: any; supabase: any; params?: Promise<{ id: string }> | { id: string } | undefined }) => {
    const { user, supabase, params } = context;
    apiLogger.start('Update highlight', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle both Promise and resolved params
      let resolvedParams: { id: string };
      if (!params) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }
      
      if (params instanceof Promise) {
        resolvedParams = await params;
      } else {
        resolvedParams = params as { id: string };
      }
      
      const { id } = resolvedParams;
      const body: UpdateHighlightRequest = await request.json();

      if (!id) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }

      // Validate status if provided
      if (body.status && !['pending_analysis', 'analyzed', 'error'].includes(body.status)) {
        apiLogger.warn('Invalid status value', {
          userId: user.id,
          status: body.status
        });
        
        return createErrorResponse(
          'Status must be pending_analysis, analyzed, or error',
          400
        );
      }

      // Check if highlight exists and belongs to user
      const { data: existingHighlight, error: fetchError } = await supabase
        .from('highlights')
        .select('id, user_id, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          apiLogger.warn('Highlight not found', {
            userId: user.id,
            highlightId: id
          });
          
          return createErrorResponse(
            'Highlight not found',
            404
          );
        }
        
        apiLogger.error('Failed to fetch highlight for update', {
          userId: user.id,
          highlightId: id,
          error: fetchError.message
        });
        
        throw fetchError;
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (body.color !== undefined) {
        updateData.color = body.color;
      }
      if (body.status !== undefined) {
        updateData.status = body.status;
      }
      if (body.content !== undefined) {
        updateData.content = body.content;
      }

      // Update highlight
      const { data, error } = await supabase
        .from('highlights')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        apiLogger.error('Failed to update highlight', {
          userId: user.id,
          highlightId: id,
          error: error.message
        });
        
        throw error;
      }

      const response = {
        highlightId: data.id,
        type: data.highlight_type,
        text: data.selected_text,
        status: data.status,
        color: data.color,
        updatedFields: Object.keys(updateData).filter(key => key !== 'updated_at')
      };

      apiLogger.success('Highlight updated successfully', {
        userId: user.id,
        highlightId: id,
        updatedFields: response.updatedFields
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in update highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);

// DELETE /api/highlights/[id] - Delete a highlight
export const DELETE = withAuth(
  async (request: NextRequest, context: { user: any; supabase: any; params?: Promise<{ id: string }> | { id: string } | undefined }) => {
    const { user, supabase, params } = context;
    apiLogger.start('Delete highlight', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle both Promise and resolved params
      let resolvedParams: { id: string };
      if (!params) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }
      
      if (params instanceof Promise) {
        resolvedParams = await params;
      } else {
        resolvedParams = params as { id: string };
      }
      
      const { id } = resolvedParams;

      if (!id) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }

      // Check if highlight exists and belongs to user
      const { data: existingHighlight, error: fetchError } = await supabase
        .from('highlights')
        .select('id, user_id, session_id, highlight_type, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          apiLogger.warn('Highlight not found', {
            userId: user.id,
            highlightId: id
          });
          
          return createErrorResponse(
            'Highlight not found',
            404
          );
        }
        
        apiLogger.error('Failed to fetch highlight for deletion', {
          userId: user.id,
          highlightId: id,
          error: fetchError.message
        });
        
        throw fetchError;
      }

      // Delete highlight (cascade will handle related records)
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        apiLogger.error('Failed to delete highlight', {
          userId: user.id,
          highlightId: id,
          error: error.message
        });
        
        throw error;
      }

      // Update session highlight count
      const { error: sessionUpdateError } = await supabase
        .from('analysis_sessions')
        .update({
          highlights_count: supabase.raw('GREATEST(highlights_count - 1, 0)'),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', existingHighlight.session_id);

      if (sessionUpdateError) {
        apiLogger.warn('Failed to update session highlight count after deletion', {
          userId: user.id,
          sessionId: existingHighlight.session_id,
          error: sessionUpdateError.message
        });
        // Don't fail the operation, just log the error
      }

      const response = {
        highlightId: id,
        deleted: true,
        type: existingHighlight.highlight_type,
        sessionId: existingHighlight.session_id
      };

      apiLogger.success('Highlight deleted successfully', {
        userId: user.id,
        highlightId: id,
        type: existingHighlight.type,
        sessionId: existingHighlight.session_id
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in delete highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);

// POST /api/highlights/[id]/analyze - Analyze a highlight
export const POST = withAuth(
  async (request: NextRequest, context: { user: any; supabase: any; params?: Promise<{ id: string }> | { id: string } | undefined }) => {
    const { user, supabase, params } = context;
    apiLogger.start('Analyze highlight', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Handle both Promise and resolved params
      let resolvedParams: { id: string };
      if (!params) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }
      
      if (params instanceof Promise) {
        resolvedParams = await params;
      } else {
        resolvedParams = params as { id: string };
      }
      
      const { id } = resolvedParams;
      const body: AnalyzeHighlightRequest = await request.json();

      if (!id) {
        apiLogger.warn('Missing highlight ID', {
          userId: user.id
        });
        
        return createErrorResponse(
          'Highlight ID is required',
          400
        );
      }

      // Fetch highlight details
      const { data: highlight, error: fetchError } = await supabase
        .from('highlights')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          apiLogger.warn('Highlight not found', {
            userId: user.id,
            highlightId: id
          });
          
          return createErrorResponse(
            'Highlight not found',
            404
          );
        }
        
        // Enhanced logging for schema errors
        if (fetchError.message && fetchError.message.includes('column') && fetchError.message.includes('does not exist')) {
          apiLogger.error('Database schema error in fetch highlight', {
            userId: user.id,
            highlightId: id,
            errorCode: fetchError.code,
            errorMessage: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            schema: 'highlights',
            operation: 'fetch_for_analysis'
          });
        } else {
          apiLogger.error('Failed to fetch highlight for analysis', {
            userId: user.id,
            highlightId: id,
            error: fetchError.message,
            code: fetchError.code
          });
        }
        
        throw fetchError;
      }

      // Check if highlight is already analyzed
      if (highlight.status === 'analyzed') {
        apiLogger.warn('Highlight already analyzed', {
          userId: user.id,
          highlightId: id
        });
        
        return createErrorResponse(
          'Highlight is already analyzed',
          400
        );
      }

      // Update highlight status to 'analyzed' (this will be updated by the actual analysis process)
      const { error: updateError } = await supabase
        .from('highlights')
        .update({
          status: 'analyzed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        // Enhanced logging for schema errors
        if (updateError.message && updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          apiLogger.error('Database schema error in update highlight status', {
            userId: user.id,
            highlightId: id,
            errorCode: updateError.code,
            errorMessage: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            schema: 'highlights',
            operation: 'update_status',
            attemptedStatus: 'analyzed'
          });
        } else {
          apiLogger.error('Failed to update highlight status', {
            userId: user.id,
            highlightId: id,
            error: updateError.message,
            code: updateError.code
          });
        }
        
        throw updateError;
      }

      // Here you would typically trigger the actual analysis process
      // For now, we'll just return a success response indicating the analysis was initiated
      // In a real implementation, you might:
      // 1. Call an AI service to analyze the text
      // 2. Store the analysis results in the appropriate analysis table
      // 3. Update the highlight with the analysis ID

      const response = {
        highlightId: id,
        type: highlight.highlight_type,
        text: highlight.selected_text,
        status: 'analyzed',
        message: 'Analysis initiated successfully',
        provider: body.provider || 'default',
        model: body.model || 'default'
      };

      apiLogger.success('Highlight analysis initiated', {
        userId: user.id,
        highlightId: id,
        type: highlight.highlight_type,
        provider: body.provider || 'default',
        model: body.model || 'default'
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in analyze highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);