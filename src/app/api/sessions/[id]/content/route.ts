import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client';
import { generateHTML } from '@tiptap/html/server';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { FontSize } from '@/lib/tiptap-extensions/font-size';
// import { TextStyleWithColor } from '@/lib/tiptap-extensions/text-style-with-color'; // Deprecated
import { apiLogger } from '@/services/logger';

interface UpdateSessionContentRequest {
  // Primary content data (TipTap JSON format)
  content_data?: any; // JSON object from TipTap editor
  // Fallback content formats
  content_html?: string; // HTML format
  content_plain?: string; // Plain text format
  // Legacy support
  content?: string; // HTML content with formatting (backward compatibility)
  text?: string; // Plain text fallback (backward compatibility)
  // Format identifier
  content_format?: 'tiptap' | 'html' | 'plain'; // Primary format type
}

interface UpdateSessionContentResponse {
  success: boolean;
  data?: {
    content_data?: any;
    content_html?: string;
    content_plain?: string;
    content?: string; // Legacy support
    content_format: string;
    updated_at: string;
  };
  error?: string;
}

interface GetSessionContentResponse {
  success: boolean;
  data?: {
    content_data?: any;
    content_html?: string;
    content_plain?: string;
    content?: string; // Legacy support
    content_format: string;
    updated_at: string;
  };
  error?: string;
}

// Helper function to validate TipTap JSON structure
function isValidTipTapJSON(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Basic TipTap document structure validation
  if (data.type !== 'doc') return false;
  if (!Array.isArray(data.content)) return false;
  
  return true;
}

// Helper function to extract plain text from HTML
function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// Helper function to convert TipTap JSON to HTML using TipTap's official HTML generator
function tiptapToHTML(data: any): string {
  if (!isValidTipTapJSON(data)) return '';
  
  apiLogger.debug('Converting TipTap JSON to HTML', {
    dataType: typeof data,
    hasContent: !!data?.content
  });
  
  // Debug textStyle marks to understand fontSize/color serialization
  if (data?.content) {
    const textNodesWithMarks: Array<{text: string, marks: Array<any>}> = [];
    const findTextNodes = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.type === 'text' && node.marks) {
          textNodesWithMarks.push({
            text: node.text,
            marks: node.marks
          });
        }
        if (node.content) {
          findTextNodes(node.content);
        }
      });
    };
    findTextNodes(data.content);
    
    // Log textStyle marks specifically to check fontSize and color
    const textStyleMarks = textNodesWithMarks.flatMap(node =>
      node.marks.filter(mark => mark.type === 'textStyle')
    );
    
    apiLogger.debug('TipTap text nodes with marks', {
      textNodesCount: textNodesWithMarks.length,
      textStyleMarksCount: textStyleMarks.length,
      sampleTextStyleMarks: textStyleMarks.slice(0, 3).map(mark => ({
        type: mark.type,
        attrs: mark.attrs
      })),
      sampleNodes: textNodesWithMarks.slice(0, 3) // Log first 3 nodes for debugging
    });
  }
  
  try {
    // Use TipTap's official HTML generator with the same extensions as the editor
    const html = generateHTML(data, [
      // StarterKit extensions (includes Document, Paragraph, Text, Bold, Italic, Strike, Heading, etc.)
      StarterKit,
      // Additional extensions used in editor
      Underline,
      TextStyle, // Use official TextStyle Mark
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ]);
    
    // Check if HTML contains font-size style
    const hasFontSize = html.includes('font-size:');
    const hasColorStyle = html.includes('color:');
    
    apiLogger.debug('HTML generation results', {
      htmlLength: html.length,
      hasFontSize,
      hasColorStyle,
      htmlPreview: html.substring(0, 300) + '...'
    });
    
    apiLogger.debug('TipTap HTML generation successful', {
      htmlLength: html.length,
      htmlPreview: html.substring(0, 200) + '...'
    });

    return html;
  } catch (error) {
    apiLogger.error('Failed to convert TipTap JSON to HTML', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return '';
  }
}

// Helper function to convert TipTap JSON to plain text
function tiptapToPlainText(data: any): string {
  if (!isValidTipTapJSON(data)) return '';
  
  try {
    const renderNode = (node: any): string => {
      if (!node) return '';
      
      switch (node.type) {
        case 'doc':
          return node.content?.map(renderNode).join('\n') || '';
        case 'paragraph':
          return `${node.content?.map(renderNode).join('') || ''}\n`;
        case 'text':
          return node.text || '';
        case 'bold':
        case 'italic':
        case 'underline':
          return node.content?.map(renderNode).join('') || '';
        case 'heading':
          return `${node.content?.map(renderNode).join('') || ''}\n`;
        case 'bulletList':
        case 'orderedList':
          return node.content?.map(renderNode).join('') || '';
        case 'listItem':
          return `• ${node.content?.map(renderNode).join('') || ''}\n`;
        default:
          return node.content?.map(renderNode).join('') || '';
      }
    };
    
    return renderNode(data).trim();
  } catch (error) {
    apiLogger.error('Failed to convert TipTap JSON to plain text', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return '';
  }
}

// PATCH /api/sessions/[id]/content - Update session content
export const PATCH = withAuth(
  async (request, { user, supabase, params }) => {
    apiLogger.start('Handling PATCH /api/sessions/[id]/content', {
      userId: user.id,
      sessionId: params.id,
      timestamp: new Date().toISOString()
    })
    
    // Parse request body
    const body: UpdateSessionContentRequest = await request.json();
    
    apiLogger.info('Session content update request', {
      userId: user.id,
      sessionId: params.id,
      hasContentData: !!body.content_data,
      hasContentHTML: !!body.content_html,
      hasContentPlain: !!body.content_plain,
      contentFormat: body.content_format
    });


    // Validate that at least one content format is provided
    const hasContent = body.content_data || body.content_html || body.content_plain || body.content;
    if (!hasContent) {
      apiLogger.warn('No content provided in session update request', {
        userId: user.id,
        sessionId: params.id
      });
      
      return createErrorResponse('At least one content format is required', 400);
    }

    // Validate TipTap JSON if provided
    if (body.content_data && !isValidTipTapJSON(body.content_data)) {
      apiLogger.warn('Invalid TipTap JSON structure provided', {
        userId: user.id,
        sessionId: params.id
      });
      
      return createErrorResponse('Invalid TipTap JSON structure', 400);
    }

    const { id: sessionId } = params;

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Determine content format and prepare update data
    let contentFormat = body.content_format || 'html';
    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle different content formats
    if (body.content_data) {
      // TipTap JSON format (primary)
      contentFormat = 'tiptap';
      updateData.content_data = body.content_data;
      updateData.content_html = tiptapToHTML(body.content_data);
      updateData.content_plain = tiptapToPlainText(body.content_data);
      updateData.content_format = contentFormat;
    } else if (body.content_html) {
      // HTML format
      contentFormat = 'html';
      updateData.content_html = body.content_html;
      updateData.content_plain = htmlToPlainText(body.content_html);
      updateData.content_format = contentFormat;
    } else if (body.content_plain) {
      // Plain text format
      contentFormat = 'plain';
      updateData.content_plain = body.content_plain;
      updateData.content_format = contentFormat;
    } else if (body.content) {
      // Legacy support - HTML content
      contentFormat = 'html';
      updateData.content = body.content; // Keep legacy field for backward compatibility
      updateData.content_html = body.content;
      updateData.content_plain = htmlToPlainText(body.content);
      updateData.content_format = contentFormat;
    }

    // Update session with all content formats
    const { data: updatedSession, error: updateError } = await supabase
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      apiLogger.error('Failed to update session content', {
        userId: user.id,
        sessionId: params.id,
        error: updateError.message
      });

      return createErrorResponse('Failed to update session content', 500);
    }



    // Prepare response data
    const responseData: any = {
      content_format: contentFormat,
      updated_at: updatedSession.updated_at || new Date().toISOString(),
    };

    // Include all available content formats in response
    if (updatedSession.content_data) responseData.content_data = updatedSession.content_data;
    if (updatedSession.content_html) responseData.content_html = updatedSession.content_html;
    if (updatedSession.content_plain) responseData.content_plain = updatedSession.content_plain;
    if (updatedSession.content) responseData.content = updatedSession.content; // Legacy support

    apiLogger.success('Session content updated successfully', {
      userId: user.id,
      sessionId: params.id,
      contentFormat
    });
    
    return createSuccessResponse(responseData);
  }
);

// GET /api/sessions/[id]/content - Get session content
export const GET = withAuth(
  async (request, { user, supabase, params }) => {
    const { id: sessionId } = params;
    
    apiLogger.start('Handling GET /api/sessions/[id]/content', {
      userId: user.id,
      sessionId,
      timestamp: new Date().toISOString()
    })

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
    }

    // Get session content with all format columns
    const { data: session, error: fetchError } = await supabase
      .from('analysis_sessions')
      .select('content, content_data, content_html, content_plain, content_format, updated_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      apiLogger.error('Session not found or access denied', {
        userId: user.id,
        sessionId,
        error: fetchError.message
      });

      return createErrorResponse('Session not found or access denied', 404);
    }

    // Handle migration for old content format
    let responseData: any = {
      content_format: session.content_format || 'html',
      updated_at: session.updated_at || new Date().toISOString(),
    };

    // If we have new format columns, use them
    if (session.content_data || session.content_html || session.content_plain) {
      if (session.content_data) responseData.content_data = session.content_data;
      if (session.content_html) responseData.content_html = session.content_html;
      if (session.content_plain) responseData.content_plain = session.content_plain;
    } else if (session.content) {
      // Legacy support - migrate old content to new format
      responseData.content = session.content;
      responseData.content_html = session.content;
      responseData.content_plain = htmlToPlainText(session.content);
      
      // Optionally update the database with migrated formats
      try {
        await supabase
          .from('analysis_sessions')
          .update({
            content_html: session.content,
            content_plain: htmlToPlainText(session.content),
            content_format: 'html'
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);
      } catch (migrationError) {
        apiLogger.error('Failed to migrate legacy content format', {
          userId: user.id,
          sessionId,
          error: migrationError instanceof Error ? migrationError.message : 'Unknown error'
        });
        
        // Don't fail the request if migration fails
      }
    }

    apiLogger.success('Session content retrieved successfully', {
      userId: user.id,
      sessionId,
      contentFormat: responseData.content_format
    });
    
    return createSuccessResponse(responseData);
  }
);