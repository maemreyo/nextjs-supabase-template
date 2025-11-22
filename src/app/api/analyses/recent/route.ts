import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

// Request/Response types
interface RecentAnalysesRequest {
  limit?: number;           // default: 20, max: 100
  offset?: number;          // default: 0, for pagination
  type?: 'word' | 'sentence' | 'paragraph' | 'all';  // filter by type
  session_id?: string;      // filter by session
  date_range?: {            // filter by date range
    start: string;          // ISO date string
    end: string;            // ISO date string
  };
  search?: string;          // search in input text
  sort_by?: 'created_at' | 'updated_at' | 'analysis_type';
  sort_order?: 'asc' | 'desc';
}

interface RecentAnalysesResponse {
  success: boolean;
  data: {
    analyses: AnalysisHistoryItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
    cache_info?: {
      cached: boolean;
      cache_ttl: number;
      last_updated: string;
    };
  };
  error?: string;
}

interface AnalysisHistoryItem {
  id: string;
  type: 'word' | 'sentence' | 'paragraph';
  input: string;
  result: any;  // WordAnalysis | SentenceAnalysis | ParagraphAnalysis
  timestamp: number;
  session_id?: string;
  session_title?: string;
  analysis_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Type for recent_analyses view - using the actual structure from database.types.ts
type RecentAnalysesRow = {
  id: string | null;
  session_id: string | null;
  user_id: string | null;
  analysis_type: string | null;
  analysis_id: string | null;
  analysis_title: string | null;
  analysis_summary: string | null;
  analysis_data: any;
  position: number | null;
  created_at: string | null;
  updated_at: string | null;
  session_title: string | null;
  session_type: string | null;
  session_status: string | null;
};

// GET /api/analyses/recent - Get recent analyses from database
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
    const params: RecentAnalysesRequest = {
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      offset: parseInt(searchParams.get('offset') || '0'),
      type: (searchParams.get('type') as any) || 'all',
      session_id: searchParams.get('session_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as any) || 'desc'
    };

    // Parse date range if provided
    const dateStart = searchParams.get('date_start');
    const dateEnd = searchParams.get('date_end');
    if (dateStart && dateEnd) {
      params.date_range = {
        start: dateStart,
        end: dateEnd
      };
    }

    // Build query using recent_analyses view
    let query = supabase
      .from('recent_analyses')
      .select(`
        id,
        analysis_type,
        analysis_id,
        analysis_title,
        analysis_summary,
        analysis_data,
        created_at,
        updated_at,
        session_id,
        session_title,
        session_type,
        session_status,
        user_id,
        position
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (params.type && params.type !== 'all') {
      query = query.eq('analysis_type', params.type);
    }

    if (params.session_id) {
      query = query.eq('session_id', params.session_id);
    }

    if (params.date_range) {
      query = query
        .gte('created_at', params.date_range.start)
        .lte('created_at', params.date_range.end);
    }

    if (params.search) {
      query = query.or(`analysis_title.ilike.%${params.search}%,analysis_summary.ilike.%${params.search}%`);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('recent_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      throw countError;
    }

    // Apply sorting and pagination
    query = query
      .order(params.sort_by || 'created_at', { ascending: params.sort_order === 'asc' })
      .range(params.offset!, params.offset! + params.limit! - 1);

    const { data: analyses, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    // Transform data to match AnalysisHistoryItem interface
    const transformedAnalyses: AnalysisHistoryItem[] = (analyses || []).map((item: RecentAnalysesRow) => {
      // Extract input text based on analysis type
      let inputText = '';
      let analysisData = null;

      if (item.analysis_data && typeof item.analysis_data === 'object') {
        analysisData = item.analysis_data;
        
        // Type assertion for analysis_data
        const analysisObj = analysisData as any;
        
        if (item.analysis_type === 'word' && analysisObj.meta?.word) {
          inputText = analysisObj.meta.word;
        } else if (item.analysis_type === 'sentence' && analysisObj.meta?.sentence) {
          inputText = analysisObj.meta.sentence;
        } else if (item.analysis_type === 'paragraph' && analysisObj.meta?.paragraph) {
          inputText = analysisObj.meta.paragraph;
        }
      }

      return {
        id: item.id || '',
        type: item.analysis_type as 'word' | 'sentence' | 'paragraph',
        input: inputText || item.analysis_title || '',
        result: analysisData,
        timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        session_id: item.session_id || undefined,
        session_title: item.session_title || undefined,
        analysis_id: item.analysis_id || undefined,
        created_at: item.created_at || undefined,
        updated_at: item.updated_at || undefined
      };
    });

    const response: RecentAnalysesResponse = {
      success: true,
      data: {
        analyses: transformedAnalyses,
        pagination: {
          total: count || 0,
          limit: params.limit!,
          offset: params.offset!,
          has_more: (params.offset! + params.limit!) < (count || 0)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in recent analyses GET:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/analyses/recent - Advanced query with complex filters
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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const params: RecentAnalysesRequest = await request.json();

    // Validate parameters
    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;

    // Build query using recent_analyses view
    let query = supabase
      .from('recent_analyses')
      .select(`
        id,
        analysis_type,
        analysis_id,
        analysis_title,
        analysis_summary,
        analysis_data,
        created_at,
        updated_at,
        session_id,
        session_title,
        session_type,
        session_status,
        user_id,
        position
      `)
      .eq('user_id', user.id);

    // Apply filters
    if (params.type && params.type !== 'all') {
      query = query.eq('analysis_type', params.type);
    }

    if (params.session_id) {
      query = query.eq('session_id', params.session_id);
    }

    if (params.date_range) {
      query = query
        .gte('created_at', params.date_range.start)
        .lte('created_at', params.date_range.end);
    }

    if (params.search) {
      query = query.or(`analysis_title.ilike.%${params.search}%,analysis_summary.ilike.%${params.search}%`);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('recent_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (countError) {
      throw countError;
    }

    // Apply sorting and pagination
    query = query
      .order(params.sort_by || 'created_at', { ascending: params.sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: analyses, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    // Transform data to match AnalysisHistoryItem interface
    const transformedAnalyses: AnalysisHistoryItem[] = (analyses || []).map((item: RecentAnalysesRow) => {
      // Extract input text based on analysis type
      let inputText = '';
      let analysisData = null;

      if (item.analysis_data && typeof item.analysis_data === 'object') {
        analysisData = item.analysis_data;
        
        // Type assertion for analysis_data
        const analysisObj = analysisData as any;
        
        if (item.analysis_type === 'word' && analysisObj.meta?.word) {
          inputText = analysisObj.meta.word;
        } else if (item.analysis_type === 'sentence' && analysisObj.meta?.sentence) {
          inputText = analysisObj.meta.sentence;
        } else if (item.analysis_type === 'paragraph' && analysisObj.meta?.paragraph) {
          inputText = analysisObj.meta.paragraph;
        }
      }

      return {
        id: item.id || '',
        type: item.analysis_type as 'word' | 'sentence' | 'paragraph',
        input: inputText || item.analysis_title || '',
        result: analysisData,
        timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        session_id: item.session_id || undefined,
        session_title: item.session_title || undefined,
        analysis_id: item.analysis_id || undefined,
        created_at: item.created_at || undefined,
        updated_at: item.updated_at || undefined
      };
    });

    const response: RecentAnalysesResponse = {
      success: true,
      data: {
        analyses: transformedAnalyses,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (offset + limit) < (count || 0)
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in recent analyses POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}