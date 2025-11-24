import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';

// GET /api/sessions/recent - Get recent sessions for the authenticated user
export const GET = withAuth(
  async (request, { user, supabase }) => {
    try {

      // Parse query parameters
      const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7'); // Default to last 7 days
    const includeArchived = searchParams.get('include_archived') === 'true';

      // Validate parameters
      if (limit < 1 || limit > 50) {
        return createErrorResponse('Limit must be between 1 and 50', 400);
      }

      if (days < 1 || days > 365) {
        return createErrorResponse('Days must be between 1 and 365', 400);
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
        return createErrorResponse('Failed to fetch recent sessions', 500);
      }

      return createSuccessResponse({
        sessions: sessions || [],
        total: count || 0,
      });

    } catch (error) {
      console.error('Error in recent sessions GET:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);