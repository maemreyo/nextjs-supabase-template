import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabularyWord, VocabularyWordInsert } from '@/types/vocabulary';

// GET /api/vocabulary/words - Get vocabulary words
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collection_id');
    const difficulty = searchParams.get('difficulty');
    const masteryLevel = searchParams.get('mastery_level');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('vocabulary_words')
      .select(`
        *,
        vocabulary_word_contexts(
          id,
          context_text,
          source_text,
          position
        ),
        vocabulary_synonyms(
          id,
          synonym_text,
          confidence_score
        ),
        vocabulary_antonyms(
          id,
          antonym_text,
          confidence_score
        ),
        vocabulary_collocations(
          id,
          collocation_text,
          collocation_type,
          frequency_score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }
    if (difficulty) {
      query = query.eq('difficulty_level', parseInt(difficulty));
    }
    if (masteryLevel) {
      query = query.eq('mastery_level', parseInt(masteryLevel));
    }

    const { data: words, error: fetchError, count } = await query;

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: words || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in vocabulary words GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/vocabulary/words - Create vocabulary word
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const wordData: VocabularyWordInsert = await request.json();

    // Validate required fields
    if (!wordData.word || !wordData.definition_en) {
      return NextResponse.json(
        { error: 'word and definition_en are required' },
        { status: 400 }
      );
    }

    // Check if word already exists for this user
    const { data: existingWord, error: checkError } = await supabase
      .from('vocabulary_words')
      .select('id')
      .eq('word', wordData.word.toLowerCase())
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingWord) {
      return NextResponse.json(
        { error: 'Word already exists in your vocabulary' },
        { status: 409 }
      );
    }

    // Insert word
    const { data: word, error: insertError } = await supabase
      .from('vocabulary_words')
      .insert({
        ...wordData,
        word: wordData.word.toLowerCase(),
        user_id: user.id
      })
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
    console.error('Error in vocabulary words POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}