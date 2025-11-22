import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabularyWord, AnalysisToVocabularyRequest } from '@/types/vocabulary';

// POST /api/vocabulary/from-analysis - Create vocabulary word from analysis
export async function POST(request: NextRequest) {
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

    const requestData: AnalysisToVocabularyRequest = await request.json();

    // Validate required fields
    if (!requestData.content || !requestData.content_type) {
      return NextResponse.json(
        { error: 'content and content_type are required' },
        { status: 400 }
      );
    }

    // Determine appropriate word based on content type
    let wordText = requestData.content || '';
    if (requestData.content_type === 'word') {
      wordText = requestData.content?.trim().split(' ')[0] || ''; // First word only
    } else if (requestData.content_type === 'phrase') {
      wordText = requestData.content?.trim() || '';
    } else if (requestData.content_type === 'sentence') {
      wordText = requestData.content?.trim() || '';
    } else if (requestData.content_type === 'paragraph') {
      wordText = requestData.content?.trim().substring(0, 200) || ''; // Limit paragraph length
    }

    // Check if content already exists for this user
    const { data: existingWord, error: checkError } = await supabase
      .from('vocabulary_words')
      .select('id')
      .eq('word', wordText.toLowerCase())
      .eq('content_type', requestData.content_type)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingWord) {
      return NextResponse.json(
        { error: 'Content already exists in your vocabulary' },
        { status: 409 }
      );
    }

    // Prepare vocabulary data
    const vocabularyData = {
      word: wordText,
      content_type: requestData.content_type,
      definition_en: requestData.definition_en || null,
      definition_vi: requestData.definition_vi || null,
      vietnamese_translation: requestData.vietnamese_translation || null,
      difficulty_level: requestData.difficulty_level || 2,
      context_notes: requestData.context_notes || null,
      personal_notes: requestData.personal_notes || null,
      source_type: 'analysis' as const,
      source_reference: `${requestData.analysis_type}-analysis-${Date.now()}`,
      user_id: user.id,
      mastery_level: 0,
      review_count: 0,
      correct_count: 0,
      status: 'active' as const,
    };

    // Insert vocabulary word
    const { data: word, error: insertError } = await supabase
      .from('vocabulary_words')
      .insert(vocabularyData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: word
    });

  } catch (error) {
    console.error('Error in vocabulary from-analysis POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET /api/vocabulary/from-analysis - Get content type suggestions
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const content = searchParams.get('content');

    if (!content) {
      return NextResponse.json(
        { error: 'content parameter is required' },
        { status: 400 }
      );
    }

    // Analyze content and suggest content type
    const trimmedContent = content.trim();
    const wordCount = trimmedContent.split(/\s+/).length;
    
    let suggestedType: 'word' | 'phrase' | 'sentence' | 'paragraph';
    let confidence = 0;

    if (wordCount === 1) {
      suggestedType = 'word';
      confidence = 0.9;
    } else if (wordCount <= 5) {
      suggestedType = 'phrase';
      confidence = 0.8;
    } else if (wordCount <= 20) {
      suggestedType = 'sentence';
      confidence = 0.85;
    } else {
      suggestedType = 'paragraph';
      confidence = 0.9;
    }

    return NextResponse.json({
      success: true,
      data: {
        content: trimmedContent,
        word_count: wordCount,
        suggested_content_type: suggestedType,
        confidence,
        alternatives: [
          { type: 'word', confidence: wordCount === 1 ? 0.9 : 0.1 },
          { type: 'phrase', confidence: wordCount <= 5 ? 0.8 : 0.2 },
          { type: 'sentence', confidence: wordCount <= 20 ? 0.85 : 0.3 },
          { type: 'paragraph', confidence: wordCount > 20 ? 0.9 : 0.1 }
        ].sort((a, b) => b.confidence - a.confidence)
      }
    });

  } catch (error) {
    console.error('Error in vocabulary from-analysis GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}