import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface ListAnalysesRequest {
  type?: 'word' | 'sentence' | 'paragraph' | 'all';
  sessionId?: string;
  page?: number;
  perPage?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface ListAnalysesResponse {
  success: boolean;
  data?: {
    analyses: any[];
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

// GET /api/analyses/list - List analyses with filters and pagination
export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/analyses/list', {
    timestamp: new Date().toISOString()
  })
  
  try {
    // Get user ID from authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      apiLogger.warn('Authorization header required', {
        error: 'Missing authorization header'
      })
      
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      apiLogger.warn('Invalid or expired token', {
        error: error?.message || 'Authentication failed'
      })
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const sessionId = searchParams.get('session_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search') || '';

    // Validate type parameter
    if (!['word', 'sentence', 'paragraph', 'all'].includes(type)) {
      apiLogger.warn('Invalid type parameter', {
        type,
        userId: user.id
      })
      
      return NextResponse.json(
        { error: 'Type must be word, sentence, paragraph, or all' },
        { status: 400 }
      );
    }

    let analyses: any[] = [];
    let totalCount = 0;

    // Build queries based on type filter
    if (type === 'all' || type === 'word') {
      let wordQuery = supabase
        .from('word_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (search) {
        wordQuery = wordQuery.or(`word.ilike.%${search}%,context_meaning.ilike.%${search}%,vietnamese_translation.ilike.%${search}%`);
      }

      if (dateFrom) {
        wordQuery = wordQuery.gte('created_at', dateFrom);
      }

      if (dateTo) {
        wordQuery = wordQuery.lte('created_at', dateTo);
      }

      // If sessionId is provided, filter through session_analyses
      if (sessionId) {
        const { data: sessionWordAnalyses } = await supabase
          .from('session_analyses')
          .select('analysis_id')
          .eq('session_id', sessionId)
          .eq('analysis_type', 'word');
        
        if (sessionWordAnalyses && sessionWordAnalyses.length > 0) {
          const wordIds = sessionWordAnalyses.map(item => item.analysis_id);
          wordQuery = wordQuery.in('id', wordIds);
        } else {
          // No word analyses for this session
          wordQuery = wordQuery.eq('id', 'none');
        }
      }

      // Get total count for word analyses
      const { count: wordCount } = await wordQuery;
      totalCount += wordCount || 0;

      // Apply pagination and ordering
      const offset = (page - 1) * perPage;
      const { data: wordAnalyses } = await wordQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      if (wordAnalyses) {
        analyses = analyses.concat(wordAnalyses.map(analysis => ({
          ...analysis,
          analysis_type: 'word'
        })));
      }
    }

    if (type === 'all' || type === 'sentence') {
      let sentenceQuery = supabase
        .from('sentence_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (search) {
        sentenceQuery = sentenceQuery.or(`sentence.ilike.%${search}%,main_idea.ilike.%${search}%,natural_translation.ilike.%${search}%`);
      }

      if (dateFrom) {
        sentenceQuery = sentenceQuery.gte('created_at', dateFrom);
      }

      if (dateTo) {
        sentenceQuery = sentenceQuery.lte('created_at', dateTo);
      }

      // If sessionId is provided, filter through session_analyses
      if (sessionId) {
        const { data: sessionSentenceAnalyses } = await supabase
          .from('session_analyses')
          .select('analysis_id')
          .eq('session_id', sessionId)
          .eq('analysis_type', 'sentence');
        
        if (sessionSentenceAnalyses && sessionSentenceAnalyses.length > 0) {
          const sentenceIds = sessionSentenceAnalyses.map(item => item.analysis_id);
          sentenceQuery = sentenceQuery.in('id', sentenceIds);
        } else {
          // No sentence analyses for this session
          sentenceQuery = sentenceQuery.eq('id', 'none');
        }
      }

      // Get total count for sentence analyses
      const { count: sentenceCount } = await sentenceQuery;
      totalCount += sentenceCount || 0;

      // Apply pagination and ordering
      const offset = (page - 1) * perPage;
      const { data: sentenceAnalyses } = await sentenceQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      if (sentenceAnalyses) {
        analyses = analyses.concat(sentenceAnalyses.map(analysis => ({
          ...analysis,
          analysis_type: 'sentence'
        })));
      }
    }

    if (type === 'all' || type === 'paragraph') {
      let paragraphQuery = supabase
        .from('paragraph_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (search) {
        paragraphQuery = paragraphQuery.or(`paragraph.ilike.%${search}%,main_topic.ilike.%${search}%,better_version.ilike.%${search}%`);
      }

      if (dateFrom) {
        paragraphQuery = paragraphQuery.gte('created_at', dateFrom);
      }

      if (dateTo) {
        paragraphQuery = paragraphQuery.lte('created_at', dateTo);
      }

      // If sessionId is provided, filter through session_analyses
      if (sessionId) {
        const { data: sessionParagraphAnalyses } = await supabase
          .from('session_analyses')
          .select('analysis_id')
          .eq('session_id', sessionId)
          .eq('analysis_type', 'paragraph');
        
        if (sessionParagraphAnalyses && sessionParagraphAnalyses.length > 0) {
          const paragraphIds = sessionParagraphAnalyses.map(item => item.analysis_id);
          paragraphQuery = paragraphQuery.in('id', paragraphIds);
        } else {
          // No paragraph analyses for this session
          paragraphQuery = paragraphQuery.eq('id', 'none');
        }
      }

      // Get total count for paragraph analyses
      const { count: paragraphCount } = await paragraphQuery;
      totalCount += paragraphCount || 0;

      // Apply pagination and ordering
      const offset = (page - 1) * perPage;
      const { data: paragraphAnalyses } = await paragraphQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1);

      if (paragraphAnalyses) {
        analyses = analyses.concat(paragraphAnalyses.map(analysis => ({
          ...analysis,
          analysis_type: 'paragraph'
        })));
      }
    }

    // Sort all analyses by created_at
    analyses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination to the combined results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedAnalyses = analyses.slice(startIndex, endIndex);

    // Get session information for each analysis if needed
    if (sessionId && paginatedAnalyses.length > 0) {
      const { data: sessionAnalyses } = await supabase
        .from('session_analyses')
        .select('*')
        .eq('session_id', sessionId);
      
      if (sessionAnalyses) {
        paginatedAnalyses.forEach(analysis => {
          const sessionAnalysis = sessionAnalyses.find(sa => sa.analysis_id === analysis.id);
          if (sessionAnalysis) {
            analysis.session_analysis_id = sessionAnalysis.id;
            analysis.analysis_title = sessionAnalysis.analysis_title;
            analysis.analysis_summary = sessionAnalysis.analysis_summary;
            analysis.position = sessionAnalysis.position;
          }
        });
      }
    }

    const response: ListAnalysesResponse = {
      success: true,
      data: {
        analyses: paginatedAnalyses,
        pagination: {
          page,
          perPage,
          total: totalCount,
          totalPages: Math.ceil(totalCount / perPage)
        }
      }
    };

    apiLogger.success('Analyses list retrieved successfully', {
      userId: user.id,
      type,
      count: paginatedAnalyses.length,
      total: totalCount
    })

    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Error in list analyses API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}