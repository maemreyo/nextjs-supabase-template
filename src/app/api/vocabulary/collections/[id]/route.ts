import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabularyCollection } from '@/types/vocabulary';

// GET /api/vocabulary/collections/[id] - Get specific vocabulary collection
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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: collectionId } = await params;

    // Get collection
    const { data: collection, error: fetchError } = await supabase
      .from('vocabulary_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: collection
    });

  } catch (error) {
    console.error('Error in vocabulary collection GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/vocabulary/collections/[id] - Update vocabulary collection
export async function PATCH(
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

    const { id: collectionId } = await params;
    const updateData: Partial<VocabularyCollection> = await request.json();

    // Check if user owns the collection
    const { data: existingCollection, error: checkError } = await supabase
      .from('vocabulary_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (checkError || !existingCollection || existingCollection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Update collection
    const { data: collection, error: updateError } = await supabase
      .from('vocabulary_collections')
      .update(updateData)
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: collection
    });

  } catch (error) {
    console.error('Error in vocabulary collection PATCH:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/vocabulary/collections/[id] - Delete vocabulary collection
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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { id: collectionId } = await params;

    // Check if user owns the collection
    const { data: existingCollection, error: checkError } = await supabase
      .from('vocabulary_collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (checkError || !existingCollection || existingCollection.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Delete collection
    const { error: deleteError } = await supabase
      .from('vocabulary_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: { id: collectionId }
    });

  } catch (error) {
    console.error('Error in vocabulary collection DELETE:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}
