# API Content Route Test Examples

## Overview
API route `src/app/api/sessions/[id]/content/route.ts` đã được cập nhật để hỗ trợ multiple content formats từ TipTap editor.

## Supported Content Formats

### 1. TipTap JSON Format (Primary)
```json
{
  "content_data": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Hello from TipTap editor!"
          }
        ]
      }
    ]
  },
  "content_format": "tiptap"
}
```

### 2. HTML Format (Fallback)
```json
{
  "content_html": "<p>Hello from HTML editor!</p>",
  "content_format": "html"
}
```

### 3. Plain Text Format (Fallback)
```json
{
  "content_plain": "Hello from plain text editor!",
  "content_format": "plain"
}
```

### 4. Legacy Support
```json
{
  "content": "<p>Hello from legacy editor!</p>",
  "content_format": "html"
}
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "content_data": { ... }, // TipTap JSON if available
    "content_html": "<p>...</p>", // HTML content
    "content_plain": "Plain text content", // Plain text content
    "content": "<p>...</p>", // Legacy support
    "content_format": "tiptap", // Primary format used
    "updated_at": "2025-11-24T01:43:00.000Z"
  }
}
```

## Features Implemented

### 1. Multiple Content Format Support
- **TipTap JSON**: Primary format for rich text editing
- **HTML**: Fallback format with formatting preserved
- **Plain Text**: Simple text format for basic editing
- **Legacy**: Backward compatibility with existing HTML-only content

### 2. Automatic Content Conversion
- TipTap JSON → HTML conversion
- TipTap JSON → Plain text conversion
- HTML → Plain text conversion
- Legacy content migration to new formats

### 3. Validation
- TipTap JSON structure validation
- Content format validation
- Required field validation

### 4. Migration Support
- Automatic migration of legacy HTML content to new format structure
- Graceful handling of missing format columns
- Data integrity preservation

### 5. Error Handling
- Comprehensive error responses
- Graceful fallback handling
- Detailed error messages for debugging

## Database Schema Updates

New columns added to `analysis_sessions` table:
- `content_data` (JSONB): TipTap JSON content
- `content_html` (TEXT): HTML content
- `content_plain` (TEXT): Plain text content
- `content_format` (VARCHAR(10)): Format identifier

## Backward Compatibility

- Existing HTML-only content continues to work
- Legacy API responses maintained
- Automatic migration when loading old content
- No breaking changes to existing functionality

## Usage Examples

### Save TipTap Content
```javascript
const response = await fetch('/api/sessions/session-id/content', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content_data: tipTapJsonDocument,
    content_format: 'tiptap'
  })
});
```

### Load Session Content
```javascript
const response = await fetch('/api/sessions/session-id/content', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token'
  }
});

const { data } = await response.json();
// Use data.content_data for TipTap editor
// Fall back to data.content_html or data.content_plain as needed