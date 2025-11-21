-- Migration: Vocabulary System
-- Description: Create tables for vocabulary words, word contexts, and vocabulary collections
-- Version: 1.0
-- Date: 2025-11-21

-- ========================================
-- STEP 1: CREATE VOCABULARY WORDS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Word information
  word TEXT NOT NULL,
  ipa TEXT,
  part_of_speech TEXT CHECK (part_of_speech IN ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'determiner', 'exclamation')),
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  
  -- Definitions and translations
  definition_en TEXT,
  definition_vi TEXT,
  vietnamese_translation TEXT,
  
  -- Context and usage
  example_sentence TEXT,
  example_translation TEXT,
  context_notes TEXT,
  
  -- Learning metadata
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  
  -- Word origin and etymology
  origin TEXT,
  etymology TEXT,
  
  -- Audio and pronunciation
  audio_url TEXT,
  
  -- Visual aids
  image_url TEXT,
  
  -- Personal notes
  personal_notes TEXT,
  
  -- Source information
  source_type TEXT CHECK (source_type IN ('manual', 'analysis', 'import', 'suggestion')),
  source_reference TEXT, -- Can reference analysis_id or import source
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, word)
);

-- ========================================
-- STEP 2: CREATE VOCABULARY CONTEXTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Context information
  context_type TEXT NOT NULL CHECK (context_type IN ('sentence', 'paragraph', 'dialogue', 'book', 'article', 'movie', 'conversation')),
  context_text TEXT NOT NULL,
  
  -- Source information
  source_title TEXT,
  source_author TEXT,
  source_url TEXT,
  source_page_number INTEGER,
  
  -- Translation
  context_translation TEXT,
  
  -- Personal notes about this context
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE VOCABULARY COLLECTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collection information
  name TEXT NOT NULL,
  description TEXT,
  collection_type TEXT DEFAULT 'custom' CHECK (collection_type IN ('custom', 'topic', 'difficulty', 'cefr_level', 'frequency')),
  
  -- Collection metadata
  color TEXT DEFAULT '#3B82F6', -- Default blue color
  icon TEXT DEFAULT 'book',
  is_public BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false, -- For system-created collections
  
  -- Learning settings
  practice_enabled BOOLEAN DEFAULT true,
  review_interval_days INTEGER DEFAULT 7,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Statistics
  word_count INTEGER DEFAULT 0,
  mastered_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- ========================================
-- STEP 4: CREATE VOCABULARY WORD COLLECTIONS TABLE (JUNCTION)
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_word_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES vocabulary_collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_manually BOOLEAN DEFAULT true, -- false if added automatically
  
  UNIQUE(vocabulary_word_id, collection_id)
);

-- ========================================
-- STEP 5: CREATE VOCABULARY SYNONYMS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Synonym information
  synonym_word TEXT NOT NULL,
  synonym_ipa TEXT,
  synonym_definition TEXT,
  synonym_translation TEXT,
  
  -- Context difference
  context_difference TEXT, -- How this synonym differs in usage
  
  -- Frequency and commonality
  frequency_level TEXT CHECK (frequency_level IN ('very_common', 'common', 'uncommon', 'rare')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vocabulary_word_id, synonym_word)
);

-- ========================================
-- STEP 6: CREATE VOCABULARY ANTONYMS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_antonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Antonym information
  antonym_word TEXT NOT NULL,
  antonym_ipa TEXT,
  antonym_definition TEXT,
  antonym_translation TEXT,
  
  -- Context explanation
  context_explanation TEXT, -- How these words are opposites
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vocabulary_word_id, antonym_word)
);

-- ========================================
-- STEP 7: CREATE VOCABULARY COLLOCATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_collocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collocation information
  phrase TEXT NOT NULL,
  collocation_type TEXT CHECK (collocation_type IN ('adjective + noun', 'noun + noun', 'verb + noun', 'adverb + adjective', 'verb + adverb', 'preposition + noun')),
  
  -- Meaning and usage
  meaning TEXT,
  usage_example TEXT,
  usage_translation TEXT,
  
  -- Frequency and register
  frequency_level TEXT CHECK (frequency_level IN ('very_common', 'common', 'uncommon', 'rare')),
  register_level TEXT CHECK (register_level IN ('formal', 'neutral', 'informal', 'slang')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vocabulary_word_id, phrase)
);

-- ========================================
-- STEP 8: CREATE VOCABULARY PRACTICE SESSIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session information
  session_type TEXT NOT NULL CHECK (session_type IN ('flashcard', 'quiz', 'spelling', 'matching', 'writing')),
  collection_id UUID REFERENCES vocabulary_collections(id) ON DELETE SET NULL,
  
  -- Session configuration
  word_count INTEGER NOT NULL,
  time_limit_seconds INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'mixed')),
  
  -- Session results
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2),
  time_spent_seconds INTEGER,
  
  -- Session status
  status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 9: CREATE VOCABULARY PRACTICE RESULTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS vocabulary_practice_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_session_id UUID REFERENCES vocabulary_practice_sessions(id) ON DELETE CASCADE,
  vocabulary_word_id UUID REFERENCES vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Question information
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  
  -- Result information
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  
  -- Learning impact
  mastery_before INTEGER,
  mastery_after INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 10: CREATE INDEXES
-- ========================================

-- Indexes for vocabulary_words
CREATE INDEX idx_vocabulary_words_user_id ON vocabulary_words(user_id);
CREATE INDEX idx_vocabulary_words_word ON vocabulary_words(word);
CREATE INDEX idx_vocabulary_words_part_of_speech ON vocabulary_words(part_of_speech);
CREATE INDEX idx_vocabulary_words_cefr_level ON vocabulary_words(cefr_level);
CREATE INDEX idx_vocabulary_words_difficulty_level ON vocabulary_words(difficulty_level);
CREATE INDEX idx_vocabulary_words_mastery_level ON vocabulary_words(mastery_level);
CREATE INDEX idx_vocabulary_words_next_review_at ON vocabulary_words(next_review_at);
CREATE INDEX idx_vocabulary_words_status ON vocabulary_words(status);
CREATE INDEX idx_vocabulary_words_source_type ON vocabulary_words(source_type);
CREATE INDEX idx_vocabulary_words_created_at ON vocabulary_words(created_at DESC);
CREATE INDEX idx_vocabulary_words_updated_at ON vocabulary_words(updated_at DESC);
CREATE INDEX idx_vocabulary_words_word_fts ON vocabulary_words USING gin(to_tsvector('english', word));
CREATE INDEX idx_vocabulary_words_definition_en_fts ON vocabulary_words USING gin(to_tsvector('english', definition_en));
CREATE INDEX idx_vocabulary_words_definition_vi_fts ON vocabulary_words USING gin(to_tsvector('english', definition_vi));
CREATE INDEX idx_vocabulary_words_user_cefr ON vocabulary_words(user_id, cefr_level);
CREATE INDEX idx_vocabulary_words_user_mastery ON vocabulary_words(user_id, mastery_level);
CREATE INDEX idx_vocabulary_words_user_next_review ON vocabulary_words(user_id, next_review_at);

-- Indexes for vocabulary_contexts
CREATE INDEX idx_vocabulary_contexts_vocabulary_word_id ON vocabulary_contexts(vocabulary_word_id);
CREATE INDEX idx_vocabulary_contexts_user_id ON vocabulary_contexts(user_id);
CREATE INDEX idx_vocabulary_contexts_context_type ON vocabulary_contexts(context_type);
CREATE INDEX idx_vocabulary_contexts_created_at ON vocabulary_contexts(created_at DESC);
CREATE INDEX idx_vocabulary_contexts_context_text_fts ON vocabulary_contexts USING gin(to_tsvector('english', context_text));

-- Indexes for vocabulary_collections
CREATE INDEX idx_vocabulary_collections_user_id ON vocabulary_collections(user_id);
CREATE INDEX idx_vocabulary_collections_collection_type ON vocabulary_collections(collection_type);
CREATE INDEX idx_vocabulary_collections_status ON vocabulary_collections(status);
CREATE INDEX idx_vocabulary_collections_is_public ON vocabulary_collections(is_public);
CREATE INDEX idx_vocabulary_collections_is_default ON vocabulary_collections(is_default);
CREATE INDEX idx_vocabulary_collections_created_at ON vocabulary_collections(created_at DESC);
CREATE INDEX idx_vocabulary_collections_name_fts ON vocabulary_collections USING gin(to_tsvector('english', name));

-- Indexes for vocabulary_word_collections
CREATE INDEX idx_vocabulary_word_collections_vocabulary_word_id ON vocabulary_word_collections(vocabulary_word_id);
CREATE INDEX idx_vocabulary_word_collections_collection_id ON vocabulary_word_collections(collection_id);
CREATE INDEX idx_vocabulary_word_collections_user_id ON vocabulary_word_collections(user_id);
CREATE INDEX idx_vocabulary_word_collections_added_at ON vocabulary_word_collections(added_at DESC);

-- Indexes for vocabulary_synonyms
CREATE INDEX idx_vocabulary_synonyms_vocabulary_word_id ON vocabulary_synonyms(vocabulary_word_id);
CREATE INDEX idx_vocabulary_synonyms_user_id ON vocabulary_synonyms(user_id);
CREATE INDEX idx_vocabulary_synonyms_synonym_word ON vocabulary_synonyms(synonym_word);
CREATE INDEX idx_vocabulary_synonyms_frequency_level ON vocabulary_synonyms(frequency_level);

-- Indexes for vocabulary_antonyms
CREATE INDEX idx_vocabulary_antonyms_vocabulary_word_id ON vocabulary_antonyms(vocabulary_word_id);
CREATE INDEX idx_vocabulary_antonyms_user_id ON vocabulary_antonyms(user_id);
CREATE INDEX idx_vocabulary_antonyms_antonym_word ON vocabulary_antonyms(antonym_word);

-- Indexes for vocabulary_collocations
CREATE INDEX idx_vocabulary_collocations_vocabulary_word_id ON vocabulary_collocations(vocabulary_word_id);
CREATE INDEX idx_vocabulary_collocations_user_id ON vocabulary_collocations(user_id);
CREATE INDEX idx_vocabulary_collocations_phrase ON vocabulary_collocations(phrase);
CREATE INDEX idx_vocabulary_collocations_collocation_type ON vocabulary_collocations(collocation_type);
CREATE INDEX idx_vocabulary_collocations_frequency_level ON vocabulary_collocations(frequency_level);
CREATE INDEX idx_vocabulary_collocations_register_level ON vocabulary_collocations(register_level);

-- Indexes for vocabulary_practice_sessions
CREATE INDEX idx_vocabulary_practice_sessions_user_id ON vocabulary_practice_sessions(user_id);
CREATE INDEX idx_vocabulary_practice_sessions_collection_id ON vocabulary_practice_sessions(collection_id);
CREATE INDEX idx_vocabulary_practice_sessions_session_type ON vocabulary_practice_sessions(session_type);
CREATE INDEX idx_vocabulary_practice_sessions_status ON vocabulary_practice_sessions(status);
CREATE INDEX idx_vocabulary_practice_sessions_started_at ON vocabulary_practice_sessions(started_at DESC);
CREATE INDEX idx_vocabulary_practice_sessions_completed_at ON vocabulary_practice_sessions(completed_at DESC);

-- Indexes for vocabulary_practice_results
CREATE INDEX idx_vocabulary_practice_results_practice_session_id ON vocabulary_practice_results(practice_session_id);
CREATE INDEX idx_vocabulary_practice_results_vocabulary_word_id ON vocabulary_practice_results(vocabulary_word_id);
CREATE INDEX idx_vocabulary_practice_results_user_id ON vocabulary_practice_results(user_id);
CREATE INDEX idx_vocabulary_practice_results_is_correct ON vocabulary_practice_results(is_correct);
CREATE INDEX idx_vocabulary_practice_results_created_at ON vocabulary_practice_results(created_at DESC);

-- ========================================
-- STEP 11: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE vocabulary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_word_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_antonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_collocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_practice_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vocabulary_words
CREATE POLICY "Users view own vocabulary words"
  ON vocabulary_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary words"
  ON vocabulary_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary words"
  ON vocabulary_words FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary words"
  ON vocabulary_words FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_contexts
CREATE POLICY "Users view own vocabulary contexts"
  ON vocabulary_contexts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary contexts"
  ON vocabulary_contexts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary contexts"
  ON vocabulary_contexts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary contexts"
  ON vocabulary_contexts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_collections
CREATE POLICY "Users view own vocabulary collections"
  ON vocabulary_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users view public collections"
  ON vocabulary_collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users create vocabulary collections"
  ON vocabulary_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary collections"
  ON vocabulary_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary collections"
  ON vocabulary_collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_word_collections
CREATE POLICY "Users view own vocabulary word collections"
  ON vocabulary_word_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary word collections"
  ON vocabulary_word_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary word collections"
  ON vocabulary_word_collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_synonyms
CREATE POLICY "Users view own vocabulary synonyms"
  ON vocabulary_synonyms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary synonyms"
  ON vocabulary_synonyms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary synonyms"
  ON vocabulary_synonyms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary synonyms"
  ON vocabulary_synonyms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_antonyms
CREATE POLICY "Users view own vocabulary antonyms"
  ON vocabulary_antonyms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary antonyms"
  ON vocabulary_antonyms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary antonyms"
  ON vocabulary_antonyms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary antonyms"
  ON vocabulary_antonyms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_collocations
CREATE POLICY "Users view own vocabulary collocations"
  ON vocabulary_collocations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary collocations"
  ON vocabulary_collocations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary collocations"
  ON vocabulary_collocations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary collocations"
  ON vocabulary_collocations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_practice_sessions
CREATE POLICY "Users view own vocabulary practice sessions"
  ON vocabulary_practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary practice sessions"
  ON vocabulary_practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vocabulary practice sessions"
  ON vocabulary_practice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vocabulary practice sessions"
  ON vocabulary_practice_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for vocabulary_practice_results
CREATE POLICY "Users view own vocabulary practice results"
  ON vocabulary_practice_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create vocabulary practice results"
  ON vocabulary_practice_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- STEP 12: CREATE TRIGGERS
-- ========================================

-- Apply updated_at triggers
CREATE TRIGGER vocabulary_words_updated_at
  BEFORE UPDATE ON vocabulary_words
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vocabulary_contexts_updated_at
  BEFORE UPDATE ON vocabulary_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vocabulary_collections_updated_at
  BEFORE UPDATE ON vocabulary_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vocabulary_synonyms_updated_at
  BEFORE UPDATE ON vocabulary_synonyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vocabulary_antonyms_updated_at
  BEFORE UPDATE ON vocabulary_antonyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vocabulary_collocations_updated_at
  BEFORE UPDATE ON vocabulary_collocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to update collection word count
CREATE OR REPLACE FUNCTION update_collection_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vocabulary_collections 
    SET 
      word_count = word_count + 1,
      updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vocabulary_collections 
    SET 
      word_count = GREATEST(word_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
CREATE TRIGGER update_collection_word_count_trigger
  AFTER INSERT OR DELETE ON vocabulary_word_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_word_count();

-- Function to calculate next review date based on spaced repetition
CREATE OR REPLACE FUNCTION calculate_next_review_date(
  current_mastery_level INTEGER,
  is_correct BOOLEAN
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  base_interval INTEGER := 1; -- Start with 1 day
  new_mastery_level INTEGER;
  interval_days INTEGER;
BEGIN
  -- Update mastery level
  IF is_correct THEN
    new_mastery_level := LEAST(current_mastery_level + 1, 5);
  ELSE
    new_mastery_level := GREATEST(current_mastery_level - 1, 0);
  END IF;
  
  -- Calculate interval based on mastery level (spaced repetition)
  CASE new_mastery_level
    WHEN 0 THEN interval_days := 1;    -- Review tomorrow
    WHEN 1 THEN interval_days := 1;    -- Review tomorrow
    WHEN 2 THEN interval_days := 3;    -- Review in 3 days
    WHEN 3 THEN interval_days := 7;    -- Review in 1 week
    WHEN 4 THEN interval_days := 14;   -- Review in 2 weeks
    WHEN 5 THEN interval_days := 30;   -- Review in 1 month
    ELSE interval_days := 1;
  END CASE;
  
  RETURN NOW() + (interval_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 13: CREATE VIEWS FOR COMMON QUERIES
-- ========================================

-- View for words due for review
CREATE OR REPLACE VIEW words_for_review AS
SELECT 
  vw.*,
  vc.name as collection_name
FROM vocabulary_words vw
LEFT JOIN vocabulary_word_collections vwc ON vw.id = vwc.vocabulary_word_id
LEFT JOIN vocabulary_collections vc ON vwc.collection_id = vc.id
WHERE vw.status = 'active'
  AND vw.next_review_at <= NOW()
ORDER BY vw.next_review_at ASC;

-- View for vocabulary statistics
CREATE OR REPLACE VIEW vocabulary_statistics AS
SELECT 
  vw.user_id,
  COUNT(*) as total_words,
  COUNT(*) FILTER (WHERE vw.mastery_level >= 4) as mastered_words,
  COUNT(*) FILTER (WHERE vw.mastery_level BETWEEN 2 AND 3) as learning_words,
  COUNT(*) FILTER (WHERE vw.mastery_level <= 1) as new_words,
  AVG(vw.mastery_level) as average_mastery,
  COUNT(*) FILTER (WHERE vw.next_review_at <= NOW()) as words_for_review,
  COUNT(DISTINCT vw.cefr_level) as cefr_levels_covered
FROM vocabulary_words vw
WHERE vw.status = 'active'
GROUP BY vw.user_id;

-- View for collection details with word statistics
CREATE OR REPLACE VIEW collection_details AS
SELECT
  vc.*,
  COUNT(vwc.vocabulary_word_id) as actual_word_count,
  COUNT(vwc.vocabulary_word_id) FILTER (WHERE vw.mastery_level >= 4) as actual_mastered_count,
  COUNT(vwc.vocabulary_word_id) FILTER (WHERE vw.mastery_level BETWEEN 2 AND 3) as learning_count,
  COUNT(vwc.vocabulary_word_id) FILTER (WHERE vw.mastery_level <= 1) as new_count,
  AVG(vw.mastery_level) as average_mastery
FROM vocabulary_collections vc
LEFT JOIN vocabulary_word_collections vwc ON vc.id = vwc.collection_id
LEFT JOIN vocabulary_words vw ON vwc.vocabulary_word_id = vw.id AND vw.status = 'active'
WHERE vc.status = 'active'
GROUP BY vc.id
ORDER BY vc.created_at DESC;

-- ========================================
-- STEP 14: INSERT DEFAULT DATA
-- ========================================

-- Function to create default collections for new users
CREATE OR REPLACE FUNCTION create_default_vocabulary_collections()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default collections for the new user
  INSERT INTO vocabulary_collections (user_id, name, description, collection_type, color, icon, is_default) VALUES
    (NEW.id, 'My Words', 'Personal vocabulary collection', 'custom', '#3B82F6', 'book', true),
    (NEW.id, 'Difficult Words', 'Words that need extra practice', 'difficulty', '#EF4444', 'alert-triangle', true),
    (NEW.id, 'Common Words', 'Frequently used vocabulary', 'frequency', '#10B981', 'trending-up', true),
    (NEW.id, 'Academic Vocabulary', 'Words for academic writing and reading', 'topic', '#8B5CF6', 'graduation-cap', true)
  ON CONFLICT (user_id, name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to create default collections for new users
CREATE TRIGGER create_default_vocabulary_collections_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_vocabulary_collections();

-- Grant permissions
GRANT SELECT ON words_for_review TO authenticated;
GRANT SELECT ON vocabulary_statistics TO authenticated;
GRANT SELECT ON collection_details TO authenticated;

-- Migration completed successfully!