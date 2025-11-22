import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.id || !body.session_id || !body.type || !body.input_text || !body.result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: id, session_id, type, input_text, result' 
        },
        { status: 400 }
      );
    }

    // Prepare analysis data for database
    const analysisData = {
      analysis_id: body.id,
      session_id: body.session_id,
      analysis_type: body.type,
      analysis_title: body.title || `${body.type} Analysis`,
      analysis_summary: body.summary || null,
      analysis_data: body.result,
      created_at: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: body.user_id || null,
      position: body.position || null
    };

    // Insert analysis into database
    const { data, error } = await supabase
      .from('session_analyses')
      .insert(analysisData)
      .select()
      .single();

    if (error) {
      console.error('Failed to add analysis:', error);
      
      // Handle duplicate key error
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Analysis with this ID already exists',
            code: 'DUPLICATE_ID'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add analysis to database',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis: data
      }
    });

  } catch (error) {
    console.error('Error in add analysis API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Add batch insert support for better performance
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    if (!Array.isArray(body.analyses) || body.analyses.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'analyses array is required and must not be empty' 
        },
        { status: 400 }
      );
    }

    // Validate each analysis
    for (const analysis of body.analyses) {
      if (!analysis.id || !analysis.session_id || !analysis.type || !analysis.input_text || !analysis.result) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Each analysis must have: id, session_id, type, input_text, result' 
          },
          { status: 400 }
        );
      }
    }

    // Prepare batch data
    const batchData = body.analyses.map((analysis: any) => ({
      analysis_id: analysis.id,
      session_id: analysis.session_id,
      analysis_type: analysis.type,
      analysis_title: analysis.title || `${analysis.type} Analysis`,
      analysis_summary: analysis.summary || null,
      analysis_data: analysis.result,
      created_at: analysis.timestamp ? new Date(analysis.timestamp).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: analysis.user_id || null,
      position: analysis.position || null
    }));

    // Insert batch
    const { data, error } = await supabase
      .from('session_analyses')
      .upsert(batchData, { onConflict: 'analysis_id' })
      .select();

    if (error) {
      console.error('Failed to batch insert analyses:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to batch insert analyses',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analyses: data,
        count: data.length
      }
    });

  } catch (error) {
    console.error('Error in batch add analysis API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}