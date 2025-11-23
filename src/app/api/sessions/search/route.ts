import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface SearchSessionsRequest {
  query: string;
  filters?: {
    type?: 'word' | 'sentence' | 'paragraph' | 'mixed' | 'all';
    status?: 'active' | 'archived' | 'deleted' | 'all';
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
    minAnalyses?: number;
    maxAnalyses?: number;
  };
  sort?: {
    field?: 'title' | 'created_at' | 'updated_at' | 'last_accessed_at' | 'total_analyses';
    direction?: 'asc' | 'desc';
  };
  pagination?: {
    page?: number;
    perPage?: number;
  };
}

interface SearchSessionsResponse {
  success: boolean;
  data?: {
    sessions: Database['public']['Tables']['analysis_sessions']['Row'][];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
    facets?: {
      types: Array<{ type: string; count: number }>;
      statuses: Array<{ status: string; count: number }>;
      tags: Array<{ tag: string; count: number }>;
    };
  };
  error?: string;
}

// GET /api/sessions/search - Search sessions with advanced filters and faceting
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
    const searchQuery = searchParams.get('query') || '';
    
    if (!searchQuery.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Parse filters
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const minAnalyses = searchParams.get('min_analyses') ? parseInt(searchParams.get('min_analyses')!) : undefined;
    const maxAnalyses = searchParams.get('max_analyses') ? parseInt(searchParams.get('max_analyses')!) : undefined;

    // Parse sort
    const sortField = searchParams.get('sort_field') || 'last_accessed_at';
    const sortDirection = searchParams.get('sort_direction') || 'desc';

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')));

    // Validate parameters
    if (!['word', 'sentence', 'paragraph', 'mixed', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type filter' },
        { status: 400 }
      );
    }

    if (!['active', 'archived', 'deleted', 'all'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    if (!['title', 'created_at', 'updated_at', 'last_accessed_at', 'total_analyses'].includes(sortField)) {
      return NextResponse.json(
        { error: 'Invalid sort field' },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(sortDirection)) {
      return NextResponse.json(
        { error: 'Invalid sort direction' },
        { status: 400 }
      );
    }

    // Build main query
    let dbQuery = supabase
      .from('analysis_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply search query
    if (searchQuery.trim()) {
      dbQuery = dbQuery.or(`
        title.ilike.%${searchQuery}%,
        description.ilike.%${searchQuery}%
      `);
    }

    // Apply filters
    if (type !== 'all') {
      dbQuery = dbQuery.eq('session_type', type);
    }

    if (status !== 'all') {
      dbQuery = dbQuery.eq('status', status);
    }

    if (dateFrom) {
      dbQuery = dbQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      dbQuery = dbQuery.lte('created_at', dateTo);
    }

    if (minAnalyses !== undefined) {
      dbQuery = dbQuery.gte('total_analyses', minAnalyses);
    }

    if (maxAnalyses !== undefined) {
      dbQuery = dbQuery.lte('total_analyses', maxAnalyses);
    }

    // Apply tag filter if specified
    if (tags.length > 0) {
      // This requires a more complex query with joins
      // For now, we'll get sessions with these tags
      const { data: taggedSessions } = await supabase
        .from('session_tag_relations')
        .select('session_id')
        .in('tag_id', tags);

      if (taggedSessions && taggedSessions.length > 0) {
        const sessionIds = taggedSessions
          .map(relation => relation.session_id)
          .filter((id): id is string => id !== null);
        dbQuery = dbQuery.in('id', sessionIds);
      } else {
        // No sessions with these tags
        dbQuery = dbQuery.eq('id', 'none');
      }
    }

    // Get total count
    const { count } = await dbQuery;
    const totalSessions = count || 0;

    // Apply pagination and sorting
    const offset = (page - 1) * perPage;
    const { data: sessions, error: sessionsError } = await dbQuery
      .order(sortField as any, { ascending: sortDirection === 'asc' })
      .range(offset, offset + perPage - 1);

    if (sessionsError) {
      console.error('Error searching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to search sessions' },
        { status: 500 }
      );
    }

    // Generate facets (optional - for advanced search UI)
    let facets = undefined;
    if (searchParams.get('include_facets') === 'true') {
      // Type facets
      const { data: typeData } = await supabase
        .from('analysis_sessions')
        .select('session_type')
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%`);

      const typeCounts: Record<string, number> = {};
      typeData?.forEach(session => {
        typeCounts[session.session_type] = (typeCounts[session.session_type] || 0) + 1;
      });

      // Status facets
      const { data: statusData } = await supabase
        .from('analysis_sessions')
        .select('status')
        .eq('user_id', user.id)
        .or(`title.ilike.%${searchQuery}%, description.ilike.%${searchQuery}%`);

      const statusCounts: Record<string, number> = {};
      statusData?.forEach(session => {
        statusCounts[session.status] = (statusCounts[session.status] || 0) + 1;
      });

      facets = {
        types: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
        statuses: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        tags: [] // Would require more complex query to implement
      };
    }

    const response: SearchSessionsResponse = {
      success: true,
      data: {
        sessions: sessions || [],
        pagination: {
          page,
          perPage,
          total: totalSessions,
          totalPages: Math.ceil(totalSessions / perPage)
        },
        facets
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in sessions search GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}