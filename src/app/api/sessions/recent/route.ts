import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface RecentSessionsResponse {
  success: boolean;
  data?: {
    sessions: Database['public']['Tables']['analysis_sessions']['Row'][];
    total: number;
  };
  error?: string;
}

// GET /api/sessions/recent - Get recent sessions for the authenticated user
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7'); // Default to last 7 days
    const includeArchived = searchParams.get('include_archived') === 'true';

    // Validate parameters
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateThresholdISO = dateThreshold.toISOString();

    // Build query
    let query = supabase
      .from('analysis_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('last_accessed_at', dateThresholdISO)
      .order('last_accessed_at', { ascending: false })
      .limit(limit);

    // Filter out archived sessions unless explicitly requested
    if (!includeArchived) {
      query = query.in('status', ['active']);
    }

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent sessions' },
        { status: 500 }
      );
    }

    const response: RecentSessionsResponse = {
      success: true,
      data: {
        sessions: sessions || [],
        total: count || 0,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in recent sessions GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}