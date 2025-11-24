import DOMPurify from 'dompurify';

/**
 * Content Sanitizer Utility
 * Provides XSS protection and content sanitization for user-generated content
 */

// Default configuration for DOMPurify
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'a', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'style'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'],
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The HTML content to sanitize
 * @param config - Optional custom configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(content: string, config?: Partial<typeof DEFAULT_CONFIG>): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  try {
    const sanitizeConfig = { ...DEFAULT_CONFIG, ...config };
    return DOMPurify.sanitize(content, sanitizeConfig);
  } catch (error) {
    console.error('Error sanitizing HTML content:', error);
    // Return empty string if sanitization fails
    return '';
  }
}

/**
 * Sanitizes plain text content
 * @param content - The text content to sanitize
 * @returns Sanitized text string
 */
export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  try {
    // Remove potentially dangerous characters and normalize whitespace
    return content
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Additional control characters
      .replace(/[\uFFFE\uFFFF]/g, '') // Invalid Unicode characters
      .trim();
  } catch (error) {
    console.error('Error sanitizing text content:', error);
    return '';
  }
}

/**
 * Sanitizes URL to prevent XSS through malicious URLs
 * @param url - The URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Basic URL validation
    const urlObj = new URL(url, window.location.origin);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }

    // Remove potential XSS vectors
    return urlObj.toString()
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');
  } catch (error) {
    console.error('Error sanitizing URL:', error);
    return '';
  }
}

/**
 * Sanitizes JSON content to prevent injection attacks
 * @param content - The JSON string to sanitize
 * @returns Sanitized JSON string or null if invalid
 */
export function sanitizeJSON(content: string): string | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  try {
    // Parse and stringify to validate JSON structure
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error('Error sanitizing JSON content:', error);
    return null;
  }
}

/**
 * Sanitizes content specifically for TipTap editor
 * @param content - The TipTap content to sanitize
 * @returns Sanitized content safe for TipTap
 */
export function sanitizeTipTapContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  try {
    // TipTap-specific sanitization with more permissive config for rich text
    const tipTapConfig = {
      ...DEFAULT_CONFIG,
      ALLOWED_TAGS: [
        ...DEFAULT_CONFIG.ALLOWED_TAGS,
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'small', 'sub', 'sup', 'mark', 'del', 'ins'
      ],
      ALLOWED_ATTR: [
        ...DEFAULT_CONFIG.ALLOWED_ATTR,
        'colspan', 'rowspan', 'align', 'valign', 'width', 'height'
      ]
    };

    return DOMPurify.sanitize(content, tipTapConfig);
  } catch (error) {
    console.error('Error sanitizing TipTap content:', error);
    return '';
  }
}

/**
 * Validates and sanitizes user input for analysis operations
 * @param input - The user input to validate
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and validated input
 */
export function sanitizeAnalysisInput(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Apply text sanitization
  const sanitized = sanitizeText(input);
  
  // Enforce length limits
  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Creates a safe HTML string with proper escaping
 * @param content - The content to escape
 * @returns Escaped HTML string
 */
export function escapeHTML(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

/**
 * Validates if content contains potentially dangerous patterns
 * @param content - The content to validate
 * @returns True if content is safe, false otherwise
 */
export function isContentSafe(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return true;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Comprehensive content validation and sanitization
 * @param content - The content to validate and sanitize
 * @param options - Sanitization options
 * @returns Object with sanitized content and validation result
 */
export function validateAndSanitizeContent(
  content: string,
  options: {
    type?: 'html' | 'text' | 'json' | 'url' | 'tiptap';
    maxLength?: number;
    allowEmpty?: boolean;
  } = {}
): {
  sanitized: string;
  isValid: boolean;
  errors: string[];
} {
  const { type = 'text', maxLength = 10000, allowEmpty = true } = options;
  const errors: string[] = [];

  // Check if empty content is allowed
  if (!content || content.trim() === '') {
    if (!allowEmpty) {
      errors.push('Content cannot be empty');
    }
    return {
      sanitized: '',
      isValid: errors.length === 0,
      errors
    };
  }

  // Check length
  if (content.length > maxLength) {
    errors.push(`Content exceeds maximum length of ${maxLength} characters`);
  }

  let sanitized = '';
  
  try {
    switch (type) {
      case 'html':
        sanitized = sanitizeHTML(content);
        break;
      case 'json':
        sanitized = sanitizeJSON(content) || '';
        break;
      case 'url':
        sanitized = sanitizeURL(content);
        break;
      case 'tiptap':
        sanitized = sanitizeTipTapContent(content);
        break;
      case 'text':
      default:
        sanitized = sanitizeText(content);
        break;
    }
  } catch (error) {
    errors.push('Failed to sanitize content');
    sanitized = '';
  }

  // Additional safety check
  if (!isContentSafe(sanitized)) {
    errors.push('Content contains potentially dangerous elements');
    sanitized = '';
  }

  return {
    sanitized,
    isValid: errors.length === 0,
    errors
  };
}

// Export default configuration for external use
export { DEFAULT_CONFIG };