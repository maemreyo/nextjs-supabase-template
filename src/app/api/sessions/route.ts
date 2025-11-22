import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  AnalysisSession, 
  AnalysisSessionInsert,
  CreateSessionRequest,
  SessionFilters,
  SessionsListResponse 
} from '@/types/sessions';

// GET /api/sessions - List sessions with filters and pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query
    let query = supabase
      .from('analysis_sessions')
      .select(`
        *,
        session_tags!inner(tag_name, tag_color, tag_description)
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (type !== 'all') {
      query = query.eq('session_type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tags.length > 0) {
      query = query.in('session_tags.tag_name', tags);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Get total count
    const { count } = await query;
    const totalSessions = count || 0;

    // Apply pagination and ordering
    const offset = (page - 1) * perPage;
    const { data: sessions, error: fetchError } = await query
      .order('last_accessed_at', { ascending: false })
      .range(offset, perPage - 1);

    if (fetchError) {
      throw fetchError;
    }

    const response: any = {
      sessions: (sessions || []).map((session: any) => ({
        ...session,
        tags: session.session_tags || []
      })),
      pagination: {
        page,
        per_page: perPage,
        total: totalSessions,
        total_pages: Math.ceil(totalSessions / perPage)
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
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

    // Parse request body
    const body: CreateSessionRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.session_type) {
      return NextResponse.json(
        { error: 'Title and session_type are required' },
        { status: 400 }
      );
    }

    // Create session data
    const sessionData: AnalysisSessionInsert = {
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      session_type: body.session_type,
      status: 'active',
      total_analyses: 0,
      word_analyses_count: 0,
      sentence_analyses_count: 0,
      paragraph_analyses_count: 0,
    };

    // Insert session
    const { data: session, error: insertError } = await supabase
      .from('analysis_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create session settings if provided
    if (body.settings) {
      const settingsData = {
        session_id: session.id,
        user_id: user.id,
        ...body.settings
      };

      const { error: settingsError } = await supabase
        .from('session_settings')
        .insert(settingsData);

      if (settingsError) {
        console.error('Error creating session settings:', settingsError);
        // Don't fail the whole operation if settings fail
      }
    }

    // Add tags if provided
    if (body.tag_ids && body.tag_ids.length > 0) {
      const tagRelations = body.tag_ids.map(tagId => ({
        session_id: session.id,
        tag_id: tagId
      }));

      const { error: tagsError } = await supabase
        .from('session_tag_relations')
        .insert(tagRelations);

      if (tagsError) {
        console.error('Error adding session tags:', tagsError);
        // Don't fail the whole operation if tags fail
      }
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error in sessions POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}