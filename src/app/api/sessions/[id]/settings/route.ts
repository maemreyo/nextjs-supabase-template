import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SessionSettings, SessionSettingsInsert } from '@/types/sessions';

// GET /api/sessions/[id]/settings - Get session settings
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

    // Get session settings
    const { data: settings, error: fetchError } = await supabase
      .from('session_settings')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
      throw fetchError;
    }

    return NextResponse.json({
      success: true,
      data: settings || {
        session_id: sessionId,
        user_id: user.id,
        auto_save: true,
        show_progress: true,
        enable_notifications: false,
        theme_preference: 'light',
        language_preference: 'en'
      }
    });

  } catch (error) {
    console.error('Error in session settings GET:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/settings - Create or update session settings
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
    const settingsData: Partial<SessionSettingsInsert> = await request.json();

    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('session_settings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    let result;
    
    if (checkError && checkError.code === 'PGRST116') {
      // Create new settings
      const { data: newSettings, error: insertError } = await supabase
        .from('session_settings')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          ...settingsData
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      
      result = newSettings;
    } else if (checkError) {
      throw checkError;
    } else {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from('session_settings')
        .update(settingsData)
        .eq('id', existingSettings.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      result = updatedSettings;
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in session settings POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id]/settings - Update session settings
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
    const settingsData: Partial<SessionSettingsInsert> = await request.json();

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('session_settings')
      .update(settingsData)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });

  } catch (error) {
    console.error('Error in session settings PATCH:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id]/settings - Delete session settings
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

    const { id: sessionId } = await params;

    // Delete settings
    const { error: deleteError } = await supabase
      .from('session_settings')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    });

  } catch (error) {
    console.error('Error in session settings DELETE:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}