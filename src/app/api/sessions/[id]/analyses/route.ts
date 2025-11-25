import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';

interface SessionAnalysesResponse {
  success: boolean;
  data?: {
    analyses: any[]; // Using any for now due to complex joins
    pagination?: {
      words: {
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
    console.log('🔍 [DEBUG] API analyses route - Starting request');
    
    try {
      // Extract session ID from params (Next.js 16 compatible)
      const sessionId = params?.id;
      console.log('🔍 [DEBUG] API analyses route - Session ID extracted:', sessionId);

      if (!sessionId) {
        console.error('🔍 [DEBUG] API analyses route - Session ID is empty or undefined');
        return createErrorResponse('Session ID is required', 400);
      }

      // Parse pagination and filter parameters
      const { searchParams } = new URL(request.url);
      const wordsLimit = parseInt(searchParams.get('wordsLimit') || '20');
      const wordsOffset = parseInt(searchParams.get('wordsOffset') || '0');
      const analysisType = searchParams.get('type') || 'all'; // Filter by type: word, sentence, paragraph, phrase, or all
      
      console.log('🔍 [DEBUG] API analyses route - Params:', { 
        sessionId, 
        wordsLimit, 
        wordsOffset, 
        analysisType 
      });

      console.log('🔍 [DEBUG] API analyses route - Processing session ID:', sessionId);
  
      // Get session analyses with related data
      console.log('🔍 [DEBUG] API analyses route - Fetching session analyses...');
      let sessionAnalysesQuery = supabase
        .from('session_analyses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      // Apply type filter if specified
      if (analysisType !== 'all') {
        sessionAnalysesQuery = sessionAnalysesQuery.eq('analysis_type', analysisType);
      }

      const { data: sessionAnalyses, error: analysesError } = await sessionAnalysesQuery;

      console.log('🔍 [DEBUG] API analyses route - Session analyses result:', {
        analysesError,
        count: sessionAnalyses?.length || 0,
        analysisType
      });

      // Get word analyses directly for this session (document_id = session_id) with pagination
      let wordAnalysesData: any[] = [];
      let totalWordsCount = 0;
      
      if (analysisType === 'all' || analysisType === 'word') {
        console.log('🔍 [DEBUG] API analyses route - Fetching word analyses with pagination...');
        const { data: wordAnalyses, error: wordAnalysesError } = await supabase
          .from('word_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .range(wordsOffset, wordsOffset + wordsLimit - 1);

        // Get total count of word analyses for pagination info
        const { count: wordCount, error: countError } = await supabase
          .from('word_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', sessionId)
          .eq('user_id', user.id);

        if (!wordAnalysesError && wordAnalyses) {
          wordAnalysesData = wordAnalyses;
        }
        
        if (!countError && wordCount !== null) {
          totalWordsCount = wordCount;
        }

        console.log('🔍 [DEBUG] API analyses route - Word analyses result:', {
          wordAnalysesError,
          count: wordAnalysesData.length,
          totalWordsCount,
          wordsOffset,
          wordsLimit,
          hasMore: (wordsOffset + wordsLimit) < totalWordsCount
        });
      }

      // Fetch related analysis data using optimized JOIN queries to eliminate N+1 problem
      console.log('🔍 [DEBUG] API analyses route - Fetching related analysis data with JOIN queries...');
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
            console.error('🔍 [DEBUG] API analyses route - Error combining related data:', {
              analysisId: analysis.id,
              analysisType: analysis.analysis_type,
              mapError
            });
          }
          
          return { ...analysis, ...relatedData };
        });

        console.log('🔍 [DEBUG] API analyses route - Optimized JOIN query results:', {
          wordAnalysesCount: wordDataResult.data?.length || 0,
          sentenceAnalysesCount: sentenceDataResult.data?.length || 0,
          paragraphAnalysesCount: paragraphDataResult.data?.length || 0,
          phraseAnalysesCount: phraseDataResult.data?.length || 0,
          totalSessionAnalyses: sessionAnalysesWithDetails.length
        });

      } catch (batchFetchError) {
        console.error('🔍 [DEBUG] API analyses route - Batch fetch error:', batchFetchError);
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
        ...sessionAnalysesWithDetails,
        ...wordAnalysesAsSessionAnalyses
      ].sort((a, b) => (a.position || 0) - (b.position || 0));

      if (analysesError) {
        console.error('Error fetching session analyses:', analysesError);
        return createErrorResponse('Failed to fetch session analyses', 500);
      }

      const responseData = {
        analyses: allAnalyses,
        pagination: {
          words: {
            limit: wordsLimit,
            offset: wordsOffset,
            total: totalWordsCount,
            hasMore: (wordsOffset + wordsLimit) < totalWordsCount,
            currentCount: wordAnalysesData.length
          }
        }
      };

      console.log('🔍 [DEBUG] API analyses route - Successfully processed session analyses:', sessionId);
      return createSuccessResponse(responseData);
      
    } catch (error) {
      console.error('🔍 [DEBUG] API analyses route - Unexpected error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: params?.id || 'unknown'
      });
      return createErrorResponse('Internal server error', 500);
    }
  }
);