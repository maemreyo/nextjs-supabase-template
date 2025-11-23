import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface RenameSessionRequest {
  title: string;
  description?: string;
}

interface RenameSessionResponse {
  success: boolean;
  data?: {
    session: Database['public']['Tables']['analysis_sessions']['Row'];
    previousTitle: string;
    previousDescription?: string;
  };
  error?: string;
}

// PUT /api/sessions/[id]/rename - Rename a session
export async function PUT(
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

    // Parse request body
    const body: RenameSessionRequest = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      );
    }

    // Validate description length if provided
    if (body.description && body.description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Get current session to track changes
    const { data: currentSession, error: fetchError } = await supabase
      .from('analysis_sessions')
      .select('title, description')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Check if title is actually different
    if (currentSession.title === body.title && 
        (currentSession.description || null) === (body.description || null)) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      );
    }

    // Update session
    const updateData: Database['public']['Tables']['analysis_sessions']['Update'] = {
      title: body.title.trim(),
      description: body.description ? body.description.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      console.error('Error renaming session:', updateError);
      return NextResponse.json(
        { error: 'Failed to rename session' },
        { status: 500 }
      );
    }

    const response: RenameSessionResponse = {
      success: true,
      data: {
        session: updatedSession,
        previousTitle: currentSession.title,
        previousDescription: currentSession.description || undefined,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session rename PUT:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}