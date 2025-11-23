import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface SessionsListResponse {
  success: boolean;
  data?: {
    sessions: Database['public']['Tables']['analysis_sessions']['Row'][];
    total: number;
  };
  error?: string;
}

// GET /api/sessions/list - Get all sessions for the authenticated user
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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('analysis_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    const response: SessionsListResponse = {
      success: true,
      data: {
        sessions: sessions || [],
        total: count || 0,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in sessions list GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}