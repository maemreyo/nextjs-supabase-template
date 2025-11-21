-- Migration: Session Management System
-- Description: Create tables for analysis sessions, session analyses, and session settings
-- Version: 1.0
-- Date: 2025-11-21

-- ========================================
-- STEP 1: CREATE ANALYSIS SESSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session information
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('word', 'sentence', 'paragraph', 'mixed')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Session metadata
  total_analyses INTEGER DEFAULT 0,
  word_analyses_count INTEGER DEFAULT 0,
  sentence_analyses_count INTEGER DEFAULT 0,
  paragraph_analyses_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 2: CREATE SESSION ANALYSES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS session_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analysis reference
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('word', 'sentence', 'paragraph')),
  analysis_id UUID NOT NULL, -- References word_analyses, sentence_analyses, or paragraph_analyses
  
  -- Analysis metadata
  analysis_title TEXT,
  analysis_summary TEXT,
  analysis_data JSONB, -- Store key analysis data for quick access
  
  -- Position/order in session
  position INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE SESSION SETTINGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS session_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Display settings
  auto_save BOOLEAN DEFAULT true,
  show_summaries BOOLEAN DEFAULT true,
  compact_view BOOLEAN DEFAULT false,
  
  -- Analysis settings
  preferred_ai_provider TEXT,
  preferred_ai_model TEXT,
  analysis_depth TEXT DEFAULT 'standard' CHECK (analysis_depth IN ('basic', 'standard', 'detailed')),
  
  -- Export settings
  default_export_format TEXT DEFAULT 'json' CHECK (default_export_format IN ('json', 'pdf', 'markdown', 'csv')),
  include_metadata BOOLEAN DEFAULT true,
  
  -- Notification settings
  email_notifications BOOLEAN DEFAULT false,
  session_reminders BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id)
);

-- ========================================
-- STEP 4: CREATE SESSION TAGS TABLE (for categorization)
-- ========================================

CREATE TABLE IF NOT EXISTS session_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT '#3B82F6', -- Default blue color
  tag_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tag_name)
);

-- ========================================
-- STEP 5: CREATE SESSION TAG RELATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS session_tag_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES session_tags(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, tag_id)
);

-- ========================================
-- STEP 6: CREATE INDEXES
-- ========================================

-- Indexes for analysis_sessions
CREATE INDEX idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX idx_analysis_sessions_status ON analysis_sessions(status);
CREATE INDEX idx_analysis_sessions_session_type ON analysis_sessions(session_type);
CREATE INDEX idx_analysis_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX idx_analysis_sessions_updated_at ON analysis_sessions(updated_at DESC);
CREATE INDEX idx_analysis_sessions_last_accessed_at ON analysis_sessions(last_accessed_at DESC);
CREATE INDEX idx_analysis_sessions_user_status ON analysis_sessions(user_id, status);
CREATE INDEX idx_analysis_sessions_title_fts ON analysis_sessions USING gin(to_tsvector('english', title));
CREATE INDEX idx_analysis_sessions_description_fts ON analysis_sessions USING gin(to_tsvector('english', description));

-- Indexes for session_analyses
CREATE INDEX idx_session_analyses_session_id ON session_analyses(session_id);
CREATE INDEX idx_session_analyses_user_id ON session_analyses(user_id);
CREATE INDEX idx_session_analyses_analysis_type ON session_analyses(analysis_type);
CREATE INDEX idx_session_analyses_analysis_id ON session_analyses(analysis_id);
CREATE INDEX idx_session_analyses_position ON session_analyses(position);
CREATE INDEX idx_session_analyses_created_at ON session_analyses(created_at DESC);
CREATE INDEX idx_session_analyses_session_type ON session_analyses(session_id, analysis_type);
CREATE INDEX idx_session_analyses_analysis_title_fts ON session_analyses USING gin(to_tsvector('english', analysis_title));

-- Indexes for session_settings
CREATE INDEX idx_session_settings_session_id ON session_settings(session_id);
CREATE INDEX idx_session_settings_user_id ON session_settings(user_id);

-- Indexes for session_tags
CREATE INDEX idx_session_tags_user_id ON session_tags(user_id);
CREATE INDEX idx_session_tags_tag_name ON session_tags(tag_name);
CREATE INDEX idx_session_tags_created_at ON session_tags(created_at DESC);

-- Indexes for session_tag_relations
CREATE INDEX idx_session_tag_relations_session_id ON session_tag_relations(session_id);
CREATE INDEX idx_session_tag_relations_tag_id ON session_tag_relations(tag_id);

-- ========================================
-- STEP 7: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tag_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_sessions
CREATE POLICY "Users view own sessions"
  ON analysis_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create sessions"
  ON analysis_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON analysis_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own sessions"
  ON analysis_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for session_analyses
CREATE POLICY "Users view own session analyses"
  ON session_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create session analyses"
  ON session_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own session analyses"
  ON session_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own session analyses"
  ON session_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for session_settings
CREATE POLICY "Users view own session settings"
  ON session_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create session settings"
  ON session_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own session settings"
  ON session_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own session settings"
  ON session_settings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for session_tags
CREATE POLICY "Users view own tags"
  ON session_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create tags"
  ON session_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tags"
  ON session_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tags"
  ON session_tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for session_tag_relations
CREATE POLICY "Users view own session tag relations"
  ON session_tag_relations FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM analysis_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create session tag relations"
  ON session_tag_relations FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM analysis_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own session tag relations"
  ON session_tag_relations FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM analysis_sessions WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- STEP 8: CREATE TRIGGERS
-- ========================================

-- Apply updated_at triggers
CREATE TRIGGER analysis_sessions_updated_at
  BEFORE UPDATE ON analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER session_analyses_updated_at
  BEFORE UPDATE ON session_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER session_settings_updated_at
  BEFORE UPDATE ON session_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER session_tags_updated_at
  BEFORE UPDATE ON session_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to update session statistics when analyses are added/removed
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update total analyses count
    UPDATE analysis_sessions 
    SET 
      total_analyses = total_analyses + 1,
      word_analyses_count = CASE 
        WHEN NEW.analysis_type = 'word' THEN word_analyses_count + 1 
        ELSE word_analyses_count 
      END,
      sentence_analyses_count = CASE 
        WHEN NEW.analysis_type = 'sentence' THEN sentence_analyses_count + 1 
        ELSE sentence_analyses_count 
      END,
      paragraph_analyses_count = CASE 
        WHEN NEW.analysis_type = 'paragraph' THEN paragraph_analyses_count + 1 
        ELSE paragraph_analyses_count 
      END,
      updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update total analyses count
    UPDATE analysis_sessions 
    SET 
      total_analyses = GREATEST(total_analyses - 1, 0),
      word_analyses_count = GREATEST(
        CASE 
          WHEN OLD.analysis_type = 'word' THEN word_analyses_count - 1 
          ELSE word_analyses_count 
        END, 0
      ),
      sentence_analyses_count = GREATEST(
        CASE 
          WHEN OLD.analysis_type = 'sentence' THEN sentence_analyses_count - 1 
          ELSE sentence_analyses_count 
        END, 0
      ),
      paragraph_analyses_count = GREATEST(
        CASE 
          WHEN OLD.analysis_type = 'paragraph' THEN paragraph_analyses_count - 1 
          ELSE paragraph_analyses_count 
        END, 0
      ),
      updated_at = NOW()
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
CREATE TRIGGER update_session_statistics_trigger
  AFTER INSERT OR DELETE ON session_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_session_statistics();

-- Function to update last_accessed_at when session is accessed
CREATE OR REPLACE FUNCTION update_last_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analysis_sessions 
  SET last_accessed_at = NOW()
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for session_analyses
CREATE TRIGGER update_session_last_accessed_at_analyses
  AFTER INSERT OR UPDATE ON session_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_last_accessed_at();

-- ========================================
-- STEP 9: CREATE VIEWS FOR COMMON QUERIES
-- ========================================

-- View for sessions with analysis counts
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

-- View for recent analyses across all sessions
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
  sa.*,
  s.title as session_title,
  s.session_type,
  s.status as session_status
FROM session_analyses sa
JOIN analysis_sessions s ON sa.session_id = s.id
WHERE s.status = 'active'
ORDER BY sa.created_at DESC;

-- ========================================
-- STEP 10: INSERT DEFAULT DATA
-- ========================================

-- Note: Default tags will be created when users create their first session
-- This is handled by the application logic, not in migrations

-- Grant permissions
GRANT SELECT ON session_summary TO authenticated;
GRANT SELECT ON recent_analyses TO authenticated;

-- Migration completed successfully!