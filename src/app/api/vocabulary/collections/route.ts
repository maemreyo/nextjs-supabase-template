import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { VocabularyCollection, VocabularyCollectionInsert } from '@/types/vocabulary';
import { apiLogger } from '@/services/logger';

// GET /api/vocabulary/collections - Get vocabulary collections
export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/vocabulary/collections', {
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
      apiLogger.warn('Authentication failed', {
        error: error?.message || 'User not found'
      });
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const collectionType = searchParams.get('collection_type');
    const isPublic = searchParams.get('is_public');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('vocabulary_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (collectionType) {
      query = query.eq('collection_type', collectionType);
    }
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true');
    }

    const { data: collections, error: fetchError, count } = await query;

    if (fetchError) {
      apiLogger.error('Failed to fetch vocabulary collections', {
        userId: user.id,
        error: fetchError.message
      });
      throw fetchError;
    }

    apiLogger.success('Vocabulary collections retrieved successfully', {
      userId: user.id,
      count: collections?.length || 0,
      total: count || 0
    });

    return NextResponse.json({
      success: true,
      data: collections || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    apiLogger.error('Error in vocabulary collections GET API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}

// POST /api/vocabulary/collections - Create vocabulary collection
export async function POST(request: NextRequest) {
  apiLogger.start('Handling POST /api/vocabulary/collections', {
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
      apiLogger.warn('Authentication failed', {
        error: error?.message || 'User not found'
      });
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const collectionData: VocabularyCollectionInsert = await request.json();

    apiLogger.info('Creating vocabulary collection', {
      userId: user.id,
      collectionName: collectionData.name,
      collectionType: collectionData.collection_type
    });

    // Validate required fields
    if (!collectionData.name || !collectionData.collection_type) {
      apiLogger.warn('Invalid request - missing required fields', {
        userId: user.id,
        hasName: !!collectionData.name,
        hasCollectionType: !!collectionData.collection_type
      });
      
      return NextResponse.json(
        { error: 'name and collection_type are required' },
        { status: 400 }
      );
    }

    // Insert collection
    const { data: collection, error: insertError } = await supabase
      .from('vocabulary_collections')
      .insert({
        ...collectionData,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      apiLogger.error('Failed to create vocabulary collection', {
        userId: user.id,
        collectionName: collectionData.name,
        error: insertError.message
      });
      throw insertError;
    }

    apiLogger.success('Vocabulary collection created successfully', {
      userId: user.id,
      collectionId: collection.id,
      collectionName: collectionData.name
    });

    return NextResponse.json({
      success: true,
      data: collection
    });

  } catch (error) {
    apiLogger.error('Error in vocabulary collections POST API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}