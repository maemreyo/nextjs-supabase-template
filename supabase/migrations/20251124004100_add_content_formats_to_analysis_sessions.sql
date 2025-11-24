-- Migration: Add content format columns to analysis_sessions table
-- Description: Add columns to support multiple content formats (TipTap JSON, HTML, plain text)
-- Version: 1.0
-- Date: 2025-11-24

-- ========================================
-- STEP 1: ADD CONTENT FORMAT COLUMNS
-- ========================================

-- Add content_data column for TipTap JSON format (primary)
ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS content_data JSONB;

-- Add content_html column for HTML format (fallback)
ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Add content_plain column for plain text format (fallback)
ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS content_plain TEXT;

-- Add content_format column to track which format is primary
ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS content_format VARCHAR(10) DEFAULT 'html' CHECK (content_format IN ('tiptap', 'html', 'plain'));

-- ========================================
-- STEP 2: ADD INDEXES FOR NEW COLUMNS
-- ========================================

-- Create GIN index for JSONB content_data column
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_content_data_gin 
ON analysis_sessions USING gin(content_data);

-- Create full-text search index for content_html column
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_content_html_fts 
ON analysis_sessions USING gin(to_tsvector('english', content_html));

-- Create full-text search index for content_plain column
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_content_plain_fts 
ON analysis_sessions USING gin(to_tsvector('english', content_plain));

-- Create index for content_format column
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_content_format 
ON analysis_sessions(content_format);

-- ========================================
-- STEP 3: UPDATE VIEWS TO INCLUDE NEW COLUMNS
-- ========================================

-- Update session_summary view to include new content columns
DROP VIEW IF EXISTS session_summary;

CREATE OR REPLACE VIEW session_summary AS
SELECT 
  s.*,
  COUNT(sa.id) as actual_analyses_count,
  COUNT(CASE WHEN sa.analysis_type = 'word' THEN 1 END) as actual_word_count,
  COUNT(CASE WHEN sa.analysis_type = 'sentence' THEN 1 END) as actual_sentence_count,
  COUNT(CASE WHEN sa.analysis_type = 'paragraph' THEN 1 END) as actual_paragraph_count,
  ARRAY_AGG(DISTINCT t.tag_name) as tags
FROM analysis_sessions s
LEFT JOIN session_analyses sa ON s.id = sa.session_id
LEFT JOIN session_tag_relations str ON s.id = str.session_id
LEFT JOIN session_tags t ON str.tag_id = t.id
WHERE s.status != 'deleted'
GROUP BY s.id
ORDER BY s.last_accessed_at DESC;

-- ========================================
-- STEP 4: MIGRATE EXISTING DATA
-- ========================================

-- Migrate existing content to new format structure
-- For existing records with content, treat as HTML format
UPDATE analysis_sessions
SET
  content_html = content,
  content_plain = CASE
    WHEN content IS NOT NULL THEN
      -- Simple HTML to text conversion (basic approach)
      REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(content, '<[^>]+>', '', 'g'), '&nbsp;', ' ', 'g'), '\s+', ' ', 'g')
    ELSE NULL
  END,
  content_format = 'html'
WHERE content IS NOT NULL
  AND content_data IS NULL
  AND content_html IS NULL
  AND content_plain IS NULL;

-- Handle records with no content at all - set empty string to content_plain
UPDATE analysis_sessions
SET
  content_plain = '',
  content_format = 'plain'
WHERE content_data IS NULL
  AND content_html IS NULL
  AND content_plain IS NULL
  AND content IS NULL;

-- ========================================
-- STEP 5: ADD CONSTRAINTS
-- ========================================

-- Add constraint to ensure at least one content format is present
-- Note: CHECK constraints cannot be DEFERRABLE in PostgreSQL
ALTER TABLE analysis_sessions
ADD CONSTRAINT chk_at_least_one_content_format
CHECK (
  (content_data IS NOT NULL) OR
  (content_html IS NOT NULL) OR
  (content_plain IS NOT NULL) OR
  (content IS NOT NULL)
);

-- ========================================
-- STEP 6: GRANT PERMISSIONS
-- ========================================

-- Ensure the view permissions are maintained
GRANT SELECT ON session_summary TO authenticated;

-- Migration completed successfully!