import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import type { SessionSettings, SessionSettingsInsert } from '@/types/sessions';

// GET /api/sessions/[id]/settings - Get session settings
export const GET = withAuth(
  async (request, { user, supabase, params }) => {
    const sessionId = params?.id;

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

    const responseData = settings || {
      session_id: sessionId,
      user_id: user.id,
      auto_save: true,
      show_progress: true,
      enable_notifications: false,
      theme_preference: 'light',
      language_preference: 'en'
    };

    return createSuccessResponse(responseData);
  }
);

// POST /api/sessions/[id]/settings - Create or update session settings
export const POST = withAuth(
  async (request, { user, supabase, params }) => {
    const sessionId = params?.id;
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

    return createSuccessResponse(result);
  }
);

// PATCH /api/sessions/[id]/settings - Update session settings
export const PATCH = withAuth(
  async (request, { user, supabase, params }) => {
    const sessionId = params?.id;
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

    return createSuccessResponse(updatedSettings);
  }
);

// DELETE /api/sessions/[id]/settings - Delete session settings
export const DELETE = withAuth(
  async (request, { user, supabase, params }) => {
    const sessionId = params?.id;

    // Delete settings
    const { error: deleteError } = await supabase
      .from('session_settings')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return createSuccessResponse({ deleted: true });
  }
);