import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Request/Response types
interface SyncRequest {
  local_history: Array<{
    id: string;
    type: 'word' | 'sentence' | 'paragraph';
    input: string;
    result: any;
    timestamp: number;
  }>;
  last_sync_timestamp?: number;
}

interface SyncResponse {
  success: boolean;
  data: {
    uploaded: number;        // số items được upload
    downloaded: number;     // số items được download
    conflicts: Array<{       // các conflicts cần resolve
      local: any;
      remote: any;
    }>;
    merged_history: Array<{
      id: string;
      type: 'word' | 'sentence' | 'paragraph';
      input: string;
      result: any;
      timestamp: number;
    }>;
  };
  error?: string;
}

// POST /api/analyses/sync - Sync local history with database
export async function POST(request: NextRequest) {
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

    const syncRequest: SyncRequest = await request.json();
    const { local_history, last_sync_timestamp } = syncRequest;

    // Get remote history from database
    let remoteQuery = supabase
      .from('recent_analyses')
      .select(`
        id,
        analysis_type,
        analysis_id,
        analysis_title,
        analysis_summary,
        analysis_data,
        created_at,
        updated_at,
        session_id,
        session_title,
        session_type,
        session_status,
        user_id,
        position
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by last sync timestamp if provided
    if (last_sync_timestamp) {
      const lastSyncDate = new Date(last_sync_timestamp).toISOString();
      remoteQuery = remoteQuery.gt('created_at', lastSyncDate);
    }

    const { data: remoteAnalyses, error: remoteError } = await remoteQuery;

    if (remoteError) {
      throw remoteError;
    }

    // Transform remote data to match local format
    const transformedRemote = (remoteAnalyses || []).map(item => {
      let inputText = '';
      let analysisData = null;

      if (item.analysis_data && typeof item.analysis_data === 'object') {
        analysisData = item.analysis_data;
        const analysisObj = analysisData as any;
        
        if (item.analysis_type === 'word' && analysisObj.meta?.word) {
          inputText = analysisObj.meta.word;
        } else if (item.analysis_type === 'sentence' && analysisObj.meta?.sentence) {
          inputText = analysisObj.meta.sentence;
        } else if (item.analysis_type === 'paragraph' && analysisObj.meta?.paragraph) {
          inputText = analysisObj.meta.paragraph;
        }
      }

      return {
        id: item.id || '',
        type: item.analysis_type as 'word' | 'sentence' | 'paragraph',
        input: inputText || item.analysis_title || '',
        result: analysisData,
        timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now()
      };
    });

    // Find conflicts (items with same ID but different content/timestamp)
    const conflicts: Array<{ local: any; remote: any }> = [];
    const remoteMap = new Map(transformedRemote.map(item => [item.id, item]));
    
    local_history.forEach(localItem => {
      const remoteItem = remoteMap.get(localItem.id);
      if (remoteItem && (
        localItem.timestamp !== remoteItem.timestamp ||
        localItem.input !== remoteItem.input ||
        JSON.stringify(localItem.result) !== JSON.stringify(remoteItem.result)
      )) {
        conflicts.push({
          local: localItem,
          remote: remoteItem
        });
      }
    });

    // Upload new local items to database
    let uploaded = 0;
    const localMap = new Map(local_history.map(item => [item.id, item]));
    
    for (const localItem of local_history) {
      const existsInRemote = remoteMap.has(localItem.id);
      
      if (!existsInRemote) {
        try {
          // Create session analysis entry
          const { error: insertError } = await supabase
            .from('session_analyses')
            .insert({
              user_id: user.id,
              analysis_type: localItem.type,
              analysis_id: localItem.id, // Using local ID as analysis_id
              analysis_title: localItem.input.substring(0, 100),
              analysis_summary: generateSummary(localItem),
              analysis_data: localItem.result,
              position: 0 // Will be updated later if needed
            });

          if (!insertError) {
            uploaded++;
          }
        } catch (error) {
          console.error('Failed to upload local item:', localItem.id, error);
        }
      }
    }

    // Merge histories (remote takes precedence for conflicts by default)
    const mergedHistory = [
      ...transformedRemote,
      ...local_history.filter(localItem => !remoteMap.has(localItem.id))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const response: SyncResponse = {
      success: true,
      data: {
        uploaded,
        downloaded: transformedRemote.length,
        conflicts,
        merged_history: mergedHistory
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in analyses sync POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate summary from analysis
function generateSummary(item: any): string {
  try {
    if (item.type === 'word' && item.result?.definitions?.root_meaning) {
      return `Word: ${item.input} - ${item.result.definitions.root_meaning}`;
    } else if (item.type === 'sentence' && item.result?.semantics?.main_idea) {
      return `Sentence analysis: ${item.result.semantics.main_idea}`;
    } else if (item.type === 'paragraph' && item.result?.content_analysis?.main_topic) {
      return `Paragraph: ${item.result.content_analysis.main_topic}`;
    }
    return `${item.type} analysis of: ${item.input.substring(0, 50)}`;
  } catch (error) {
    return `${item.type} analysis`;
  }
}