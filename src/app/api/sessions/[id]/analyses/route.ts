import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger } from '@/services/logger';

interface SessionAnalysesResponse {
  success: boolean;
  data?: {
    analyses: any[]; // Using any for now due to complex joins
    pagination?: {
      [key: string]: { // Dynamic key based on analysis type
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
        currentCount: number;
      };
    };
  };
  error?: string;
}

// GET /api/sessions/[id]/analyses - Load session analyses with pagination
export const GET = withAuth(
  async (request, { user, supabase, params }) => {
    apiLogger.start('Handling GET /api/sessions/[id]/analyses', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    try {
      // Extract session ID from params (Next.js 16 compatible)
      const sessionId = params?.id;


      if (!sessionId) {
        apiLogger.warn('Session ID is required', {
          error: 'Missing session ID'
        })
        
        return createErrorResponse('Session ID is required', 400);
      }

      // Parse pagination and filter parameters
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const analysisType = searchParams.get('type') || 'all'; // Filter by type: word, sentence, paragraph, phrase, or all
      const sortField = searchParams.get('sort') || 'created_at'; // Default sort by created_at
      const sortOrder = searchParams.get('order') as 'asc' | 'desc' || 'desc'; // Default order is DESC (newest first)
      
      


  
      // Get session analyses with related data

      let sessionAnalysesQuery = supabase
        .from('session_analyses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order(sortField, { ascending: sortOrder === 'asc' }) // Use dynamic sort field and order
        .order('position', { ascending: true }); // Position as secondary sort

      // Apply type filter if specified
      if (analysisType !== 'all') {
        sessionAnalysesQuery = sessionAnalysesQuery.eq('analysis_type', analysisType);
      }

      const { data: sessionAnalyses, error: analysesError } = await sessionAnalysesQuery;

      // Get total count for session analyses with type filter
      let totalSessionAnalysesCount = 0;
      let sessionCountQuery = supabase
        .from('session_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);
      
      if (analysisType !== 'all') {
        sessionCountQuery = sessionCountQuery.eq('analysis_type', analysisType);
      }
      
      const { count: sessionCount, error: sessionCountError } = await sessionCountQuery;
      
      if (!sessionCountError && sessionCount !== null) {
        totalSessionAnalysesCount = sessionCount;
      }

      

      // Get word analyses directly for this session (document_id = session_id) with pagination
      let wordAnalysesData: any[] = [];
      let totalWordsCount = 0;
      
      if (analysisType === 'all' || analysisType === 'word') {

        const { data: wordAnalyses, error: wordAnalysesError } = await supabase
          .from('word_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' }) // Use dynamic sort field and order
          .range(offset, offset + limit - 1);

        // Get total count of word analyses for pagination info
        // Apply type filter if specified for accurate count
        let countQuery = supabase
          .from('word_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', sessionId)
          .eq('user_id', user.id);

        const { count: wordCount, error: countError } = await countQuery;

        if (!wordAnalysesError && wordAnalyses) {
          wordAnalysesData = wordAnalyses;
        }
        
        if (!countError && wordCount !== null) {
          totalWordsCount = wordCount;
        }

        // Fixed hasMore logic: hasMore = (offset + limit) < totalWordsCount
        const hasMore = (offset + limit) < totalWordsCount;

        apiLogger.debug('Word analyses result', {
          wordAnalysesError,
          count: wordAnalysesData.length,
          totalWordsCount,
          offset,
          limit,
          hasMore,
          hasMoreLogic: '(offset + limit) < totalWordsCount'
        });
      }

      // Fetch related analysis data using optimized JOIN queries to eliminate N+1 problem

      let sessionAnalysesWithDetails = [];
      try {
        // Extract analysis IDs from session_analyses to batch fetch related data
        const wordAnalysisIds = (sessionAnalyses || [])
          .filter(analysis => analysis.analysis_type === 'word')
          .map(analysis => analysis.analysis_id);
        
        const sentenceAnalysisIds = (sessionAnalyses || [])
          .filter(analysis => analysis.analysis_type === 'sentence')
          .map(analysis => analysis.analysis_id);
        
        const paragraphAnalysisIds = (sessionAnalyses || [])
          .filter(analysis => analysis.analysis_type === 'paragraph')
          .map(analysis => analysis.analysis_id);
        
        const phraseAnalysisIds = (sessionAnalyses || [])
          .filter(analysis => analysis.analysis_type === 'phrase')
          .map(analysis => analysis.analysis_id);

        // Batch fetch all related data with single queries per type
        const [wordDataResult, sentenceDataResult, paragraphDataResult, phraseDataResult] = await Promise.all([
          // Fetch all word analyses in one query
          wordAnalysisIds.length > 0
            ? supabase
                .from('word_analyses')
                .select('*')
                .in('id', wordAnalysisIds)
            : Promise.resolve({ data: [], error: null }),
          
          // Fetch all sentence analyses in one query
          sentenceAnalysisIds.length > 0
            ? supabase
                .from('sentence_analyses')
                .select('*')
                .in('id', sentenceAnalysisIds)
            : Promise.resolve({ data: [], error: null }),
          
          // Fetch all paragraph analyses in one query
          paragraphAnalysisIds.length > 0
            ? supabase
                .from('paragraph_analyses')
                .select('*')
                .in('id', paragraphAnalysisIds)
            : Promise.resolve({ data: [], error: null }),
          
          // Fetch all phrase analyses in one query
          phraseAnalysisIds.length > 0
            ? supabase
                .from('phrase_analyses')
                .select('*')
                .in('id', phraseAnalysisIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        // Create lookup maps for O(1) access
        const wordAnalysisMap = new Map(
          (wordDataResult.data || []).map(word => [word.id, word])
        );
        const sentenceAnalysisMap = new Map(
          (sentenceDataResult.data || []).map(sentence => [sentence.id, sentence])
        );
        const paragraphAnalysisMap = new Map(
          (paragraphDataResult.data || []).map(paragraph => [paragraph.id, paragraph])
        );
        const phraseAnalysisMap = new Map(
          (phraseDataResult.data || []).map(phrase => [phrase.id, phrase])
        );

        // Combine session analyses with their related data using the maps
        sessionAnalysesWithDetails = (sessionAnalyses || []).map(analysis => {
          let relatedData = {};
          
          try {
            if (analysis.analysis_type === 'word' && wordAnalysisMap.has(analysis.analysis_id)) {
              relatedData = { word_analysis: wordAnalysisMap.get(analysis.analysis_id) };
            } else if (analysis.analysis_type === 'sentence' && sentenceAnalysisMap.has(analysis.analysis_id)) {
              relatedData = { sentence_analysis: sentenceAnalysisMap.get(analysis.analysis_id) };
            } else if (analysis.analysis_type === 'paragraph' && paragraphAnalysisMap.has(analysis.analysis_id)) {
              relatedData = { paragraph_analysis: paragraphAnalysisMap.get(analysis.analysis_id) };
            } else if (analysis.analysis_type === 'phrase' && phraseAnalysisMap.has(analysis.analysis_id)) {
              relatedData = { phrase_analysis: phraseAnalysisMap.get(analysis.analysis_id) };
            }
          } catch (mapError) {
            
          }
          
          return { ...analysis, ...relatedData };
        });

        

      } catch (batchFetchError) {
        apiLogger.error('Failed to fetch related analysis data', {
          error: batchFetchError instanceof Error ? batchFetchError.message : 'Unknown error',
          stack: batchFetchError instanceof Error ? batchFetchError.stack : undefined
        })

        return createErrorResponse('Failed to fetch related analysis data', 500);
      }

      // Convert word analyses to session analysis format
      const wordAnalysesAsSessionAnalyses = wordAnalysesData.map((wordAnalysis, index) => ({
        id: `word_${wordAnalysis.id}`, // Temporary ID for frontend
        analysis_id: wordAnalysis.id,
        analysis_type: 'word' as const,
        session_id: sessionId,
        user_id: wordAnalysis.user_id,
        position: 1000 + index, // Position after regular session analyses
        analysis_title: `Word: ${wordAnalysis.word}`,
        analysis_summary: `Analysis of word "${wordAnalysis.word}"`,
        word_analysis: wordAnalysis
      }));

      // Combine both types of analyses
      const allAnalyses = [
        ...wordAnalysesAsSessionAnalyses
      ].sort((a, b) => {
        // First sort by created_at DESC (newest first), then by position ASC
        // Handle different types of objects with type assertions
        const aAny = a as any;
        const bAny = b as any;
        
        const aDate = new Date(
          aAny.created_at ||
          (aAny.word_analysis && aAny.word_analysis.created_at) ||
          (aAny.sentence_analysis && aAny.sentence_analysis.created_at) ||
          (aAny.paragraph_analysis && aAny.paragraph_analysis.created_at) ||
          (aAny.phrase_analysis && aAny.phrase_analysis.created_at) ||
          0
        );
        
        const bDate = new Date(
          bAny.created_at ||
          (bAny.word_analysis && bAny.word_analysis.created_at) ||
          (bAny.sentence_analysis && bAny.sentence_analysis.created_at) ||
          (bAny.paragraph_analysis && bAny.paragraph_analysis.created_at) ||
          (bAny.phrase_analysis && bAny.phrase_analysis.created_at) ||
          0
        );
        
        if (aDate.getTime() !== bDate.getTime()) {
          return bDate.getTime() - aDate.getTime(); // DESC by created_at
        }
        
        return (aAny.position || 0) - (bAny.position || 0); // ASC by position as tiebreaker
      });

      if (analysesError) {
        apiLogger.error('Failed to fetch session analyses', {
          error: analysesError.message
        })

        return createErrorResponse('Failed to fetch session analyses', 500);
      }

      // Calculate total count based on analysis type filter
      let totalCount = 0;
      let hasMore = false;
      let currentCount = 0;

      if (analysisType === 'word') {
        // For word type, we need to avoid double-counting word analyses that exist in both tables
        const sessionWordAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'word');
        
        // Extract word analysis IDs from session_analyses to identify duplicates
        const sessionWordAnalysisIds = new Set(
          sessionWordAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        
        // Count only unique word analyses by excluding duplicates from direct word analyses
        const uniqueDirectWordAnalyses = wordAnalysesData.filter(
          word => !sessionWordAnalysisIds.has(word.id)
        );
        
        // Total count = unique session word analyses + unique direct word analyses
        // This ensures we don't double-count word analyses that exist in both tables
        totalCount = sessionWordAnalyses.length + uniqueDirectWordAnalyses.length;
        currentCount = sessionWordAnalyses.length + wordAnalysesData.length;
        hasMore = (offset + limit) < totalCount;
      } else if (analysisType === 'all') {
        // For all types, we need to avoid double-counting word analyses that exist in both tables
        const sessionWordAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'word');
        
        // Extract word analysis IDs from session_analyses to identify duplicates
        const sessionWordAnalysisIds = new Set(
          sessionWordAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        
        // Count only unique word analyses by excluding duplicates from direct word analyses
        const uniqueDirectWordAnalyses = wordAnalysesData.filter(
          word => !sessionWordAnalysisIds.has(word.id)
        );
        
        // Calculate non-word analyses count
        const nonWordAnalysesCount = sessionAnalysesWithDetails.filter(a => a.analysis_type !== 'word').length;
        
        // Total count = non-word analyses + unique word analyses from both tables
        totalCount = nonWordAnalysesCount + sessionWordAnalyses.length + uniqueDirectWordAnalyses.length;
        currentCount = sessionAnalysesWithDetails.length + wordAnalysesData.length;
        hasMore = (offset + limit) < totalWordsCount; // Only word analyses are paginated
      } else {
        // For other types (sentence, paragraph, phrase), use session analyses count
        totalCount = totalSessionAnalysesCount;
        currentCount = sessionAnalysesWithDetails.length;
        hasMore = false; // Session analyses are not paginated currently
      }

      const responseData = {
        analyses: allAnalyses,
        pagination: {
          [analysisType]: {
            limit: limit,
            offset: offset,
            total: totalCount,
            hasMore: hasMore,
            currentCount: currentCount
          }
        }
      };

      


      apiLogger.success('Session analyses retrieved successfully', {
        userId: user.id,
        sessionId,
        analysisType,
        count: allAnalyses.length
      })

      return createSuccessResponse(responseData);
      
    } catch (error) {
      apiLogger.error('Error in session analyses API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      return createErrorResponse('Internal server error', 500);
    }
  }
);