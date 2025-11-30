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

      

      // Get analyses directly for this session (document_id = session_id) with pagination
      let wordAnalysesData: any[] = [];
      let sentenceAnalysesData: any[] = [];
      let paragraphAnalysesData: any[] = [];
      let phraseAnalysesData: any[] = [];
      
      let totalWordsCount = 0;
      let totalSentencesCount = 0;
      let totalParagraphsCount = 0;
      let totalPhrasesCount = 0;
      
      // Get word analyses directly
      if (analysisType === 'all' || analysisType === 'word') {
        const { data: wordAnalyses, error: wordAnalysesError } = await supabase
          .from('word_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

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

        apiLogger.debug('Word analyses result', {
          count: wordAnalysesData.length,
          totalWordsCount,
          offset,
          limit
        });
      }

      // Get sentence analyses directly
      if (analysisType === 'all' || analysisType === 'sentence') {
        const { data: sentenceAnalyses, error: sentenceAnalysesError } = await supabase
          .from('sentence_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        let countQuery = supabase
          .from('sentence_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', sessionId)
          .eq('user_id', user.id);

        const { count: sentenceCount, error: countError } = await countQuery;

        if (!sentenceAnalysesError && sentenceAnalyses) {
          sentenceAnalysesData = sentenceAnalyses;
        }
        
        if (!countError && sentenceCount !== null) {
          totalSentencesCount = sentenceCount;
        }

        apiLogger.debug('Sentence analyses result', {
          count: sentenceAnalysesData.length,
          totalSentencesCount,
          offset,
          limit
        });
      }

      // Get paragraph analyses directly
      if (analysisType === 'all' || analysisType === 'paragraph') {
        const { data: paragraphAnalyses, error: paragraphAnalysesError } = await supabase
          .from('paragraph_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        let countQuery = supabase
          .from('paragraph_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', sessionId)
          .eq('user_id', user.id);

        const { count: paragraphCount, error: countError } = await countQuery;

        if (!paragraphAnalysesError && paragraphAnalyses) {
          paragraphAnalysesData = paragraphAnalyses;
        }
        
        if (!countError && paragraphCount !== null) {
          totalParagraphsCount = paragraphCount;
        }

        apiLogger.debug('Paragraph analyses result', {
          count: paragraphAnalysesData.length,
          totalParagraphsCount,
          offset,
          limit
        });
      }

      // Get phrase analyses directly
      if (analysisType === 'all' || analysisType === 'phrase') {
        const { data: phraseAnalyses, error: phraseAnalysesError } = await supabase
          .from('phrase_analyses')
          .select('*')
          .eq('document_id', sessionId)
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);

        let countQuery = supabase
          .from('phrase_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', sessionId)
          .eq('user_id', user.id);

        const { count: phraseCount, error: countError } = await countQuery;

        if (!phraseAnalysesError && phraseAnalyses) {
          phraseAnalysesData = phraseAnalyses;
        }
        
        if (!countError && phraseCount !== null) {
          totalPhrasesCount = phraseCount;
        }

        apiLogger.debug('Phrase analyses result', {
          count: phraseAnalysesData.length,
          totalPhrasesCount,
          offset,
          limit
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

      // Convert analyses to session analysis format
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

      const sentenceAnalysesAsSessionAnalyses = sentenceAnalysesData.map((sentenceAnalysis, index) => ({
        id: `sentence_${sentenceAnalysis.id}`, // Temporary ID for frontend
        analysis_id: sentenceAnalysis.id,
        analysis_type: 'sentence' as const,
        session_id: sessionId,
        user_id: sentenceAnalysis.user_id,
        position: 2000 + index, // Position after word analyses
        analysis_title: `Sentence: ${sentenceAnalysis.sentence.substring(0, 50)}...`,
        analysis_summary: `Analysis of sentence "${sentenceAnalysis.sentence.substring(0, 50)}..."`,
        sentence_analysis: sentenceAnalysis
      }));

      const paragraphAnalysesAsSessionAnalyses = paragraphAnalysesData.map((paragraphAnalysis, index) => ({
        id: `paragraph_${paragraphAnalysis.id}`, // Temporary ID for frontend
        analysis_id: paragraphAnalysis.id,
        analysis_type: 'paragraph' as const,
        session_id: sessionId,
        user_id: paragraphAnalysis.user_id,
        position: 3000 + index, // Position after sentence analyses
        analysis_title: `Paragraph: ${paragraphAnalysis.paragraph.substring(0, 50)}...`,
        analysis_summary: `Analysis of paragraph "${paragraphAnalysis.paragraph.substring(0, 50)}..."`,
        paragraph_analysis: paragraphAnalysis
      }));

      const phraseAnalysesAsSessionAnalyses = phraseAnalysesData.map((phraseAnalysis, index) => ({
        id: `phrase_${phraseAnalysis.id}`, // Temporary ID for frontend
        analysis_id: phraseAnalysis.id,
        analysis_type: 'phrase' as const,
        session_id: sessionId,
        user_id: phraseAnalysis.user_id,
        position: 4000 + index, // Position after paragraph analyses
        analysis_title: `Phrase: ${phraseAnalysis.phrase}`,
        analysis_summary: `Analysis of phrase "${phraseAnalysis.phrase}"`,
        phrase_analysis: phraseAnalysis
      }));

      // Combine all types of analyses
      const allAnalyses = [
        // ...sessionAnalysesWithDetails,
        ...wordAnalysesAsSessionAnalyses,
        ...sentenceAnalysesAsSessionAnalyses,
        ...paragraphAnalysesAsSessionAnalyses,
        ...phraseAnalysesAsSessionAnalyses
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
      } else if (analysisType === 'sentence') {
        // For sentence type, avoid double-counting
        const sessionSentenceAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'sentence');
        const sessionSentenceAnalysisIds = new Set(
          sessionSentenceAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const uniqueDirectSentenceAnalyses = sentenceAnalysesData.filter(
          sentence => !sessionSentenceAnalysisIds.has(sentence.id)
        );
        
        totalCount = sessionSentenceAnalyses.length + uniqueDirectSentenceAnalyses.length;
        currentCount = sessionSentenceAnalyses.length + sentenceAnalysesData.length;
        hasMore = (offset + limit) < totalCount;
      } else if (analysisType === 'paragraph') {
        // For paragraph type, avoid double-counting
        const sessionParagraphAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'paragraph');
        const sessionParagraphAnalysisIds = new Set(
          sessionParagraphAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const uniqueDirectParagraphAnalyses = paragraphAnalysesData.filter(
          paragraph => !sessionParagraphAnalysisIds.has(paragraph.id)
        );
        
        totalCount = sessionParagraphAnalyses.length + uniqueDirectParagraphAnalyses.length;
        currentCount = sessionParagraphAnalyses.length + paragraphAnalysesData.length;
        hasMore = (offset + limit) < totalCount;
      } else if (analysisType === 'phrase') {
        // For phrase type, avoid double-counting
        const sessionPhraseAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'phrase');
        const sessionPhraseAnalysisIds = new Set(
          sessionPhraseAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const uniqueDirectPhraseAnalyses = phraseAnalysesData.filter(
          phrase => !sessionPhraseAnalysisIds.has(phrase.id)
        );
        
        totalCount = sessionPhraseAnalyses.length + uniqueDirectPhraseAnalyses.length;
        currentCount = sessionPhraseAnalyses.length + phraseAnalysesData.length;
        hasMore = (offset + limit) < totalCount;
      } else if (analysisType === 'all') {
        // For all types, we need to avoid double-counting analyses that exist in both tables
        const sessionWordAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'word');
        const sessionSentenceAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'sentence');
        const sessionParagraphAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'paragraph');
        const sessionPhraseAnalyses = sessionAnalysesWithDetails.filter(a => a.analysis_type === 'phrase');
        
        // Extract analysis IDs from session_analyses to identify duplicates
        const sessionWordAnalysisIds = new Set(
          sessionWordAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const sessionSentenceAnalysisIds = new Set(
          sessionSentenceAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const sessionParagraphAnalysisIds = new Set(
          sessionParagraphAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        const sessionPhraseAnalysisIds = new Set(
          sessionPhraseAnalyses.map(a => a.analysis_id).filter(Boolean)
        );
        
        // Count only unique analyses by excluding duplicates from direct analyses
        const uniqueDirectWordAnalyses = wordAnalysesData.filter(
          word => !sessionWordAnalysisIds.has(word.id)
        );
        const uniqueDirectSentenceAnalyses = sentenceAnalysesData.filter(
          sentence => !sessionSentenceAnalysisIds.has(sentence.id)
        );
        const uniqueDirectParagraphAnalyses = paragraphAnalysesData.filter(
          paragraph => !sessionParagraphAnalysisIds.has(paragraph.id)
        );
        const uniqueDirectPhraseAnalyses = phraseAnalysesData.filter(
          phrase => !sessionPhraseAnalysisIds.has(phrase.id)
        );
        
        // Total count = session analyses + unique direct analyses from both tables
        totalCount = sessionAnalysesWithDetails.length +
          uniqueDirectWordAnalyses.length +
          uniqueDirectSentenceAnalyses.length +
          uniqueDirectParagraphAnalyses.length +
          uniqueDirectPhraseAnalyses.length;
        currentCount = sessionAnalysesWithDetails.length +
          wordAnalysesData.length +
          sentenceAnalysesData.length +
          paragraphAnalysesData.length +
          phraseAnalysesData.length;
        hasMore = (offset + limit) < totalCount;
      } else {
        // For other types, use session analyses count
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

      


      apiLogger.info('Session analyses retrieved successfully', {
        userId: user.id,
        sessionId,
        analysisType,
        count: allAnalyses.length,
        dataLength: {
          sessionAnalyses: sessionAnalysesWithDetails.length,
          wordAnalyses: wordAnalysesData.length,
          sentenceAnalyses: sentenceAnalysesData.length,
          paragraphAnalyses: paragraphAnalysesData.length,
          phraseAnalyses: phraseAnalysesData.length
        },
        totalCount,
        currentCount,
        hasMore
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