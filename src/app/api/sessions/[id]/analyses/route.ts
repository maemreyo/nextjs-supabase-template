import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SessionAnalysis, SessionAnalysisInsert } from '@/types/sessions';

// GET /api/sessions/[id]/analyses - Get session analyses
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

    // Get session analyses
    const { data: analyses, error: fetchError } = await supabase
      .from('session_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: analyses || []
    });

  } catch (error) {
    console.error('Error in session analyses GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/analyses - Add analysis to session
export async function POST(
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
    const analysisData: SessionAnalysisInsert = await request.json();

    // Validate required fields
    if (!analysisData.analysis_type || !analysisData.analysis_id) {
      return NextResponse.json(
        { error: 'analysis_type and analysis_id are required' },
        { status: 400 }
      );
    }

    // Get next position
    const { data: existingAnalyses } = await supabase
      .from('session_analyses')
      .select('position')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingAnalyses && existingAnalyses.length > 0
      ? (existingAnalyses[0]?.position ?? 0) + 1
      : 0;

    // Insert analysis
    const { data: analysis, error: insertError } = await supabase
      .from('session_analyses')
      .insert({
        ...analysisData,
        session_id: sessionId,
        user_id: user.id,
        position: nextPosition
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error in session analyses POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/analyses/[analysisId] - Remove analysis from session
export async function DELETE(
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

    // For DELETE, we need to extract analysisId from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const analysisId = pathSegments[pathSegments.length - 1];
    const { id: sessionId } = await params;
    
    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Check if user owns the analysis
    const { data: analysis, error: checkError } = await supabase
      .from('session_analyses')
      .select('user_id')
      .eq('id', analysisId)
      .single();

    if (checkError || !analysis || analysis.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      );
    }

    // Delete analysis
    const { error: deleteError } = await supabase
      .from('session_analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: { id: analysisId }
    });

  } catch (error) {
    console.error('Error in session analyses DELETE:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id]/analyses/reorder - Reorder session analyses
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

    const { id: sessionId } = await params;
    const { analysis_ids } = await request.json();

    if (!Array.isArray(analysis_ids) || analysis_ids.length === 0) {
      return NextResponse.json(
        { error: 'analysis_ids array is required' },
        { status: 400 }
      );
    }

    // Update positions individually since we don't have the RPC function
    for (let i = 0; i < analysis_ids.length; i++) {
      const { error: updateError } = await supabase
        .from('session_analyses')
        .update({ position: i })
        .eq('id', analysis_ids[i])
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      success: true,
      data: { updated: true }
    });

  } catch (error) {
    console.error('Error in session analyses reorder:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}