import { NextRequest } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { Database } from '@/lib/database.types';
import { apiLogger, authLogger } from '@/services/logger';

interface CreateHighlightRequest {
  sessionId: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
  text: string;
  startPosition: number;
  endPosition: number;
  color?: string;
  content?: string;
}

interface CreateHighlightResponse {
  success: boolean;
  data?: {
    highlightId: string;
    type: string;
    text: string;
    status: string;
  };
  error?: string;
}

// Helper function to validate highlight type
function validateHighlightType(type: string): boolean {
  return ['word', 'phrase', 'sentence', 'paragraph'].includes(type);
}

// Helper function to generate default color based on type
function getDefaultColor(type: string): string {
  const colorMap = {
    word: '#fef3c7', // yellow
    phrase: '#dbeafe', // blue
    sentence: '#dcfce7', // green
    paragraph: '#fce7f3', // pink
  };
  return colorMap[type as keyof typeof colorMap] || '#fef3c7';
}

// POST /api/highlights - Create a new highlight
export const POST = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    apiLogger.start('Create highlight', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    // Log authentication details for debugging
    const authHeader = request.headers.get('authorization');
    authLogger.debug('POST /api/highlights auth check', {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 10) + '...',
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Parse request body
      const body: CreateHighlightRequest = await request.json();

      // Validate required fields
      if (!body.sessionId || !body.type || !body.text || body.startPosition === undefined || body.endPosition === undefined) {
        apiLogger.warn('Invalid request - missing required fields', {
          userId: user.id,
          hasSessionId: !!body.sessionId,
          hasType: !!body.type,
          hasText: !!body.text,
          hasStartPosition: body.startPosition !== undefined,
          hasEndPosition: body.endPosition !== undefined
        });
        
        return createErrorResponse(
          'sessionId, type, text, startPosition, and endPosition are required',
          400
        );
      }

      // Validate highlight type
      if (!validateHighlightType(body.type)) {
        apiLogger.warn('Invalid highlight type', {
          userId: user.id,
          type: body.type
        });
        
        return createErrorResponse(
          'Type must be word, phrase, sentence, or paragraph',
          400
        );
      }

      // Validate position values
      if (body.startPosition < 0 || body.endPosition < 0 || body.startPosition >= body.endPosition) {
        apiLogger.warn('Invalid position values', {
          userId: user.id,
          startPosition: body.startPosition,
          endPosition: body.endPosition
        });
        
        return createErrorResponse(
          'Invalid position values: startPosition must be >= 0, endPosition must be >= 0, and startPosition must be < endPosition',
          400
        );
      }

      // Validate text length matches position range
      const expectedLength = body.endPosition - body.startPosition;
      if (body.text.length !== expectedLength) {
        apiLogger.warn('Text length does not match position range', {
          userId: user.id,
          textLength: body.text.length,
          expectedLength,
          startPosition: body.startPosition,
          endPosition: body.endPosition
        });
        
        return createErrorResponse(
          'Text length does not match the position range (endPosition - startPosition)',
          400
        );
      }

      // Set default color if not provided
      const highlightColor = body.color || getDefaultColor(body.type);

      // Create highlight data
      const highlightData: any = {
        session_id: body.sessionId,
        highlight_type: body.type,
        selected_text: body.text,
        start_position: body.startPosition,
        end_position: body.endPosition,
        color: highlightColor,
        status: 'pending_analysis',
        content: body.content || '', // Use empty string instead of null to satisfy NOT NULL constraint
        user_id: user.id,
      };

      // Insert highlight into database
      const { data, error } = await supabase
        .from('highlights')
        .insert(highlightData)
        .select()
        .single();

      if (error) {
        // Enhanced logging for schema errors
        const isSchemaError = error.message?.includes('column') ||
                           error.message?.includes('does not exist') ||
                           error.message?.includes('relation') ||
                           error.message?.includes('constraint') ||
                           error.message?.includes('duplicate key');
        
        if (isSchemaError) {
          apiLogger.error('Schema error in create highlight', {
            userId: user.id,
            sessionId: body.sessionId,
            type: body.type,
            error: error.message,
            errorCode: error.code,
            details: error.details,
            hint: 'Check if using correct column name: "content" instead of "context"',
            schemaTable: 'highlights',
            attemptedColumns: Object.keys(highlightData),
            schemaColumns: ['id', 'session_id', 'user_id', 'highlight_type', 'content', 'start_position', 'end_position', 'selected_text', 'color', 'status', 'created_at', 'updated_at']
          });
        } else {
          apiLogger.error('Failed to create highlight', {
            userId: user.id,
            sessionId: body.sessionId,
            type: body.type,
            error: error.message
          });
        }
        
        throw error;
      }

      // Update session highlight count
      // First get current count, then increment
      const { data: sessionData, error: sessionFetchError } = await supabase
        .from('analysis_sessions')
        .select('highlights_count')
        .eq('id', body.sessionId)
        .single();
        
      let sessionUpdateError = null;
      
      if (!sessionFetchError && sessionData) {
        const newCount = (sessionData.highlights_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('analysis_sessions')
          .update({
            highlights_count: newCount,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', body.sessionId);
          
        sessionUpdateError = updateError;
      } else {
        sessionUpdateError = sessionFetchError;
      }

      if (sessionUpdateError) {
        apiLogger.warn('Failed to update session highlight count', {
          userId: user.id,
          sessionId: body.sessionId,
          error: sessionUpdateError.message
        });
        // Don't fail the operation, just log the error
      }

      const response = {
        highlightId: data.id,
        type: data.type,
        text: data.text,
        status: data.status,
        color: data.color
      };

      apiLogger.success('Highlight created successfully', {
        userId: user.id,
        highlightId: data.id,
        sessionId: body.sessionId,
        type: data.type
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in create highlight API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);

// GET /api/highlights - Get highlights for a session
export const GET = withAuth(
  async (request: NextRequest, { user, supabase }: { user: any; supabase: any }) => {
    apiLogger.start('Get highlights', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const sessionId = searchParams.get('sessionId');
      const type = searchParams.get('type');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Validate required parameters
      if (!sessionId) {
        apiLogger.warn('Missing sessionId parameter', {
          userId: user.id
        });
        
        return createErrorResponse(
          'sessionId parameter is required',
          400
        );
      }

      // Validate type if provided
      if (type && !validateHighlightType(type)) {
        apiLogger.warn('Invalid type parameter', {
          userId: user.id,
          type
        });
        
        return createErrorResponse(
          'Type must be word, phrase, sentence, or paragraph',
          400
        );
      }

      // Validate status if provided
      if (status && !['pending_analysis', 'analyzed', 'error'].includes(status)) {
        apiLogger.warn('Invalid status parameter', {
          userId: user.id,
          status
        });
        
        return createErrorResponse(
          'Status must be pending_analysis, analyzed, or error',
          400
        );
      }

      // Build query
      let query = supabase
        .from('highlights')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Add filters if provided
      if (type) {
        query = query.eq('type', type);
      }
      if (status) {
        query = query.eq('status', status);
      }

      // Add pagination
      query = query.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        apiLogger.error('Failed to fetch highlights', {
          userId: user.id,
          sessionId,
          error: error.message
        });
        
        throw error;
      }

      const response = {
        highlights: data || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (offset + limit) < (count || 0)
        }
      };

      apiLogger.success('Highlights fetched successfully', {
        userId: user.id,
        sessionId,
        count: data?.length || 0,
        total: count || 0
      });

      return createSuccessResponse(response);

    } catch (error) {
      apiLogger.error('Error in get highlights API', {
        userId: user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }
);