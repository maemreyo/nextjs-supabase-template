import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabularyWord } from '@/types/vocabulary';

// GET /api/vocabulary/words/[id] - Get specific vocabulary word
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const wordId = params.id;

    // Get word with related data
    const { data: word, error: fetchError } = await supabase
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
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Word not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: word
    });

  } catch (error) {
    console.error('Error in vocabulary word GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/vocabulary/words/[id] - Update vocabulary word
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const wordId = params.id;
    const updateData: Partial<VocabularyWord> = await request.json();

    // Check if user owns the word
    const { data: existingWord, error: checkError } = await supabase
      .from('vocabulary_words')
      .select('user_id')
      .eq('id', wordId)
      .single();

    if (checkError || !existingWord || existingWord.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Word not found or access denied' },
        { status: 404 }
      );
    }

    // Update word
    const { data: word, error: updateError } = await supabase
      .from('vocabulary_words')
      .update(updateData)
      .eq('id', wordId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: word
    });

  } catch (error) {
    console.error('Error in vocabulary word PATCH:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/vocabulary/words/[id] - Delete vocabulary word
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const wordId = params.id;

    // Check if user owns the word
    const { data: existingWord, error: checkError } = await supabase
      .from('vocabulary_words')
      .select('user_id')
      .eq('id', wordId)
      .single();

    if (checkError || !existingWord || existingWord.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Word not found or access denied' },
        { status: 404 }
      );
    }

    // Delete word (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('vocabulary_words')
      .delete()
      .eq('id', wordId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: { id: wordId }
    });

  } catch (error) {
    console.error('Error in vocabulary word DELETE:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/vocabulary/words/[id]/practice - Update word practice stats
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const wordId = params.id;
    const { result, time_spent_seconds } = await request.json();

    if (!result) {
      return NextResponse.json(
        { error: 'result is required' },
        { status: 400 }
      );
    }

    // Check if user owns the word
    const { data: existingWord, error: checkError } = await supabase
      .from('vocabulary_words')
      .select('user_id, mastery_level, review_count, correct_count')
      .eq('id', wordId)
      .single();

    if (checkError || !existingWord || existingWord.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Word not found or access denied' },
        { status: 404 }
      );
    }

    // Update word mastery level and practice count
    const newMasteryLevel = result === 'correct'
      ? Math.min(existingWord.mastery_level + 1, 5)
      : Math.max(existingWord.mastery_level - 1, 0);

    const newReviewCount = existingWord.review_count + 1;
    const newCorrectCount = result === 'correct'
      ? existingWord.correct_count + 1
      : existingWord.correct_count;

    const { error: updateError } = await supabase
      .from('vocabulary_words')
      .update({
        mastery_level: newMasteryLevel,
        review_count: newReviewCount,
        correct_count: newCorrectCount,
        last_reviewed_at: new Date().toISOString()
      })
      .eq('id', wordId)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: {
        updated_mastery_level: newMasteryLevel,
        review_count: newReviewCount,
        correct_count: newCorrectCount
      }
    });

  } catch (error) {
    console.error('Error in vocabulary word practice POST:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}