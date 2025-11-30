# Word Analysis Save Failure - Foreign Key Constraint

## Error
"Failed to save word analysis" 500 POST /api/ai/analyze-word

## Stack/Log Pattern
```
ERROR Word analysis failed {userId, word, error}
```

## Cause
FK violation: document_id references non-existent documents record.

## Solution
1. Check existing word analysis record before insert.
2. Retry logic (3x exponential backoff) for sub-data (synonyms etc.).
3. Detailed dbLogger.error/debug with timing/error.stack.

## Files
- src/app/api/ai/analyze-word/route.ts
- src/lib/ai/ai-service-server.ts::saveWordAnalysis

## Status
Resolved (server-side fix implemented)

## Root Cause
document_id passed to word_analyses insert but missing in documents table (e.g., from unpersisted session/dynamic island).

## Solution
In AIServiceServer.saveWordAnalysis, validate document existence via maybeSingle() and auto-create with upsert() if missing before word_analyses insert.

## Code Snippet
```typescript
// Validate document exists before inserting word analysis
const documentId = request.sessionId
if (documentId) {
  dbLogger.debug('Validating document existence', { documentId, userId })
  
  const { data: existingDocument, error: documentCheckError } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .maybeSingle()
  
  if (!existingDocument || documentCheckError) {
    dbLogger.info('Document not found, creating new document', {
      documentId,
      userId,
      exists: !!existingDocument
    })
    
    // Auto-create document with minimal fields
    const documentData = {
      id: documentId,
      user_id: userId,
      title: `AI Analysis Document for "${analysis.meta.word}"`,
      content: request.sentenceContext || null,
      created_at: new Date().toISOString()
    }
    
    const { data: newDocument, error: documentCreateError } = await supabase
      .from('documents')
      .upsert(documentData)
      .select()
      .single()
    
    if (documentCreateError) {
      dbLogger.error('Failed to create document', {
        documentId,
        userId,
        error: documentCreateError.message,
        errorCode: documentCreateError.code
      })
      throw new Error(`Failed to create document: ${documentCreateError.message}`)
    }
    
    dbLogger.success('Document created successfully', {
      documentId: newDocument.id,
      userId
    })
  }
}
```

## Verification
- Type-check passed
- Prevents FK violation by ensuring document exists before word_analyses insert
- Uses dbLogger for proper tracking per logger.md guidelines

## Prevention
- Client-side: Derive document_id correctly from sessionId; reset state on session change
- Server-side: Auto-create document when missing (implemented)

## Logs
Uses dbLogger for all database operations:
- `dbLogger.debug()` for validation steps
- `dbLogger.info()` for document creation events
- `dbLogger.success()` for successful operations
- `dbLogger.error()` for failures with full context

## Date Fixed
2025-11-29