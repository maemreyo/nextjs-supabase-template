import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger, analysisLogger } from '@/services/logger';
import { aiService } from '@/lib/ai/ai-service';
import { buildHighlightAnalysisPrompt, validateHighlightAnalysisNew, createFallbackHighlightAnalysisNew } from '@/lib/ai/prompt-utils';

interface AnalyzeHighlightRequest {
  highlightId: string;
  provider?: string;
  model?: string;
}

interface AnalyzeHighlightResponse {
  success: boolean;
  data?: {
    highlightId: string;
    analysisType: string;
    analysisResult: any;
    status: string;
  };
  error?: string;
}

// POST /api/highlights/analyze - Analyze a highlight using AI service
export const POST = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    apiLogger.start('Analyze highlight', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Parse request body
      const body: AnalyzeHighlightRequest = await request.json();

      // Validate required fields
      if (!body.highlightId) {
        apiLogger.warn('Invalid request - missing highlightId', {
          userId: user.id,
          hasHighlightId: !!body.highlightId
        });
        
        return createErrorResponse(
          'highlightId is required',
          400
        );
      }

      // Fetch highlight details with metadata
      const { data: highlight, error: fetchError } = await supabase
        .from('highlights')
        .select(`
          *,
          highlight_metadata!inner(
            document_context,
            paragraph_index,
            sentence_index,
            selection_duration_ms,
            click_count,
            metadata
          )
        `)
        .eq('id', body.highlightId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          apiLogger.warn('Highlight not found', {
            userId: user.id,
            highlightId: body.highlightId
          });
          
          return createErrorResponse(
            'Highlight not found',
            404
          );
        }
        
        // Enhanced logging for schema errors
        if (fetchError.message && fetchError.message.includes('column') && fetchError.message.includes('does not exist')) {
          apiLogger.error('Database schema error in fetch highlight for analysis', {
            userId: user.id,
            highlightId: body.highlightId,
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
            highlightId: body.highlightId,
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
          highlightId: body.highlightId
        });
        
        return createErrorResponse(
          'Highlight is already analyzed',
          400
        );
      }

      // Check if highlight is currently being processed
      if (highlight.status === 'error') {
        apiLogger.info('Retrying analysis for previously failed highlight', {
          userId: user.id,
          highlightId: body.highlightId
        });
      }

      // Update highlight status to 'analyzed' (processing)
      const { error: updateError } = await supabase
        .from('highlights')
        .update({
          status: 'analyzed',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.highlightId)
        .eq('user_id', user.id);

      if (updateError) {
        // Enhanced logging for schema errors
        if (updateError.message && updateError.message.includes('column') && updateError.message.includes('does not exist')) {
          apiLogger.error('Database schema error in update highlight status to processing', {
            userId: user.id,
            highlightId: body.highlightId,
            errorCode: updateError.code,
            errorMessage: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            schema: 'highlights',
            operation: 'update_status_to_processing',
            attemptedStatus: 'analyzed'
          });
        } else {
          apiLogger.error('Failed to update highlight status to processing', {
            userId: user.id,
            highlightId: body.highlightId,
            error: updateError.message,
            code: updateError.code
          });
        }
        
        throw updateError;
      }

      analysisLogger.start('Starting AI analysis for highlight', {
        userId: user.id,
        highlightId: body.highlightId,
        highlightType: highlight.highlight_type,
        selectedText: highlight.selected_text
      });

      // Prepare analysis request
      const analysisRequest = {
        text: highlight.selected_text,
        content: highlight.highlight_metadata?.document_context || highlight.content,
        maxItems: 5,
        sessionId: highlight.session_id,
        metadata: {
          highlightId: body.highlightId,
          userId: user.id,
          highlightType: highlight.highlight_type
        }
      };

      // Build prompt using the utility function
      const prompt = buildHighlightAnalysisPrompt(analysisRequest);

      let analysisResult;
      let analysisType;
      let analysisId;

      try {
        // Call AI service with retry logic
        const response = await aiService.generateText({
          prompt,
          temperature: 0.3,
          maxTokens: 6000,
          metadata: {
            operation: 'highlight-analysis',
            highlightId: body.highlightId,
            highlightType: highlight.highlight_type,
            provider: body.provider,
            model: body.model
          }
        });

        // Parse and validate response
        const parsedResult = JSON.parse(response.text);
        const validatedAnalysis = validateHighlightAnalysisNew(parsedResult);
        
        analysisResult = validatedAnalysis;
        analysisType = validatedAnalysis.highlight_analysis.category;

        analysisLogger.success('AI analysis completed successfully', {
          userId: user.id,
          highlightId: body.highlightId,
          category: analysisType,
          provider: response.provider,
          model: response.model,
          tokensUsed: response.usage.totalTokens,
          cost: response.cost
        });

        // Store analysis result in appropriate table based on type
        analysisId = await storeAnalysisResult(
          supabase,
          body.highlightId,
          highlight.highlight_type,
          validatedAnalysis.highlight_analysis,
          user.id
        );

      } catch (aiError) {
        analysisLogger.error('AI analysis failed, using fallback', {
          userId: user.id,
          highlightId: body.highlightId,
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        });

        // Create fallback analysis
        const fallbackAnalysis = createFallbackHighlightAnalysisNew(analysisRequest);
        analysisResult = fallbackAnalysis;
        analysisType = fallbackAnalysis.highlight_analysis.category;

        try {
          // Store fallback result
          analysisId = await storeAnalysisResult(
            supabase,
            body.highlightId,
            highlight.highlight_type,
            fallbackAnalysis.highlight_analysis,
            user.id
          );
        } catch (fallbackError) {
          analysisLogger.error('Failed to store fallback analysis', {
            userId: user.id,
            highlightId: body.highlightId,
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
          
          // Update highlight status to error
          await supabase
            .from('highlights')
            .update({
              status: 'error',
              error_message: 'Failed to store analysis result',
              updated_at: new Date().toISOString()
            })
            .eq('id', body.highlightId)
            .eq('user_id', user.id);

          throw fallbackError;
        }
      }

      // Update highlight with analysis reference
      const { error: finalUpdateError } = await supabase
        .from('highlights')
        .update({
          analysis_id: analysisId,
          analysis_type: analysisType,
          status: 'analyzed',
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', body.highlightId)
        .eq('user_id', user.id);

      if (finalUpdateError) {
        // Enhanced logging for schema errors
        if (finalUpdateError.message && finalUpdateError.message.includes('column') && finalUpdateError.message.includes('does not exist')) {
          apiLogger.error('Database schema error in update highlight with analysis reference', {
            userId: user.id,
            highlightId: body.highlightId,
            analysisId,
            errorCode: finalUpdateError.code,
            errorMessage: finalUpdateError.message,
            details: finalUpdateError.details,
            hint: finalUpdateError.hint,
            schema: 'highlights',
            operation: 'update_with_analysis_reference'
          });
        } else {
          apiLogger.error('Failed to update highlight with analysis reference', {
            userId: user.id,
            highlightId: body.highlightId,
            analysisId,
            error: finalUpdateError.message,
            code: finalUpdateError.code
          });
        }
        
        throw finalUpdateError;
      }

      const response = {
        highlightId: body.highlightId,
        analysisType,
        analysisResult,
        status: 'analyzed'
      };

      apiLogger.success('Highlight analysis completed successfully', {
        userId: user.id,
        highlightId: body.highlightId,
        analysisType,
        analysisId
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in analyze highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // If we have a highlightId, try to update its status to error
      try {
        const body = await request.json() as AnalyzeHighlightRequest;
        if (body.highlightId) {
          await supabase
            .from('highlights')
            .update({
              status: 'error',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString()
            })
            .eq('id', body.highlightId)
            .eq('user_id', user.id);
        }
      } catch (updateError) {
        apiLogger.error('Failed to update highlight error status', {
          error: updateError instanceof Error ? updateError.message : 'Unknown error'
        });
      }

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);

// Helper function to store analysis result in appropriate table
async function storeAnalysisResult(
  supabase: any,
  highlightId: string,
  highlightType: string,
  analysisResult: any,
  userId: string
): Promise<string> {
  let analysisId: string;

  switch (highlightType) {
    case 'word':
      const { data: wordData, error: wordError } = await supabase
        .from('word_analyses')
        .insert({
          word: analysisResult.word || '',
          ipa: analysisResult.meta?.ipa || null,
          pos: analysisResult.meta?.pos || null,
          cefr: analysisResult.meta?.cefr || null,
          tone: analysisResult.meta?.register || null,
          root_meaning: analysisResult.definitions?.root_meaning || null,
          context_meaning: analysisResult.definitions?.context_meaning || null,
          vietnamese_translation: analysisResult.definitions?.vietnamese_translation || null,
          inference_clues: analysisResult.inference_strategy?.clues || null,
          inference_reasoning: analysisResult.inference_strategy?.reasoning || null,
          sentence_context: analysisResult.usage?.examples?.[0]?.sentence || null,
          example_translation: analysisResult.usage?.examples?.[0]?.translation || null,
          user_id: userId,
          highlight_id: highlightId
        })
        .select('id')
        .single();

      if (wordError) throw wordError;
      analysisId = wordData.id;
      break;

    case 'phrase':
      const { data: phraseData, error: phraseError } = await supabase
        .from('phrase_analyses')
        .insert({
          phrase: analysisResult.phrase || '',
          ipa: analysisResult.meta?.ipa || null,
          part_of_speech: analysisResult.meta?.pos || null,
          phrase_type: analysisResult.meta?.type || null,
          complexity_level: analysisResult.meta?.cefr || null,
          register_level: analysisResult.meta?.register || null,
          literal_meaning: analysisResult.definitions?.literal_meaning || null,
          contextual_meaning: analysisResult.definitions?.figurative_meaning || null,
          vietnamese_translation: analysisResult.definitions?.vietnamese_translation || null,
          stylistic_notes: analysisResult.definitions?.usage_notes || null,
          grammatical_pattern: analysisResult.grammar_and_structure?.pattern || null,
          usage_examples: analysisResult.usage?.examples?.map((ex: any) => ex.sentence) || null,
          example_translations: analysisResult.usage?.examples?.map((ex: any) => ex.translation) || null,
          cultural_notes: analysisResult.pragmatics_and_culture?.cultural_notes || null,
          register_explanation: analysisResult.pragmatics_and_culture?.register_appropriateness || null,
          common_mistakes: analysisResult.usage?.common_mistakes?.map((mistake: any) => mistake.mistake) || null,
          memory_aid: analysisResult.learning_tips?.memory_techniques?.join(', ') || null,
          usage_tips: analysisResult.learning_tips?.practice_exercises?.join(', ') || null,
          user_id: userId,
          highlight_id: highlightId
        })
        .select('id')
        .single();

      if (phraseError) throw phraseError;
      analysisId = phraseData.id;
      break;

    case 'sentence':
      const { data: sentenceData, error: sentenceError } = await supabase
        .from('sentence_analyses')
        .insert({
          sentence: analysisResult.sentence || '',
          complexity_level: analysisResult.meta?.complexity || null,
          sentence_type: analysisResult.meta?.sentence_type || null,
          main_idea: analysisResult.meaning?.main_idea || null,
          subtext: analysisResult.meaning?.subtext || null,
          sentiment: analysisResult.meaning?.sentiment || null,
          subject: analysisResult.structure?.subject || null,
          main_verb: analysisResult.structure?.predicate || null,
          object: analysisResult.structure?.object || null,
          clauses: analysisResult.structure?.clauses || null,
          function: analysisResult.contextual_role?.function || null,
          relation_to_previous: analysisResult.contextual_role?.relation_to_previous || null,
          literal_translation: analysisResult.translation?.literal || null,
          natural_translation: analysisResult.translation?.natural || null,
          paragraph_context: analysisResult.usage?.examples?.[0]?.context || null,
          user_id: userId,
          highlight_id: highlightId
        })
        .select('id')
        .single();

      if (sentenceError) throw sentenceError;
      analysisId = sentenceData.id;
      break;

    case 'paragraph':
      const { data: paragraphData, error: paragraphError } = await supabase
        .from('paragraph_analyses')
        .insert({
          paragraph: analysisResult.paragraph || '',
          type: analysisResult.meta?.type || null,
          tone: analysisResult.meta?.tone || null,
          target_audience: analysisResult.meta?.audience || null,
          main_topic: analysisResult.content?.main_topic || null,
          sentiment_label: analysisResult.content?.sentiment?.label || null,
          sentiment_intensity: analysisResult.content?.sentiment?.intensity || null,
          sentiment_justification: analysisResult.content?.sentiment?.justification || null,
          keywords: analysisResult.content?.keywords || null,
          logic_score: analysisResult.structure?.cohesion?.logic_score || null,
          flow_score: analysisResult.structure?.cohesion?.flow_score || null,
          transition_words: analysisResult.structure?.transitions?.[0]?.words || null,
          gap_analysis: analysisResult.structure?.cohesion?.gap_analysis || null,
          vocabulary_level: analysisResult.style_analysis?.vocabulary?.level || null,
          sentence_variety: analysisResult.style_analysis?.sentence_structure?.variety || null,
          better_version: analysisResult.evaluation?.better_version || null,
          user_id: userId,
          highlight_id: highlightId
        })
        .select('id')
        .single();

      if (paragraphError) throw paragraphError;
      analysisId = paragraphData.id;
      break;

    default:
      throw new Error(`Unsupported highlight type: ${highlightType}`);
  }

  return analysisId;
}