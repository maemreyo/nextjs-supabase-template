import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UpdateSessionContentRequest {
  content: string;
}

interface UpdateSessionContentResponse {
  success: boolean;
  data?: {
    content: string;
    updated_at: string;
  };
  error?: string;
}

interface GetSessionContentResponse {
  success: boolean;
  data?: {
    content: string;
    updated_at: string;
  };
  error?: string;
}

// PATCH /api/sessions/[id]/content - Update session content
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse request body
    const body: UpdateSessionContentRequest = await request.json();

    // Validate required fields
    if (body.content === undefined) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Update session content using content column
    const { data: updatedSession, error: updateError } = await supabase
      .from('analysis_sessions')
      .update({
        content: body.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session content:', updateError);
      return NextResponse.json(
        { error: 'Failed to update session content' },
        { status: 500 }
      );
    }

    console.log(`Session content updated successfully: ${sessionId}`);

    const response: UpdateSessionContentResponse = {
      success: true,
      data: {
        content: body.content,
        updated_at: updatedSession.updated_at || new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session content PATCH:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// GET /api/sessions/[id]/content - Get session content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session content from content column
    const { data: session, error: fetchError } = await supabase
      .from('analysis_sessions')
      .select('content, updated_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching session content:', fetchError);
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    const response: GetSessionContentResponse = {
      success: true,
      data: {
        content: session.content || '',
        updated_at: session.updated_at || new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session content GET:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}