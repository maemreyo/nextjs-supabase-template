import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';

interface SessionsListResponse {
  sessions: any[];
  total: number;
}

// GET /api/sessions/list - Get all sessions for the authenticated user
export const GET = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    try {

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sort_by') || 'updated_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const includeEmpty = searchParams.get('include_empty') === 'true';

    // Validate sort parameters
    const validSortFields = ['created_at', 'updated_at', 'last_accessed_at', 'title', 'total_analyses'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return createErrorResponse(
        'Invalid sort field. Must be one of: ' + validSortFields.join(', '),
        400
      );
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return createErrorResponse(
        'Invalid sort order. Must be asc or desc',
        400
      );
    }

    // Build query
    let query = supabase
      .from('analysis_sessions')
      .select('*', { count: 'exact' })
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

    // Filter out empty sessions unless explicitly requested
    // Note: We're temporarily allowing empty sessions to show newly created ones
    // This can be controlled by a query parameter if needed
    if (includeEmpty) {
      // Only apply this filter if explicitly requested
      query = query.gte('total_analyses', 1);
    }
    // Otherwise, show all sessions including empty ones

    // Apply sorting and pagination
    query = query
      .order(sortBy as any, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: sessions, error: sessionsError, count } = await query;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return createErrorResponse(
        'Failed to fetch sessions',
        500
      );
    }

      const response: SessionsListResponse = {
        sessions: sessions || [],
        total: count || 0,
      };

      return createSuccessResponse(response);

    } catch (error) {
      console.error('Error in sessions list GET:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);