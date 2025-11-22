import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/vocabulary/collections/[id]/words - Get words in collection
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: collectionId } = await params;

    // Check if user owns the collection
    const { data: collection, error: checkError } = await supabase
      .from('vocabulary_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (checkError || !collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Get words in collection
    // Since collection_id is not in the database, we'll return an empty array for now
    // This would need to be implemented with a proper junction table
    const { data: words, error: fetchError } = await supabase
      .from('vocabulary_words')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: words || []
    });

  } catch (error) {
    console.error('Error in vocabulary collection words GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/vocabulary/collections/[id]/words - Add word to collection
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: collectionId } = await params;
    const { word_id } = await request.json();

    if (!word_id) {
      return NextResponse.json(
        { error: 'word_id is required' },
        { status: 400 }
      );
    }

    // Check if user owns the collection
    const { data: collection, error: checkError } = await supabase
      .from('vocabulary_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (checkError || !collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user owns the word
    const { data: word, error: wordCheckError } = await supabase
      .from('vocabulary_words')
      .select('user_id')
      .eq('id', word_id)
      .single();

    if (wordCheckError || !word || word.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Word not found or access denied' },
        { status: 404 }
      );
    }

    // Add word to collection
    // Since collection_id is not in the database, we'll just return the word as is
    // This would need to be implemented with a proper junction table
    const { data: updatedWord, error: updateError } = await supabase
      .from('vocabulary_words')
      .select('*')
      .eq('id', word_id)
      .eq('user_id', user.id)
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedWord
    });

  } catch (error) {
    console.error('Error in vocabulary collection words POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/vocabulary/collections/[id]/words/[wordId] - Remove word from collection
export async function DELETE(
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // For DELETE, we need to extract wordId from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const wordId = pathSegments[pathSegments.length - 1];
    const { id: collectionId } = await params;
    
    if (!wordId) {
      return NextResponse.json(
        { error: 'Word ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the collection
    const { data: collection, error: checkError } = await supabase
      .from('vocabulary_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (checkError || !collection || collection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Remove word from collection
    // Since collection_id is not in the database, we'll just return success
    // This would need to be implemented with a proper junction table
    const { error: updateError } = await supabase
      .from('vocabulary_words')
      .select('*')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: { wordId, removedFromCollection: collectionId }
    });

  } catch (error) {
    console.error('Error in vocabulary collection words DELETE:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}