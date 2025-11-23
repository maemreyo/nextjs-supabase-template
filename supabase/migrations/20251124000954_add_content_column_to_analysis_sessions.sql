-- Migration: Add content column to analysis_sessions table
-- Description: Add content column to store session content separately from description
-- Version: 1.0
-- Date: 2025-11-24

-- ========================================
-- STEP 1: ADD CONTENT COLUMN TO ANALYSIS_SESSIONS
-- ========================================

ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS content TEXT;

-- ========================================
-- STEP 2: ADD INDEX FOR CONTENT COLUMN
-- ========================================

-- Create full-text search index for content column
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_content_fts 
ON analysis_sessions USING gin(to_tsvector('english', content));

-- ========================================
-- STEP 3: UPDATE VIEWS TO INCLUDE CONTENT COLUMN
-- ========================================

-- Update session_summary view to include content column
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
-- STEP 4: MIGRATE EXISTING DATA (OPTIONAL)
-- ========================================

-- Note: We're not migrating existing description data to content
-- as they serve different purposes:
-- - description: Brief summary of the session
-- - content: Full text content for analysis

-- ========================================
-- STEP 5: GRANT PERMISSIONS
-- ========================================

-- Ensure the view permissions are maintained
GRANT SELECT ON session_summary TO authenticated;

-- Migration completed successfully!