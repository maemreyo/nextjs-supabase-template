import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';

interface SessionAnalyticsResponse {
  success: boolean;
  data?: {
    session: Database['public']['Tables']['analysis_sessions']['Row'];
    statistics: {
      totalAnalyses: number;
      wordAnalyses: number;
      sentenceAnalyses: number;
      paragraphAnalyses: number;
      averageAnalysesPerDay: number;
      mostActiveDay?: string;
      sessionDuration: number; // in hours
      completionRate: number; // percentage
    };
    breakdown: {
      byType: {
        word: number;
        sentence: number;
        paragraph: number;
      };
      byDay: Array<{
        date: string;
        count: number;
      }>;
    };
    recentActivity: Array<{
      id: string;
      type: 'word' | 'sentence' | 'paragraph';
      title: string;
      created_at: string;
    }>;
  };
  error?: string;
}

// GET /api/sessions/[id]/analytics - Get analytics for a specific session
export const GET = withAuth(
  async (request, { user, supabase }, { params }) => {
    const { id: sessionId } = await params;

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return createErrorResponse('Session not found or access denied', 404);
    }

    // Get all analyses for this session
    const { data: sessionAnalyses, error: analysesError } = await supabase
      .from('session_analyses')
      .select(`
        *,
        word_analyses!inner(created_at),
        sentence_analyses!inner(created_at),
        paragraph_analyses!inner(created_at)
      `)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (analysesError) {
      console.error('Error fetching session analyses:', analysesError);
      return createErrorResponse('Failed to fetch session analyses', 500);
    }

    // Calculate statistics
    const totalAnalyses = sessionAnalyses?.length || 0;
    const wordAnalyses = sessionAnalyses?.filter(a => a.analysis_type === 'word').length || 0;
    const sentenceAnalyses = sessionAnalyses?.filter(a => a.analysis_type === 'sentence').length || 0;
    const paragraphAnalyses = sessionAnalyses?.filter(a => a.analysis_type === 'paragraph').length || 0;

    // Calculate session duration in hours
    const createdDate = new Date(session.created_at || session.created_at!);
    const lastAccessedDate = new Date(session.last_accessed_at || session.updated_at || session.updated_at!);
    const sessionDurationHours = Math.max(1, (lastAccessedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

    // Calculate average analyses per day
    const sessionDays = Math.max(1, sessionDurationHours / 24);
    const averageAnalysesPerDay = totalAnalyses / sessionDays;

    // Find most active day
    const analysesByDay: Record<string, number> = {};
    sessionAnalyses?.forEach(analysis => {
      const dateStr = new Date(analysis.created_at || analysis.created_at!).toISOString().split('T')[0];
      if (dateStr) {
        analysesByDay[dateStr] = (analysesByDay[dateStr] || 0) + 1;
      }
    });

    const mostActiveDay = Object.keys(analysesByDay).length > 0
      ? Object.keys(analysesByDay).reduce((a: string, b: string) =>
          (analysesByDay[a] || 0) > (analysesByDay[b] || 0) ? a : b
        )
      : new Date().toISOString().split('T')[0];

    // Calculate completion rate (based on session status and activity)
    let completionRate = 0;
    if (session.status === 'active' && totalAnalyses > 0) {
      completionRate = Math.min(100, (totalAnalyses / 10) * 100); // Assume 10 analyses is a complete session
    } else if (session.status === 'archived') {
      completionRate = 100;
    }

    // Prepare breakdown data
    const breakdown = {
      byType: {
        word: wordAnalyses,
        sentence: sentenceAnalyses,
        paragraph: paragraphAnalyses
      },
      byDay: Object.entries(analysesByDay).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date))
    };

    // Prepare recent activity (last 5 analyses)
    const recentActivity = sessionAnalyses?.slice(0, 5).map(analysis => ({
      id: analysis.id,
      type: analysis.analysis_type as 'word' | 'sentence' | 'paragraph',
      title: analysis.analysis_title || `${analysis.analysis_type} analysis`,
      created_at: analysis.created_at || ''
    })) || [];

    const response: SessionAnalyticsResponse = {
      success: true,
      data: {
        session,
        statistics: {
          totalAnalyses,
          wordAnalyses,
          sentenceAnalyses,
          paragraphAnalyses,
          averageAnalysesPerDay: Math.round(averageAnalysesPerDay * 100) / 100,
          mostActiveDay: mostActiveDay || new Date().toISOString().split('T')[0],
          sessionDuration: Math.round(sessionDurationHours * 100) / 100,
          completionRate: Math.round(completionRate)
        },
        breakdown,
        recentActivity
      }
    };

    return createSuccessResponse(response.data);
  }
);