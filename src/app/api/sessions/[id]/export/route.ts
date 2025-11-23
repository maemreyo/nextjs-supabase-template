import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

interface ExportSessionRequest {
  format?: 'json' | 'csv' | 'markdown' | 'pdf';
  includeAnalyses?: boolean;
  includeSettings?: boolean;
  includeMetadata?: boolean;
}

interface ExportSessionResponse {
  success: boolean;
  data?: {
    content: string;
    filename: string;
    mimeType: string;
    format: string;
  };
  error?: string;
}

// POST /api/sessions/[id]/export - Export a session in various formats
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: ExportSessionRequest = await request.json();
    const format = body.format || 'json';
    const includeAnalyses = body.includeAnalyses !== false;
    const includeSettings = body.includeSettings !== false;
    const includeMetadata = body.includeMetadata !== false;

    // Validate format
    if (!['json', 'csv', 'markdown', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be json, csv, markdown, or pdf' },
        { status: 400 }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    let exportData: any = {
      session: includeMetadata ? {
        id: session.id,
        title: session.title,
        description: session.description,
        session_type: session.session_type,
        status: session.status,
        created_at: session.created_at,
        updated_at: session.updated_at,
        last_accessed_at: session.last_accessed_at,
        total_analyses: session.total_analyses,
        word_analyses_count: session.word_analyses_count,
        sentence_analyses_count: session.sentence_analyses_count,
        paragraph_analyses_count: session.paragraph_analyses_count,
      } : {
        title: session.title,
        description: session.description,
        session_type: session.session_type,
      }
    };

    // Include analyses if requested
    if (includeAnalyses) {
      const { data: sessionAnalyses, error: analysesError } = await supabase
        .from('session_analyses')
        .select(`
          *,
          word_analyses!inner(*),
          sentence_analyses!inner(*),
          paragraph_analyses!inner(*)
        `)
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (!analysesError && sessionAnalyses) {
        exportData.analyses = sessionAnalyses.map(analysis => {
          const baseAnalysis = {
            id: analysis.id,
            type: analysis.analysis_type,
            title: analysis.analysis_title,
            summary: analysis.analysis_summary,
            position: analysis.position,
            created_at: analysis.created_at,
          };

          if (analysis.analysis_type === 'word' && analysis.word_analyses) {
            return {
              ...baseAnalysis,
              data: analysis.word_analyses,
            };
          } else if (analysis.analysis_type === 'sentence' && analysis.sentence_analyses) {
            return {
              ...baseAnalysis,
              data: analysis.sentence_analyses,
            };
          } else if (analysis.analysis_type === 'paragraph' && analysis.paragraph_analyses) {
            return {
              ...baseAnalysis,
              data: analysis.paragraph_analyses,
            };
          }

          return baseAnalysis;
        });
      }
    }

    // Include settings if requested
    if (includeSettings) {
      const { data: settings, error: settingsError } = await supabase
        .from('session_settings')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (!settingsError && settings) {
        exportData.settings = settings;
      }
    }

    // Generate export content based on format
    let content: string;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTitle = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `${safeTitle}_session_${timestamp}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = convertToCSV(exportData);
        filename = `${safeTitle}_session_${timestamp}.csv`;
        mimeType = 'text/csv';
        break;

      case 'markdown':
        content = convertToMarkdown(exportData);
        filename = `${safeTitle}_session_${timestamp}.md`;
        mimeType = 'text/markdown';
        break;

      case 'pdf':
        // For PDF, we'll return JSON for now as PDF generation requires additional libraries
        // In a real implementation, you would use a library like puppeteer or jsPDF
        return NextResponse.json(
          { error: 'PDF export not yet implemented. Please use JSON, CSV, or Markdown format.' },
          { status: 501 }
        );

      default:
        throw new Error('Unsupported format');
    }

    const response: ExportSessionResponse = {
      success: true,
      data: {
        content,
        filename,
        mimeType,
        format,
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in session export POST:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Helper function to convert export data to CSV
function convertToCSV(data: any): string {
  const headers = ['Type', 'Title', 'Summary', 'Created At'];
  const rows = [headers.join(',')];

  if (data.analyses) {
    data.analyses.forEach((analysis: any) => {
      const row = [
        `"${analysis.type}"`,
        `"${analysis.title || ''}"`,
        `"${analysis.summary || ''}"`,
        `"${analysis.created_at || ''}"`
      ];
      rows.push(row.join(','));
    });
  }

  return rows.join('\n');
}

// Helper function to convert export data to Markdown
function convertToMarkdown(data: any): string {
  let markdown = `# ${data.session.title}\n\n`;

  if (data.session.description) {
    markdown += `**Description:** ${data.session.description}\n\n`;
  }

  markdown += `**Type:** ${data.session.session_type}\n`;
  markdown += `**Status:** ${data.session.status}\n`;
  markdown += `**Created:** ${new Date(data.session.created_at).toLocaleDateString()}\n\n`;

  if (data.analyses && data.analyses.length > 0) {
    markdown += `## Analyses (${data.analyses.length})\n\n`;

    data.analyses.forEach((analysis: any, index: number) => {
      markdown += `### ${index + 1}. ${analysis.title || `${analysis.type} analysis`}\n\n`;
      markdown += `**Type:** ${analysis.type}\n`;
      markdown += `**Created:** ${new Date(analysis.created_at).toLocaleDateString()}\n\n`;

      if (analysis.summary) {
        markdown += `**Summary:** ${analysis.summary}\n\n`;
      }

      if (analysis.data) {
        if (analysis.type === 'word' && analysis.data.word) {
          markdown += `**Word:** ${analysis.data.word}\n`;
          if (analysis.data.vietnamese_translation) {
            markdown += `**Translation:** ${analysis.data.vietnamese_translation}\n`;
          }
          if (analysis.data.context_meaning) {
            markdown += `**Context Meaning:** ${analysis.data.context_meaning}\n`;
          }
        } else if (analysis.type === 'sentence' && analysis.data.sentence) {
          markdown += `**Sentence:** ${analysis.data.sentence}\n`;
          if (analysis.data.natural_translation) {
            markdown += `**Translation:** ${analysis.data.natural_translation}\n`;
          }
          if (analysis.data.main_idea) {
            markdown += `**Main Idea:** ${analysis.data.main_idea}\n`;
          }
        } else if (analysis.type === 'paragraph' && analysis.data.paragraph) {
          markdown += `**Paragraph:** ${analysis.data.paragraph}\n`;
          if (analysis.data.main_topic) {
            markdown += `**Main Topic:** ${analysis.data.main_topic}\n`;
          }
        }
        markdown += '\n';
      }
    });
  }

  if (data.settings) {
    markdown += `## Settings\n\n`;
    markdown += `**Auto Save:** ${data.settings.auto_save ? 'Enabled' : 'Disabled'}\n`;
    markdown += `**Show Summaries:** ${data.settings.show_summaries ? 'Enabled' : 'Disabled'}\n`;
    markdown += `**Compact View:** ${data.settings.compact_view ? 'Enabled' : 'Disabled'}\n`;
    if (data.settings.preferred_ai_provider) {
      markdown += `**AI Provider:** ${data.settings.preferred_ai_provider}\n`;
    }
    if (data.settings.preferred_ai_model) {
      markdown += `**AI Model:** ${data.settings.preferred_ai_model}\n`;
    }
    markdown += `**Analysis Depth:** ${data.settings.analysis_depth}\n`;
    markdown += `**Export Format:** ${data.settings.default_export_format}\n`;
  }

  markdown += `\n---\n*Exported on ${new Date().toLocaleDateString()}*`;

  return markdown;
}