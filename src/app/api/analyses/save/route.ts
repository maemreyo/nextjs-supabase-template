import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import type {
  WordAnalysis,
  SentenceAnalysis,
  ParagraphAnalysis,
  PhraseAnalysis
} from '@/lib/ai/types';
import { apiLogger } from '@/services/logger';
import crypto from 'crypto';

interface SaveAnalysisRequest {
  type: 'word' | 'sentence' | 'paragraph' | 'phrase';
  text: string;
  analysisData: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | PhraseAnalysis;
  sessionId?: string;
}

interface SaveAnalysisResponse {
  success: boolean;
  data?: {
    analysisId: string;
    sessionAnalysisId?: string;
    type: string;
  };
  error?: string;
}

// Helper function to generate content hash for deduplication
function generateContentHash(type: string, text: string, context?: string, documentId?: string): string {
  const hashInput = `${type}:${text}:${context || ''}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

// Helper function to check if analysis already exists
async function checkExistingAnalysis(supabase: any, type: string, userId: string, text: string, context?: string, documentId?: string): Promise<any | null> {
  let query;
  
  switch (type) {
    case 'word':
      query = supabase
        .from('word_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('word', text)
        .eq('sentence_context', context || null)
        .single();
      break;
    case 'sentence':
      query = supabase
        .from('sentence_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('sentence', text)
        .single();
      break;
    case 'paragraph':
      query = supabase
        .from('paragraph_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('paragraph', text)
        .single();
      break;
    case 'phrase':
      query = supabase
        .from('phrase_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('phrase', text)
        .eq('sentence_context', context || null)
        .single();
      break;
    default:
      return null;
  }
  
  const { data, error } = await query;
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned

  }
  
  return data || null;
}

// Helper function to transform WordAnalysis to database format
function transformWordAnalysis(analysis: WordAnalysis, text: string, userId: string, documentId?: string): Database['public']['Tables']['word_analyses']['Insert'] {
  return {
    word: text,
    ipa: analysis.meta.ipa,
    pos: analysis.meta.pos,
    cefr: analysis.meta.cefr,
    tone: analysis.meta.tone,
    root_meaning: analysis.definitions.root_meaning,
    context_meaning: analysis.definitions.context_meaning,
    vietnamese_translation: analysis.definitions.vietnamese_translation,
    inference_clues: analysis.inference_strategy.clues,
    inference_reasoning: analysis.inference_strategy.reasoning,
    sentence_context: analysis.usage.example_sentence,
    example_translation: analysis.usage.example_translation,
    user_id: userId,
  };
}

// Helper function to transform SentenceAnalysis to database format
function transformSentenceAnalysis(analysis: SentenceAnalysis, text: string, userId: string, documentId?: string): Database['public']['Tables']['sentence_analyses']['Insert'] {
  return {
    sentence: text,
    complexity_level: analysis.meta.complexity_level,
    sentence_type: analysis.meta.sentence_type,
    main_idea: analysis.semantics.main_idea,
    subtext: analysis.semantics.subtext,
    sentiment: analysis.semantics.sentiment,
    subject: analysis.grammar_breakdown.subject,
    main_verb: analysis.grammar_breakdown.main_verb,
    object: analysis.grammar_breakdown.object,
    clauses: analysis.grammar_breakdown.clauses,
    function: analysis.contextual_role.function,
    relation_to_previous: analysis.contextual_role.relation_to_previous,
    literal_translation: analysis.translation.literal,
    natural_translation: analysis.translation.natural,
    paragraph_context: null, // Will be set if available
    user_id: userId,
  };
}

// Helper function to transform ParagraphAnalysis to database format
function transformParagraphAnalysis(analysis: ParagraphAnalysis, text: string, userId: string, documentId?: string): Database['public']['Tables']['paragraph_analyses']['Insert'] {
  return {
    paragraph: text,
    type: analysis.meta.type,
    tone: analysis.meta.tone,
    target_audience: analysis.meta.target_audience,
    main_topic: analysis.content_analysis.main_topic,
    sentiment_label: analysis.content_analysis.sentiment.label,
    sentiment_intensity: analysis.content_analysis.sentiment.intensity,
    sentiment_justification: analysis.content_analysis.sentiment.justification,
    keywords: analysis.content_analysis.keywords,
    logic_score: analysis.coherence_and_cohesion.logic_score,
    flow_score: analysis.coherence_and_cohesion.flow_score,
    transition_words: analysis.coherence_and_cohesion.transition_words,
    gap_analysis: analysis.coherence_and_cohesion.gap_analysis,
    vocabulary_level: analysis.stylistic_evaluation.vocabulary_level,
    sentence_variety: analysis.stylistic_evaluation.sentence_variety,
    better_version: analysis.constructive_feedback.better_version,
    user_id: userId,
  };
}

// Helper function to transform PhraseAnalysis to database format
function transformPhraseAnalysis(analysis: PhraseAnalysis, text: string, userId: string, documentId?: string): Database['public']['Tables']['phrase_analyses']['Insert'] {
  return {
    phrase: text,
    part_of_speech: analysis.meta.pos,
    phrase_type: analysis.meta.type,
    complexity_level: analysis.meta.cefr === 'A1' || analysis.meta.cefr === 'A2' ? 'Basic' :
                    analysis.meta.cefr === 'B1' || analysis.meta.cefr === 'B2' ? 'Intermediate' : 'Advanced',
    register_level: analysis.meta.register === 'formal' ? 'formal' :
                    analysis.meta.register === 'informal' ? 'informal' : 'neutral',
    literal_meaning: analysis.definitions.literal_meaning,
    contextual_meaning: analysis.definitions.figurative_meaning,
    vietnamese_translation: analysis.definitions.vietnamese_translation,
    stylistic_notes: analysis.definitions.usage_notes,
    sentence_context: null, // Will be set if available
    paragraph_context: null, // Will be set if available
    grammatical_pattern: analysis.grammar_and_structure.pattern,
    variations: analysis.grammar_and_structure.variations.map(v => v.phrase),
    synonyms: [], // Will be populated if available
    antonyms: [], // Will be populated if available
    usage_examples: analysis.usage.example_sentences.map(ex => ex.sentence),
    example_translations: analysis.usage.example_sentences.map(ex => ex.translation),
    cultural_notes: analysis.pragmatics_and_culture.cultural_notes,
    register_explanation: analysis.pragmatics_and_culture.register_appropriateness,
    common_mistakes: analysis.pragmatics_and_culture.common_mistakes.map(m => m.mistake),
    memory_aid: analysis.learning_aids.memory_tips,
    usage_tips: analysis.learning_aids.practice_suggestions.map(p => p.exercise),
    frequency_level: null, // Will be determined based on usage
    natural_translation: analysis.definitions.vietnamese_translation,
    structure_breakdown: {
      components: analysis.components.words,
      pattern: analysis.grammar_and_structure.pattern,
      variations: analysis.grammar_and_structure.variations
    },
    user_id: userId,
  };
}

// Helper function to create session analysis entry
function createSessionAnalysisEntry(
  sessionId: string,
  analysisId: string,
  analysisType: 'word' | 'sentence' | 'paragraph' | 'phrase',
  analysisData: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | PhraseAnalysis,
  text: string,
  userId: string
): Database['public']['Tables']['session_analyses']['Insert'] {
  // Generate title and summary based on analysis type
  let title = '';
  let summary = '';
  
  if (analysisType === 'word') {
    const wordAnalysis = analysisData as WordAnalysis;
    title = `Word: ${wordAnalysis.meta.word}`;
    summary = wordAnalysis.definitions.context_meaning;
  } else if (analysisType === 'sentence') {
    const sentenceAnalysis = analysisData as SentenceAnalysis;
    title = `Sentence: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
    summary = sentenceAnalysis.semantics.main_idea;
  } else if (analysisType === 'paragraph') {
    const paragraphAnalysis = analysisData as ParagraphAnalysis;
    title = `Paragraph: ${paragraphAnalysis.content_analysis.main_topic}`;
    summary = paragraphAnalysis.content_analysis.main_topic;
  } else if (analysisType === 'phrase') {
    const phraseAnalysis = analysisData as PhraseAnalysis;
    title = `Phrase: ${phraseAnalysis.meta.phrase}`;
    summary = phraseAnalysis.definitions.figurative_meaning || phraseAnalysis.definitions.literal_meaning;
  }
  
  return {
    session_id: sessionId,
    analysis_id: analysisId,
    analysis_type: analysisType,
    analysis_title: title,
    analysis_summary: summary,
    analysis_data: analysisData as any, // Cast to any to satisfy Json type
    user_id: userId,
  };
}

// POST /api/analyses/save - Save analysis result to database
export const POST = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    apiLogger.start('Save analysis', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    try {

    // Parse request body
    const body: SaveAnalysisRequest = await request.json();

      // Validate required fields
      if (!body.type || !body.text || !body.analysisData) {
        apiLogger.warn('Invalid request - missing required fields', {
          userId: user.id,
          hasType: !!body.type,
          hasText: !!body.text,
          hasAnalysisData: !!body.analysisData
        });
        
        return createErrorResponse(
          'Type, text, and analysisData are required',
          400
        );
      }

      // Validate analysis type
      if (!['word', 'sentence', 'paragraph', 'phrase'].includes(body.type)) {
        apiLogger.warn('Invalid analysis type', {
          userId: user.id,
          type: body.type
        });
        
        return createErrorResponse(
          'Type must be word, sentence, paragraph, or phrase',
          400
        );
      }

    // Generate content hash for logging
    const contentHash = generateContentHash(
      body.type,
      body.text,
      body.type === 'word' || body.type === 'phrase' ? (body.analysisData as any).usage?.example_sentence : undefined,
      body.documentId
    );



    // Check if analysis already exists
    const existingAnalysis = await checkExistingAnalysis(
      supabase,
      body.type,
      user.id,
      body.text,
      body.type === 'word' || body.type === 'phrase' ? (body.analysisData as any).usage?.example_sentence : undefined,
      body.documentId
    );

    if (existingAnalysis) {
      apiLogger.info('Analysis already exists, returning existing record', {
        userId: user.id,
        analysisId: existingAnalysis.id,
        type: body.type
      });
      
      // Link to session if sessionId is provided
      if (body.sessionId) {
        const sessionAnalysisData = createSessionAnalysisEntry(
          body.sessionId,
          existingAnalysis.id,
          body.type,
          body.analysisData,
          body.text,
          user.id
        );
        
        // Use upsert for session analysis to prevent duplicates
        const { error: sessionError } = await supabase
          .from('session_analyses')
          .upsert(sessionAnalysisData, {
            onConflict: 'session_id,analysis_id'
          })
          .select();
        
        if (sessionError) {
          apiLogger.error('Failed to link analysis to session', {
            userId: user.id,
            analysisId: existingAnalysis.id,
            sessionId: body.sessionId,
            error: sessionError.message
          });
          
          // Don't fail the operation, just log the error
        } else {
          apiLogger.success('Analysis linked to session successfully', {
            userId: user.id,
            analysisId: existingAnalysis.id,
            sessionId: body.sessionId
          });
        }
      }

      return createSuccessResponse({
        analysisId: existingAnalysis.id,
        type: body.type,
        isDuplicate: true,
        message: 'Analysis already exists, returning existing record'
      });
    }



    let analysisId: string = '';
    let analysisData: any;

    // Save analysis to appropriate table based on type using upsert
    if (body.type === 'word') {
      const wordAnalysisData = transformWordAnalysis(
        body.analysisData as WordAnalysis,
        body.text,
        user.id,
        body.documentId
      );
      
      // Use upsert to handle conflicts properly
      const { data, error } = await supabase
        .from('word_analyses')
        .upsert(wordAnalysisData, {
          onConflict: 'user_id,word,sentence_context,document_id'
        })
        .select()
        .single();
      
      if (error) {
        apiLogger.error('Failed to save word analysis', {
          userId: user.id,
          word: body.text,
          error: error.message
        });
        
        throw error;
      }
      
      analysisId = data.id;
      // Get the full analysis data
      const { data: fullData, error: fetchError } = await supabase
        .from('word_analyses')
        .select('*')
        .eq('id', data)
        .single();
      
      if (fetchError) {
        apiLogger.error('Failed to fetch full word analysis data', {
          userId: user.id,
          word: body.text,
          error: fetchError.message
        });
      } else {
        analysisData = fullData;
      }
      
      // Save related data (synonyms, antonyms, collocations)
      const wordAnalysis = body.analysisData as WordAnalysis;
      
      // Save synonyms
      if (wordAnalysis.relations.synonyms && wordAnalysis.relations.synonyms.length > 0) {
        const synonymData = wordAnalysis.relations.synonyms.map(synonym => ({
          word_analysis_id: analysisId,
          synonym_word: synonym.word,
          ipa: synonym.ipa,
          meaning_en: synonym.meaning_en,
          meaning_vi: synonym.meaning_vi,
        }));
        
        const { error: synonymError } = await supabase
          .from('word_synonyms')
          .insert(synonymData);
        
        if (synonymError) {

          // Don't fail the whole operation if synonyms fail
        }
      }
      
      // Save antonyms
      if (wordAnalysis.relations.antonyms && wordAnalysis.relations.antonyms.length > 0) {
        const antonymData = wordAnalysis.relations.antonyms.map(antonym => ({
          word_analysis_id: analysisId,
          antonym_word: antonym.word,
          ipa: antonym.ipa,
          meaning_en: antonym.meaning_en,
          meaning_vi: antonym.meaning_vi,
        }));
        
        const { error: antonymError } = await supabase
          .from('word_antonyms')
          .insert(antonymData);
        
        if (antonymError) {

          // Don't fail the whole operation if antonyms fail
        }
      }
      
      // Save collocations
      if (wordAnalysis.usage.collocations && wordAnalysis.usage.collocations.length > 0) {
        const collocationData = wordAnalysis.usage.collocations.map(collocation => ({
          word_analysis_id: analysisId,
          phrase: collocation.phrase,
          meaning: collocation.meaning,
          usage_example: collocation.usage_example,
          frequency_level: collocation.frequency_level,
        }));
        
        const { error: collocationError } = await supabase
          .from('word_collocations')
          .insert(collocationData);
        
        if (collocationError) {

          // Don't fail the whole operation if collocations fail
        }
      }
      
    } else if (body.type === 'sentence') {
      const sentenceAnalysisData = transformSentenceAnalysis(
        body.analysisData as SentenceAnalysis,
        body.text,
        user.id,
        body.documentId
      );
      
      const { data, error } = await supabase
        .from('sentence_analyses')
        .upsert(sentenceAnalysisData, {
          onConflict: 'user_id,sentence,document_id'
        })
        .select()
        .single();
      
      if (error) {
        apiLogger.error('Failed to save sentence analysis', {
          userId: user.id,
          sentence: body.text.substring(0, 50) + '...',
          error: error.message
        });
        
        throw error;
      }
      
      analysisId = data.id;
      analysisData = data;
      
      // Save related data (key components, rewrite suggestions)
      const sentenceAnalysis = body.analysisData as SentenceAnalysis;
      
      // Save key components
      if (sentenceAnalysis.key_components && sentenceAnalysis.key_components.length > 0) {
        const keyComponentsData = sentenceAnalysis.key_components.map((component, index) => ({
          sentence_analysis_id: analysisId,
          phrase: component.phrase,
          type: component.type,
          meaning: component.meaning,
          significance: component.significance,
        }));
        
        const { error: keyComponentsError } = await supabase
          .from('sentence_key_components')
          .insert(keyComponentsData);
        
        if (keyComponentsError) {

          // Don't fail the whole operation if key components fail
        }
      }
      
      // Save rewrite suggestions
      if (sentenceAnalysis.rewrite_suggestions && sentenceAnalysis.rewrite_suggestions.length > 0) {
        const rewriteSuggestionsData = sentenceAnalysis.rewrite_suggestions.map(suggestion => ({
          sentence_analysis_id: analysisId,
          style: suggestion.style,
          text: suggestion.text,
          change_log: suggestion.change_log,
        }));
        
        const { error: rewriteSuggestionsError } = await supabase
          .from('sentence_rewrite_suggestions')
          .insert(rewriteSuggestionsData);
        
        if (rewriteSuggestionsError) {

          // Don't fail the whole operation if rewrite suggestions fail
        }
      }
      
    } else if (body.type === 'paragraph') {
      const paragraphAnalysisData = transformParagraphAnalysis(
        body.analysisData as ParagraphAnalysis,
        body.text,
        user.id,
        body.documentId
      );
      
      const { data, error } = await supabase
        .from('paragraph_analyses')
        .upsert(paragraphAnalysisData, {
          onConflict: 'user_id,paragraph,document_id'
        })
        .select()
        .single();
      
      if (error) {
        apiLogger.error('Failed to save paragraph analysis', {
          userId: user.id,
          paragraph: body.text.substring(0, 50) + '...',
          error: error.message
        });
        
        throw error;
      }
      
      analysisId = data.id;
      analysisData = data;
      
      // Save related data (structure breakdown, constructive feedback)
      const paragraphAnalysis = body.analysisData as ParagraphAnalysis;
      
      // Save structure breakdown
      if (paragraphAnalysis.structure_breakdown && paragraphAnalysis.structure_breakdown.length > 0) {
        const structureBreakdownData = paragraphAnalysis.structure_breakdown.map(breakdown => ({
          paragraph_analysis_id: analysisId,
          sentence_index: breakdown.sentence_index,
          snippet: breakdown.snippet,
          role: breakdown.role,
          analysis: breakdown.analysis,
        }));
        
        const { error: structureBreakdownError } = await supabase
          .from('paragraph_structure_breakdown')
          .insert(structureBreakdownData);
        
        if (structureBreakdownError) {

          // Don't fail the whole operation if structure breakdown fails
        }
      }
      
      // Save constructive feedback
      if (paragraphAnalysis.constructive_feedback && paragraphAnalysis.constructive_feedback.critiques && paragraphAnalysis.constructive_feedback.critiques.length > 0) {
        const feedbackData = paragraphAnalysis.constructive_feedback.critiques.map(critique => ({
          paragraph_analysis_id: analysisId,
          issue_type: critique.issue_type,
          description: critique.description,
          suggestion: critique.suggestion,
        }));
        
        const { error: feedbackError } = await supabase
          .from('paragraph_constructive_feedback')
          .insert(feedbackData);
        
        if (feedbackError) {

          // Don't fail the whole operation if feedback fails
        }
      }
    } else if (body.type === 'phrase') {
      const phraseAnalysisData = transformPhraseAnalysis(
        body.analysisData as PhraseAnalysis,
        body.text,
        user.id,
        body.documentId
      );
      
      // Use upsert to handle conflicts properly
      const { data, error } = await supabase
        .from('phrase_analyses')
        .upsert(phraseAnalysisData, {
          onConflict: 'user_id,phrase,sentence_context,document_id'
        })
        .select()
        .single();
      
      if (error) {
        apiLogger.error('Failed to save phrase analysis', {
          userId: user.id,
          phrase: body.text,
          error: error.message
        });
        
        throw error;
      }
      
      analysisId = data.id;
      // Get the full analysis data
      const { data: fullData, error: fetchError } = await supabase
        .from('phrase_analyses')
        .select('*')
        .eq('id', data)
        .single();
      
      if (fetchError) {
        apiLogger.error('Failed to fetch full phrase analysis data', {
          userId: user.id,
          phrase: body.text,
          error: fetchError.message
        });
      } else {
        analysisData = fullData;
      }
    }

    let sessionAnalysisId: string | undefined;
    
    // If session ID is provided, link analysis to session
    if (body.sessionId) {
      const sessionAnalysisData = createSessionAnalysisEntry(
        body.sessionId,
        analysisId,
        body.type,
        body.analysisData,
        body.text,
        user.id
      );
      
      // Use upsert for session analysis to prevent duplicates
      const { data: sessionAnalysis, error: sessionAnalysisError } = await supabase
        .from('session_analyses')
        .upsert(sessionAnalysisData, {
          onConflict: 'session_id,analysis_id'
        })
        .select();
      
      if (sessionAnalysisError) {
        apiLogger.error('Failed to create session analysis entry', {
          userId: user.id,
          analysisId,
          sessionId: body.sessionId,
          error: sessionAnalysisError.message
        });
        
        // Don't fail the whole operation if session linking fails
      } else {
        sessionAnalysisId = sessionAnalysis.id;
        apiLogger.success('Session analysis entry created successfully', {
          userId: user.id,
          analysisId,
          sessionId: body.sessionId,
          sessionAnalysisId
        });
        
        // Update session counts
        // First get current counts
        const { data: currentSession, error: fetchError } = await supabase
          .from('analysis_sessions')
          .select('word_analyses_count, sentence_analyses_count, paragraph_analyses_count, phrase_analyses_count, total_analyses')
          .eq('id', body.sessionId)
          .single();
        
        if (!fetchError && currentSession) {
          const updateData: any = {
            last_accessed_at: new Date().toISOString(),
          };
          
          if (body.type === 'word') {
            updateData.word_analyses_count = (currentSession.word_analyses_count || 0) + 1;
          } else if (body.type === 'sentence') {
            updateData.sentence_analyses_count = (currentSession.sentence_analyses_count || 0) + 1;
          } else if (body.type === 'paragraph') {
            updateData.paragraph_analyses_count = (currentSession.paragraph_analyses_count || 0) + 1;
          } else if (body.type === 'phrase') {
            updateData.phrase_analyses_count = (currentSession.phrase_analyses_count || 0) + 1;
          }
          
          updateData.total_analyses = (currentSession.total_analyses || 0) + 1;
          
          const { error: updateError } = await supabase
            .from('analysis_sessions')
            .update(updateData)
            .eq('id', body.sessionId);
          
          if (updateError) {
            apiLogger.error('Failed to update session counts', {
              userId: user.id,
              sessionId: body.sessionId,
              type: body.type,
              error: updateError.message
            });
            
            // Don't fail the whole operation if session update fails
          } else {
            apiLogger.success('Session counts updated successfully', {
              userId: user.id,
              sessionId: body.sessionId,
              type: body.type
            });
          }
        }
        
      }
    }



      const response = {
        analysisId,
        sessionAnalysisId,
        type: body.type,
        isDuplicate: false,
        message: 'New analysis created successfully'
      };

      apiLogger.success('Analysis saved successfully', {
        userId: user.id,
        analysisId,
        type: body.type,
        isDuplicate: false
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in save analysis API', {
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