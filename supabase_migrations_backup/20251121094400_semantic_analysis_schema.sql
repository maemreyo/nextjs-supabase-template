-- Migration: Semantic Analysis Schema for AI Semantic Analysis Editor
-- Description: Create tables for word, sentence, and paragraph analyses with rich fields
-- Version: 1.0
-- Date: 2025-11-21

-- ========================================
-- STEP 0: CREATE PROFILES TABLE (if not exists)
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  
  constraint username_length check (char_length(username) >= 3),
  constraint username_length check (char_length(username) <= 24)
);

-- ========================================
-- STEP 1: CREATE DOCUMENTS TABLE (if not exists)
-- ========================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 2: CREATE MAIN ANALYSIS TABLES
-- ========================================

-- Word Analyses Table
CREATE TABLE word_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meta information
  word TEXT NOT NULL,
  ipa TEXT,
  pos TEXT, -- part of speech
  cefr TEXT, -- A1-C2
  tone TEXT, -- Formal/Neutral/Irony...
  
  -- Definitions
  root_meaning TEXT,
  context_meaning TEXT,
  vietnamese_translation TEXT,
  
  -- Inference Strategy
  inference_clues TEXT,
  inference_reasoning TEXT,
  
  -- Usage
  example_sentence TEXT,
  example_translation TEXT,
  
  -- Context information
  sentence_context TEXT,
  paragraph_context TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentence Analyses Table
CREATE TABLE sentence_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meta information
  sentence TEXT NOT NULL,
  complexity_level TEXT CHECK (complexity_level IN ('Basic', 'Intermediate', 'Advanced')),
  sentence_type TEXT, -- Simple/Compound/Complex...
  
  -- Semantics
  main_idea TEXT,
  subtext TEXT,
  sentiment TEXT CHECK (sentiment IN ('Positive', 'Negative', 'Neutral')),
  
  -- Grammar Breakdown
  subject TEXT,
  main_verb TEXT,
  object TEXT,
  clauses JSONB, -- Array of clause objects
  
  -- Contextual Role
  function TEXT, -- Function in paragraph
  relation_to_previous TEXT,
  
  -- Translation
  literal_translation TEXT,
  natural_translation TEXT,
  
  -- Context information
  paragraph_context TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paragraph Analyses Table
CREATE TABLE paragraph_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meta information
  paragraph TEXT NOT NULL,
  type TEXT, -- Tự sự/Miêu tả/Nghị luận/Thuyết minh/Hành chính...
  tone TEXT, -- Trang trọng/Thân mật/Châm biếm/Khách quan/Bi quan...
  target_audience TEXT, -- Trẻ em/Chuyên gia/Đại chúng...
  
  -- Content Analysis
  main_topic TEXT,
  sentiment_label TEXT CHECK (sentiment_label IN ('Positive', 'Negative', 'Neutral', 'Mixed')),
  sentiment_intensity INTEGER CHECK (sentiment_intensity >= 1 AND sentiment_intensity <= 10),
  sentiment_justification TEXT,
  keywords TEXT[], -- Array of keywords
  
  -- Coherence and Cohesion
  logic_score INTEGER CHECK (logic_score >= 1 AND logic_score <= 100),
  flow_score INTEGER CHECK (flow_score >= 1 AND flow_score <= 100),
  transition_words TEXT[], -- Array of transition words
  gap_analysis TEXT,
  
  -- Stylistic Evaluation
  vocabulary_level TEXT, -- Cơ bản/Phong phú/Học thuật/Lặp từ
  sentence_variety TEXT, -- Đánh giá sự đa dạng cấu trúc câu
  
  -- Better Version
  better_version TEXT, -- Improved version of paragraph
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE RELATIONSHIP TABLES
-- ========================================

-- Word Synonyms Table
CREATE TABLE word_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_analysis_id UUID REFERENCES word_analyses(id) ON DELETE CASCADE,
  
  synonym_word TEXT NOT NULL,
  ipa TEXT,
  meaning_en TEXT,
  meaning_vi TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Word Antonyms Table
CREATE TABLE word_antonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_analysis_id UUID REFERENCES word_analyses(id) ON DELETE CASCADE,
  
  antonym_word TEXT NOT NULL,
  ipa TEXT,
  meaning_en TEXT,
  meaning_vi TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Word Collocations Table
CREATE TABLE word_collocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_analysis_id UUID REFERENCES word_analyses(id) ON DELETE CASCADE,
  
  phrase TEXT NOT NULL,
  meaning TEXT,
  usage_example TEXT,
  frequency_level TEXT CHECK (frequency_level IN ('common', 'uncommon', 'rare')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentence Key Components Table
CREATE TABLE sentence_key_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_analysis_id UUID REFERENCES sentence_analyses(id) ON DELETE CASCADE,
  
  phrase TEXT NOT NULL,
  type TEXT, -- Idiom/Collocation/Grammar Pattern
  meaning TEXT,
  significance TEXT, -- Cái hay của cụm từ này
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sentence Rewrite Suggestions Table
CREATE TABLE sentence_rewrite_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_analysis_id UUID REFERENCES sentence_analyses(id) ON DELETE CASCADE,
  
  style TEXT NOT NULL, -- Formal/Academic, Simplified/Clear, Native/Idiomatic
  text TEXT NOT NULL,
  change_log TEXT, -- Giải thích ngắn gọn thay đổi
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paragraph Structure Breakdown Table
CREATE TABLE paragraph_structure_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_analysis_id UUID REFERENCES paragraph_analyses(id) ON DELETE CASCADE,
  
  sentence_index INTEGER NOT NULL,
  snippet TEXT, -- 3-5 từ đầu của câu để nhận diện
  role TEXT, -- Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion
  analysis TEXT, -- Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paragraph Constructive Feedback Table
CREATE TABLE paragraph_constructive_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_analysis_id UUID REFERENCES paragraph_analyses(id) ON DELETE CASCADE,
  
  issue_type TEXT, -- Logic/Grammar/Vocabulary/Repetition/Style
  description TEXT, -- Mô tả chi tiết vấn đề đang gặp phải
  suggestion TEXT, -- Đề xuất cách sửa cụ thể cho vấn đề này
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 4: CREATE INDEXES
-- ========================================

-- Indexes for profiles
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at DESC);

-- Indexes for documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Indexes for word_analyses
CREATE INDEX idx_word_analyses_document_id ON word_analyses(document_id);
CREATE INDEX idx_word_analyses_user_id ON word_analyses(user_id);
CREATE INDEX idx_word_analyses_word ON word_analyses(word);
CREATE INDEX idx_word_analyses_pos ON word_analyses(pos);
CREATE INDEX idx_word_analyses_cefr ON word_analyses(cefr);
CREATE INDEX idx_word_analyses_word_fts ON word_analyses USING gin(to_tsvector('english', word));
CREATE INDEX idx_word_analyses_context_meaning_fts ON word_analyses USING gin(to_tsvector('english', context_meaning));
CREATE INDEX idx_word_analyses_document_word ON word_analyses(document_id, word);
CREATE INDEX idx_word_analyses_user_cefr ON word_analyses(user_id, cefr);

-- Indexes for sentence_analyses
CREATE INDEX idx_sentence_analyses_document_id ON sentence_analyses(document_id);
CREATE INDEX idx_sentence_analyses_user_id ON sentence_analyses(user_id);
CREATE INDEX idx_sentence_analyses_complexity ON sentence_analyses(complexity_level);
CREATE INDEX idx_sentence_analyses_sentiment ON sentence_analyses(sentiment);
CREATE INDEX idx_sentence_analyses_sentence_fts ON sentence_analyses USING gin(to_tsvector('english', sentence));
CREATE INDEX idx_sentence_analyses_main_idea_fts ON sentence_analyses USING gin(to_tsvector('english', main_idea));
CREATE INDEX idx_sentence_analyses_document_complexity ON sentence_analyses(document_id, complexity_level);

-- Indexes for paragraph_analyses
CREATE INDEX idx_paragraph_analyses_document_id ON paragraph_analyses(document_id);
CREATE INDEX idx_paragraph_analyses_user_id ON paragraph_analyses(user_id);
CREATE INDEX idx_paragraph_analyses_type ON paragraph_analyses(type);
CREATE INDEX idx_paragraph_analyses_tone ON paragraph_analyses(tone);
CREATE INDEX idx_paragraph_analyses_sentiment ON paragraph_analyses(sentiment_label);
CREATE INDEX idx_paragraph_analyses_logic_score ON paragraph_analyses(logic_score);
CREATE INDEX idx_paragraph_analyses_flow_score ON paragraph_analyses(flow_score);
CREATE INDEX idx_paragraph_analyses_paragraph_fts ON paragraph_analyses USING gin(to_tsvector('english', paragraph));
CREATE INDEX idx_paragraph_analyses_main_topic_fts ON paragraph_analyses USING gin(to_tsvector('english', main_topic));
CREATE INDEX idx_paragraph_analyses_document_type ON paragraph_analyses(document_id, type);

-- Indexes for relationship tables
CREATE INDEX idx_word_synonyms_word_analysis_id ON word_synonyms(word_analysis_id);
CREATE INDEX idx_word_synonyms_word ON word_synonyms(synonym_word);
CREATE INDEX idx_word_antonyms_word_analysis_id ON word_antonyms(word_analysis_id);
CREATE INDEX idx_word_antonyms_word ON word_antonyms(antonym_word);
CREATE INDEX idx_word_collocations_word_analysis_id ON word_collocations(word_analysis_id);
CREATE INDEX idx_word_collocations_phrase ON word_collocations(phrase);
CREATE INDEX idx_word_collocations_frequency_level ON word_collocations(frequency_level);
CREATE INDEX idx_sentence_key_components_sentence_analysis_id ON sentence_key_components(sentence_analysis_id);
CREATE INDEX idx_sentence_key_components_type ON sentence_key_components(type);
CREATE INDEX idx_sentence_rewrite_suggestions_sentence_analysis_id ON sentence_rewrite_suggestions(sentence_analysis_id);
CREATE INDEX idx_sentence_rewrite_suggestions_style ON sentence_rewrite_suggestions(style);
CREATE INDEX idx_paragraph_structure_breakdown_paragraph_analysis_id ON paragraph_structure_breakdown(paragraph_analysis_id);
CREATE INDEX idx_paragraph_structure_breakdown_role ON paragraph_structure_breakdown(role);
CREATE INDEX idx_paragraph_constructive_feedback_paragraph_analysis_id ON paragraph_constructive_feedback(paragraph_analysis_id);
CREATE INDEX idx_paragraph_constructive_feedback_issue_type ON paragraph_constructive_feedback(issue_type);

-- ========================================
-- STEP 5: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE paragraph_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_antonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_collocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_key_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_rewrite_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paragraph_structure_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE paragraph_constructive_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile."
  ON profiles FOR SELECT
  USING ( auth.uid() = id );
  
CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );
  
CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- RLS Policies for documents
CREATE POLICY "Users view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for word_analyses
CREATE POLICY "Users view own word analyses"
  ON word_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create word analyses"
  ON word_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own word analyses"
  ON word_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own word analyses"
  ON word_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sentence_analyses
CREATE POLICY "Users view own sentence analyses"
  ON sentence_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create sentence analyses"
  ON sentence_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sentence analyses"
  ON sentence_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own sentence analyses"
  ON sentence_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for paragraph_analyses
CREATE POLICY "Users view own paragraph analyses"
  ON paragraph_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create paragraph analyses"
  ON paragraph_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own paragraph analyses"
  ON paragraph_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own paragraph analyses"
  ON paragraph_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for relationship tables (via parent tables)
CREATE POLICY "Users view own word synonyms"
  ON word_synonyms FOR SELECT
  USING (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create word synonyms"
  ON word_synonyms FOR INSERT
  WITH CHECK (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own word antonyms"
  ON word_antonyms FOR SELECT
  USING (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create word antonyms"
  ON word_antonyms FOR INSERT
  WITH CHECK (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for word_collocations
CREATE POLICY "Users view own word collocations"
  ON word_collocations FOR SELECT
  USING (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create word collocations"
  ON word_collocations FOR INSERT
  WITH CHECK (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own word collocations"
  ON word_collocations FOR UPDATE
  USING (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own word collocations"
  ON word_collocations FOR DELETE
  USING (
    word_analysis_id IN (
      SELECT id FROM word_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own sentence key components"
  ON sentence_key_components FOR SELECT
  USING (
    sentence_analysis_id IN (
      SELECT id FROM sentence_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create sentence key components"
  ON sentence_key_components FOR INSERT
  WITH CHECK (
    sentence_analysis_id IN (
      SELECT id FROM sentence_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own sentence rewrite suggestions"
  ON sentence_rewrite_suggestions FOR SELECT
  USING (
    sentence_analysis_id IN (
      SELECT id FROM sentence_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create sentence rewrite suggestions"
  ON sentence_rewrite_suggestions FOR INSERT
  WITH CHECK (
    sentence_analysis_id IN (
      SELECT id FROM sentence_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own paragraph structure breakdown"
  ON paragraph_structure_breakdown FOR SELECT
  USING (
    paragraph_analysis_id IN (
      SELECT id FROM paragraph_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create paragraph structure breakdown"
  ON paragraph_structure_breakdown FOR INSERT
  WITH CHECK (
    paragraph_analysis_id IN (
      SELECT id FROM paragraph_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own paragraph constructive feedback"
  ON paragraph_constructive_feedback FOR SELECT
  USING (
    paragraph_analysis_id IN (
      SELECT id FROM paragraph_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create paragraph constructive feedback"
  ON paragraph_constructive_feedback FOR INSERT
  WITH CHECK (
    paragraph_analysis_id IN (
      SELECT id FROM paragraph_analyses WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- STEP 6: CREATE TRIGGERS
-- ========================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Apply to tables with updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER word_analyses_updated_at
  BEFORE UPDATE ON word_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sentence_analyses_updated_at
  BEFORE UPDATE ON sentence_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER paragraph_analyses_updated_at
  BEFORE UPDATE ON paragraph_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER word_collocations_updated_at
  BEFORE UPDATE ON word_collocations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ========================================
-- STEP 7: VERIFICATION QUERIES (COMMENTED)
-- ========================================

-- Verify table creation
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'profiles', 'documents', 'word_analyses', 'sentence_analyses', 'paragraph_analyses',
--   'word_synonyms', 'word_antonyms', 'word_collocations',
--   'sentence_key_components', 'sentence_rewrite_suggestions',
--   'paragraph_structure_breakdown', 'paragraph_constructive_feedback'
-- );

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
-- AND tablename IN (
--   'profiles', 'documents', 'word_analyses', 'sentence_analyses', 'paragraph_analyses',
--   'word_synonyms', 'word_antonyms', 'word_collocations',
--   'sentence_key_components', 'sentence_rewrite_suggestions',
--   'paragraph_structure_breakdown', 'paragraph_constructive_feedback'
--   );

-- Migration completed successfully!