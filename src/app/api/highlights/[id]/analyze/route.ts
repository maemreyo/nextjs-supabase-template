import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger, dbLogger, authLogger, analysisLogger } from '@/services/logger';
import { aiServiceServer } from '@/lib/ai/ai-service-server';
import { buildUniversalAutoDetectionPrompt, validateHighlightAnalysisNew, createFallbackHighlightAnalysisNew } from '@/lib/ai/prompt-utils';

interface AnalyzeHighlightRequest {
  provider?: string;
  model?: string;
}

interface AnalyzeHighlightResponse {
  success: boolean;
  data?: {
    analysisId: string;
    category: string;
    confidence: number;
    text: string;
    status: string;
  };
  error?: string;
}

// Helper function to determine analysis table based on detected category
function getAnalysisTable(category: string): string {
  switch (category) {
    case 'word':
      return 'word_analyses';
    case 'phrase':
      return 'phrase_analyses';
    case 'sentence':
      return 'sentence_analyses';
    case 'paragraph':
      return 'paragraph_analyses';
    case 'collocations':
      return 'word_analyses'; // Store collocations in word_analyses with additional data
    case 'idioms':
      return 'phrase_analyses'; // Store idioms in phrase_analyses with additional data
    case 'grammar':
      return 'sentence_analyses'; // Store grammar in sentence_analyses with additional data
    default:
      throw new Error(`Unsupported analysis category: ${category}`);
  }
}

// Helper function to prepare analysis data based on detected category
function prepareAnalysisData(highlight: any, analysis: any, category: string): any {
  const baseData = {
    user_id: highlight.user_id,
    highlight_id: highlight.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  switch (category) {
    case 'word':
      return {
        ...baseData,
        word: highlight.selected_text,
        ipa: analysis.meta?.ipa || '',
        pos: analysis.meta?.pos || '',
        cefr: analysis.meta?.cefr || '',
        tone: analysis.meta?.tone || '',
        root_meaning: analysis.definitions?.root_meaning || '',
        context_meaning: analysis.definitions?.context_meaning || '',
        vietnamese_translation: analysis.definitions?.vietnamese_translation || '',
        inference_clues: analysis.inference_strategy?.clues || '',
        inference_reasoning: analysis.inference_strategy?.reasoning || '',
        sentence_context: highlight.content || '',
        example_sentence: analysis.usage?.examples?.[0]?.sentence || '',
        example_translation: analysis.usage?.examples?.[0]?.translation || ''
      };

    case 'phrase':
      return {
        ...baseData,
        phrase: highlight.selected_text,
        part_of_speech: analysis.meta?.pos || '',
        phrase_type: analysis.meta?.type || '',
        complexity_level: analysis.meta?.cefr || '',
        register_level: analysis.meta?.register || '',
        literal_meaning: analysis.definitions?.literal_meaning || '',
        contextual_meaning: analysis.definitions?.figurative_meaning || '',
        vietnamese_translation: analysis.definitions?.vietnamese_translation || '',
        stylistic_notes: analysis.definitions?.usage_notes || '',
        grammatical_pattern: analysis.components?.[0]?.role || '',
        usage_examples: analysis.usage?.examples?.map((e: any) => e.sentence) || [],
        example_translations: analysis.usage?.examples?.map((e: any) => e.translation) || [],
        cultural_notes: analysis.definitions?.cultural_context || '',
        register_explanation: analysis.definitions?.usage_notes || '',
        common_mistakes: analysis.usage?.common_mistakes?.map((m: any) => m.mistake) || [],
        memory_aid: analysis.learning_tips?.memory_techniques?.[0] || '',
        usage_tips: analysis.learning_tips?.practice_exercises || []
      };

    case 'sentence':
      return {
        ...baseData,
        sentence: highlight.selected_text,
        complexity_level: analysis.meta?.complexity || '',
        sentence_type: analysis.meta?.type || '',
        main_idea: analysis.meaning?.main_idea || '',
        subtext: analysis.meaning?.subtext || '',
        sentiment: analysis.meaning?.sentiment || '',
        subject: analysis.structure?.subject || '',
        main_verb: analysis.structure?.predicate || '',
        object: analysis.structure?.object || '',
        clauses: analysis.structure?.clauses || [],
        function: analysis.meaning?.function || '',
        relation_to_previous: analysis.meaning?.relation_to_previous || '',
        literal_translation: analysis.variations?.[0]?.sentence || '',
        natural_translation: analysis.variations?.[0]?.sentence || '',
        paragraph_context: highlight.content || ''
      };

    case 'paragraph':
      return {
        ...baseData,
        paragraph: highlight.selected_text,
        type: analysis.meta?.type || '',
        tone: analysis.meta?.tone || '',
        target_audience: analysis.meta?.audience || '',
        main_topic: analysis.content?.main_topic || '',
        sentiment_label: analysis.content?.sentiment?.label || '',
        sentiment_intensity: analysis.content?.sentiment?.intensity || 5,
        sentiment_justification: analysis.content?.sentiment?.justification || '',
        keywords: analysis.content?.keywords || [],
        logic_score: analysis.style_analysis?.cohesion?.logic_score || 50,
        flow_score: analysis.style_analysis?.cohesion?.flow_score || 50,
        transition_words: analysis.style_analysis?.cohesion?.connectives || [],
        gap_analysis: analysis.style_analysis?.cohesion?.gap_analysis || '',
        vocabulary_level: analysis.style_analysis?.vocabulary?.level || '',
        sentence_variety: analysis.style_analysis?.sentence_structure?.variety || '',
        better_version: analysis.evaluation?.improvement_suggestions?.[0]?.suggestion || ''
      };

    case 'collocations':
      // Store collocations in word_analyses with additional metadata
      return {
        ...baseData,
        word: highlight.selected_text,
        ipa: analysis.meta?.ipa || '',
        pos: 'collocation',
        cefr: analysis.meta?.cefr || '',
        tone: analysis.meta?.register || '',
        root_meaning: analysis.collocations?.[0]?.meaning || '',
        context_meaning: analysis.collocations?.[0]?.usage || '',
        vietnamese_translation: analysis.collocations?.[0]?.meaning || '',
        inference_clues: 'collocation detected',
        inference_reasoning: 'Auto-detected as collocation',
        sentence_context: highlight.content || '',
        example_sentence: analysis.collocations?.[0]?.examples?.[0]?.sentence || '',
        example_translation: analysis.collocations?.[0]?.examples?.[0]?.translation || ''
      };

    case 'idioms':
      // Store idioms in phrase_analyses with additional metadata
      return {
        ...baseData,
        phrase: highlight.selected_text,
        part_of_speech: 'idiom',
        phrase_type: 'idiom',
        complexity_level: analysis.meta?.cefr || '',
        register_level: analysis.meta?.register || '',
        literal_meaning: analysis.idioms?.[0]?.literal_meaning || '',
        contextual_meaning: analysis.idioms?.[0]?.figurative_meaning || '',
        vietnamese_translation: analysis.idioms?.[0]?.usage?.examples?.[0]?.translation || '',
        stylistic_notes: analysis.idioms?.[0]?.origin?.historical_context || '',
        grammatical_pattern: 'idiom',
        usage_examples: analysis.idioms?.[0]?.usage?.examples?.map((e: any) => e.sentence) || [],
        example_translations: analysis.idioms?.[0]?.usage?.examples?.map((e: any) => e.translation) || [],
        cultural_notes: analysis.idioms?.[0]?.origin?.historical_context || '',
        register_explanation: analysis.idioms?.[0]?.usage?.register || '',
        common_mistakes: analysis.idioms?.[0]?.usage?.common_mistakes?.map((m: any) => m.mistake) || [],
        memory_aid: analysis.idioms?.[0]?.learning_tips?.memory_techniques?.[0] || '',
        usage_tips: analysis.idioms?.[0]?.learning_tips?.practice_suggestions || []
      };

    case 'grammar':
      // Store grammar in sentence_analyses with additional metadata
      return {
        ...baseData,
        sentence: highlight.selected_text,
        complexity_level: analysis.meta?.complexity_level || '',
        sentence_type: 'grammar',
        main_idea: analysis.structures?.[0]?.explanation || '',
        subtext: 'grammar analysis',
        sentiment: 'neutral',
        subject: analysis.structures?.[0]?.pattern || '',
        main_verb: '',
        object: '',
        clauses: analysis.structures?.[0]?.examples?.map((e: any) => ({ text: e.sentence, type: 'grammar' })) || [],
        function: 'grammar_analysis',
        relation_to_previous: '',
        literal_translation: analysis.structures?.[0]?.explanation || '',
        natural_translation: analysis.structures?.[0]?.explanation || '',
        paragraph_context: highlight.content || ''
      };

    default:
      throw new Error(`Unsupported analysis category: ${category}`);
  }
}

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
      dbLogger.debug('Fetching highlight for analysis', {
        userId: user.id,
        highlightId: id
      });

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
        
        dbLogger.error('Failed to fetch highlight for analysis', {
          userId: user.id,
          highlightId: id,
          error: fetchError.message
        });
        
        throw fetchError;
      }

      // Verify ownership
      if (highlight.user_id !== user.id) {
        authLogger.warn('Unauthorized access attempt', {
          userId: user.id,
          highlightUserId: highlight.user_id,
          highlightId: id
        });
        
        return createErrorResponse(
          'Unauthorized: Highlight does not belong to user',
          403
        );
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

      // Check if highlight status allows analysis
      if (highlight.status !== 'pending_analysis') {
        apiLogger.warn('Highlight status does not allow analysis', {
          userId: user.id,
          highlightId: id,
          status: highlight.status
        });
        
        return createErrorResponse(
          'Highlight status must be pending_analysis to analyze',
          400
        );
      }

      analysisLogger.info('Starting universal AI analysis', {
        userId: user.id,
        highlightId: id,
        text: highlight.selected_text,
        context: highlight.content || ''
      });

      // Perform universal AI analysis with auto-detection
      let analysisResult;
      let category: string;
      let confidence: number;
      try {
        // Build universal auto-detection prompt
        const prompt = buildUniversalAutoDetectionPrompt(
          highlight.selected_text,
          highlight.content || ''
        );

        // Generate AI response
        const aiResponse = await aiServiceServer.generateText(user.id, {
          prompt,
          temperature: 0.3,
          maxTokens: 6000,
          metadata: {
            operation: 'universal-highlight-analysis',
            text: highlight.selected_text,
            context: highlight.content
          }
        });

        // Parse and validate response
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(aiResponse.text);
        } catch (parseError) {
          throw new Error('Invalid JSON response from AI service');
        }

        // Validate response structure
        const validatedResponse = validateHighlightAnalysisNew(parsedResponse);
        analysisResult = validatedResponse.highlight_analysis;
        category = analysisResult.category;
        confidence = analysisResult.confidence;

        analysisLogger.success('Universal AI analysis completed', {
          userId: user.id,
          highlightId: id,
          category,
          confidence
        });

      } catch (aiError) {
        analysisLogger.error('Universal AI analysis failed', {
          userId: user.id,
          highlightId: id,
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        });

        // Create fallback analysis
        const fallbackRequest = {
          text: highlight.selected_text,
          context: highlight.content || ''
        };
        analysisResult = createFallbackHighlightAnalysisNew(fallbackRequest).highlight_analysis;
        category = analysisResult.category;
        confidence = analysisResult.confidence;

        analysisLogger.warn('Using fallback analysis', {
          userId: user.id,
          highlightId: id,
          category,
          confidence
        });
      }

      // Determine appropriate analysis table based on detected category
      const analysisTable = getAnalysisTable(category);

      // Prepare analysis data for insertion
      const analysisData = prepareAnalysisData(highlight, analysisResult, category);

      dbLogger.debug('Inserting analysis data', {
        userId: user.id,
        highlightId: id,
        analysisTable,
        category,
        confidence
      });

      // Insert analysis into appropriate table
      const { data: insertedAnalysis, error: insertError } = await supabase
        .from(analysisTable)
        .insert(analysisData)
        .select('id')
        .single();

      if (insertError) {
        dbLogger.error('Failed to insert analysis', {
          userId: user.id,
          highlightId: id,
          analysisTable,
          error: insertError.message
        });

        // Update highlight status to error
        await supabase
          .from('highlights')
          .update({
            status: 'error',
            error_message: `Failed to save analysis: ${insertError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.id);

        return createErrorResponse(
          `Failed to save analysis: ${insertError.message}`,
          500
        );
      }

      // Update highlight with analysis ID and status
      dbLogger.debug('Updating highlight with analysis ID', {
        userId: user.id,
        highlightId: id,
        analysisId: insertedAnalysis.id,
        category,
        confidence
      });

      const { error: updateError } = await supabase
        .from('highlights')
        .update({
          status: 'analyzed',
          analysis_id: insertedAnalysis.id,
          analysis_type: category,
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        dbLogger.error('Failed to update highlight with analysis ID', {
          userId: user.id,
          highlightId: id,
          analysisId: insertedAnalysis.id,
          error: updateError.message
        });

        // Don't fail the operation if analysis was saved but highlight update failed
        // Just log the error for monitoring
      }

      const response = {
        analysisId: insertedAnalysis.id,
        category,
        confidence,
        text: highlight.selected_text,
        status: 'analyzed'
      };

      analysisLogger.success('Universal analysis complete', {
        userId: user.id,
        highlightId: id,
        category,
        confidence,
        analysisId: insertedAnalysis.id
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