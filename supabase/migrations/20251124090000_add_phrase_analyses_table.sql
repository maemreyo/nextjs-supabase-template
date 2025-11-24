-- Migration: Add Phrase Analyses Table
-- Description: Create table for phrase analysis with rich fields
-- Version: 1.0
-- Date: 2025-11-24

-- ========================================
-- STEP 1: CREATE PHRASE_ANALYSES TABLE
-- ========================================

CREATE TABLE phrase_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meta information
  phrase TEXT NOT NULL,
  phrase_type TEXT CHECK (phrase_type IN ('idiom', 'collocation', 'phrasal_verb', 'proverb', 'expression', 'other')),
  complexity_level TEXT CHECK (complexity_level IN ('Basic', 'Intermediate', 'Advanced')),
  
  -- Meaning and Translation
  literal_meaning TEXT,
  contextual_meaning TEXT,
  vietnamese_translation TEXT,
  natural_translation TEXT,
  
  -- Usage Context
  register_level TEXT CHECK (register_level IN ('formal', 'neutral', 'informal', 'slang')),
  frequency_level TEXT CHECK (frequency_level IN ('very_common', 'common', 'uncommon', 'rare')),
  
  -- Grammatical Information
  grammatical_pattern TEXT,
  part_of_speech TEXT,
  structure_breakdown JSONB, -- Array of components with their roles
  
  -- Contextual Information
  sentence_context TEXT,
  paragraph_context TEXT,
  usage_examples TEXT[], -- Array of example sentences
  example_translations TEXT[], -- Array of corresponding translations
  
  -- Cultural and Stylistic Notes
  cultural_notes TEXT,
  stylistic_notes TEXT,
  register_explanation TEXT,
  
  -- Related Expressions
  synonyms TEXT[], -- Similar expressions
  antonyms TEXT[], -- Opposite expressions
  variations TEXT[], -- Different variations of the phrase
  
  -- Learning Aids
  memory_aid TEXT, -- Mnemonic or memory tip
  common_mistakes TEXT[], -- Common errors learners make
  usage_tips TEXT[], -- Tips for correct usage
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 2: CREATE INDEXES
-- ========================================

-- Basic indexes
CREATE INDEX idx_phrase_analyses_document_id ON phrase_analyses(document_id);
CREATE INDEX idx_phrase_analyses_user_id ON phrase_analyses(user_id);
CREATE INDEX idx_phrase_analyses_phrase ON phrase_analyses(phrase);
CREATE INDEX idx_phrase_analyses_phrase_type ON phrase_analyses(phrase_type);
CREATE INDEX idx_phrase_analyses_complexity ON phrase_analyses(complexity_level);
CREATE INDEX idx_phrase_analyses_register ON phrase_analyses(register_level);
CREATE INDEX idx_phrase_analyses_frequency ON phrase_analyses(frequency_level);

-- Full-text search indexes
CREATE INDEX idx_phrase_analyses_phrase_fts ON phrase_analyses USING gin(to_tsvector('english', phrase));
CREATE INDEX idx_phrase_analyses_literal_meaning_fts ON phrase_analyses USING gin(to_tsvector('english', literal_meaning));
CREATE INDEX idx_phrase_analyses_contextual_meaning_fts ON phrase_analyses USING gin(to_tsvector('english', contextual_meaning));

-- Composite indexes
CREATE INDEX idx_phrase_analyses_document_phrase ON phrase_analyses(document_id, phrase);
CREATE INDEX idx_phrase_analyses_user_type ON phrase_analyses(user_id, phrase_type);
CREATE INDEX idx_phrase_analyses_type_complexity ON phrase_analyses(phrase_type, complexity_level);

-- ========================================
-- STEP 3: UPDATE SESSION_ANALYSES CHECK CONSTRAINT
-- ========================================

-- Drop existing check constraint
ALTER TABLE session_analyses DROP CONSTRAINT IF EXISTS session_analyses_analysis_type_check;

-- Add new check constraint that includes 'phrase'
ALTER TABLE session_analyses 
ADD CONSTRAINT session_analyses_analysis_type_check 
CHECK (analysis_type = ANY (ARRAY['word'::text, 'sentence'::text, 'paragraph'::text, 'phrase'::text]));

-- ========================================
-- STEP 4: UPDATE ANALYSIS_SESSIONS TABLE
-- ========================================

-- Add phrase_analyses_count column if it doesn't exist
ALTER TABLE analysis_sessions 
ADD COLUMN IF NOT EXISTS phrase_analyses_count INTEGER DEFAULT 0;

-- ========================================
-- STEP 5: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE phrase_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own phrase analyses"
  ON phrase_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create phrase analyses"
  ON phrase_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own phrase analyses"
  ON phrase_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own phrase analyses"
  ON phrase_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- STEP 6: CREATE TRIGGER FOR UPDATED_AT
-- ========================================

CREATE TRIGGER phrase_analyses_updated_at
  BEFORE UPDATE ON phrase_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ========================================
-- STEP 7: VERIFICATION QUERIES (COMMENTED)
-- ========================================

-- Verify table creation
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name = 'phrase_analyses';

-- Check RLS policies
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename = 'phrase_analyses';

-- Migration completed successfully!