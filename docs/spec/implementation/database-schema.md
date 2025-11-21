# Database Schema cho AI Semantic Analysis Editor

## Tổng quan

Database schema được thiết kế để hỗ trợ các chức năng phân tích ngữ nghĩa sâu cho từ, câu và đoạn văn. Schema mới được cập nhật để hỗ trợ rich fields từ các interface TypeScript mới, cung cấp khả năng lưu trữ và truy vấn thông tin phân tích chi tiết.

## Schema hiện tại (từ main-app.md)

### Bảng chính

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic analyses cache
CREATE TABLE semantic_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('word', 'sentence', 'paragraph')),
  target_text TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Schema mới được cập nhật

### 1. Bảng word_analyses (Mở rộng từ semantic_analyses)

```sql
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
```

### 2. Bảng sentence_analyses (Mở rộng từ semantic_analyses)

```sql
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
```

### 3. Bảng paragraph_analyses (Mở rộng từ semantic_analyses)

```sql
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
```

### 4. Bảng word_synonyms (Mối quan hệ từ đồng nghĩa)

```sql
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
```

### 5. Bảng word_antonyms (Mối quan hệ từ trái nghĩa)

```sql
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
```

### 6. Bảng word_collocations (Mối quan hệ từ collocation)

```sql
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
```

### 7. Bảng sentence_key_components (Thành phần chính của câu)

```sql
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
```

### 7. Bảng sentence_rewrite_suggestions (Gợi ý viết lại câu)

```sql
CREATE TABLE sentence_rewrite_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sentence_analysis_id UUID REFERENCES sentence_analyses(id) ON DELETE CASCADE,
  
  style TEXT NOT NULL, -- Formal/Academic, Simplified/Clear, Native/Idiomatic
  text TEXT NOT NULL,
  change_log TEXT, -- Giải thích ngắn gọn thay đổi
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Bảng paragraph_structure_breakdown (Phân tích cấu trúc đoạn)

```sql
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
```

### 9. Bảng paragraph_constructive_feedback (Phản hồi xây dựng cho đoạn)

```sql
CREATE TABLE paragraph_constructive_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paragraph_analysis_id UUID REFERENCES paragraph_analyses(id) ON DELETE CASCADE,
  
  issue_type TEXT, -- Logic/Grammar/Vocabulary/Repetition/Style
  description TEXT, -- Mô tả chi tiết vấn đề đang gặp phải
  suggestion TEXT, -- Đề xuất cách sửa cụ thể cho vấn đề này
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes cho Performance

### Indexes cho word_analyses

```sql
-- Basic indexes
CREATE INDEX idx_word_analyses_document_id ON word_analyses(document_id);
CREATE INDEX idx_word_analyses_user_id ON word_analyses(user_id);
CREATE INDEX idx_word_analyses_word ON word_analyses(word);
CREATE INDEX idx_word_analyses_pos ON word_analyses(pos);
CREATE INDEX idx_word_analyses_cefr ON word_analyses(cefr);

-- Full-text search indexes
CREATE INDEX idx_word_analyses_word_fts ON word_analyses USING gin(to_tsvector('english', word));
CREATE INDEX idx_word_analyses_context_meaning_fts ON word_analyses USING gin(to_tsvector('english', context_meaning));

-- Composite indexes for common queries
CREATE INDEX idx_word_analyses_document_word ON word_analyses(document_id, word);
CREATE INDEX idx_word_analyses_user_cefr ON word_analyses(user_id, cefr);
```

### Indexes cho sentence_analyses

```sql
-- Basic indexes
CREATE INDEX idx_sentence_analyses_document_id ON sentence_analyses(document_id);
CREATE INDEX idx_sentence_analyses_user_id ON sentence_analyses(user_id);
CREATE INDEX idx_sentence_analyses_complexity ON sentence_analyses(complexity_level);
CREATE INDEX idx_sentence_analyses_sentiment ON sentence_analyses(sentiment);

-- Full-text search indexes
CREATE INDEX idx_sentence_analyses_sentence_fts ON sentence_analyses USING gin(to_tsvector('english', sentence));
CREATE INDEX idx_sentence_analyses_main_idea_fts ON sentence_analyses USING gin(to_tsvector('english', main_idea));

-- Composite indexes
CREATE INDEX idx_sentence_analyses_document_complexity ON sentence_analyses(document_id, complexity_level);
```

### Indexes cho paragraph_analyses

```sql
-- Basic indexes
CREATE INDEX idx_paragraph_analyses_document_id ON paragraph_analyses(document_id);
CREATE INDEX idx_paragraph_analyses_user_id ON paragraph_analyses(user_id);
CREATE INDEX idx_paragraph_analyses_type ON paragraph_analyses(type);
CREATE INDEX idx_paragraph_analyses_tone ON paragraph_analyses(tone);
CREATE INDEX idx_paragraph_analyses_sentiment ON paragraph_analyses(sentiment_label);

-- Score indexes
CREATE INDEX idx_paragraph_analyses_logic_score ON paragraph_analyses(logic_score);
CREATE INDEX idx_paragraph_analyses_flow_score ON paragraph_analyses(flow_score);

-- Full-text search indexes
CREATE INDEX idx_paragraph_analyses_paragraph_fts ON paragraph_analyses USING gin(to_tsvector('english', paragraph));
CREATE INDEX idx_paragraph_analyses_main_topic_fts ON paragraph_analyses USING gin(to_tsvector('english', main_topic));

-- Composite indexes
CREATE INDEX idx_paragraph_analyses_document_type ON paragraph_analyses(document_id, type);
```

### Indexes cho bảng quan hệ

```sql
-- word_synonyms
CREATE INDEX idx_word_synonyms_word_analysis_id ON word_synonyms(word_analysis_id);
CREATE INDEX idx_word_synonyms_word ON word_synonyms(synonym_word);

-- word_antonyms
CREATE INDEX idx_word_antonyms_word_analysis_id ON word_antonyms(word_analysis_id);
CREATE INDEX idx_word_antonyms_word ON word_antonyms(antonym_word);

-- sentence_key_components
CREATE INDEX idx_sentence_key_components_sentence_analysis_id ON sentence_key_components(sentence_analysis_id);
CREATE INDEX idx_sentence_key_components_type ON sentence_key_components(type);

-- sentence_rewrite_suggestions
CREATE INDEX idx_sentence_rewrite_suggestions_sentence_analysis_id ON sentence_rewrite_suggestions(sentence_analysis_id);
CREATE INDEX idx_sentence_rewrite_suggestions_style ON sentence_rewrite_suggestions(style);

-- paragraph_structure_breakdown
CREATE INDEX idx_paragraph_structure_breakdown_paragraph_analysis_id ON paragraph_structure_breakdown(paragraph_analysis_id);
CREATE INDEX idx_paragraph_structure_breakdown_role ON paragraph_structure_breakdown(role);

-- word_collocations
CREATE INDEX idx_word_collocations_word_analysis_id ON word_collocations(word_analysis_id);
CREATE INDEX idx_word_collocations_phrase ON word_collocations(phrase);
CREATE INDEX idx_word_collocations_frequency_level ON word_collocations(frequency_level);

-- paragraph_constructive_feedback
CREATE INDEX idx_paragraph_constructive_feedback_paragraph_analysis_id ON paragraph_constructive_feedback(paragraph_analysis_id);
CREATE INDEX idx_paragraph_constructive_feedback_issue_type ON paragraph_constructive_feedback(issue_type);
```

## Row Level Security (RLS) Policies

### Enable RLS trên tất cả các bảng

```sql
-- Enable RLS on all tables
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
```

### RLS Policies cho word_analyses

```sql
-- Users can view their own word analyses
CREATE POLICY "Users view own word analyses"
  ON word_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own word analyses
CREATE POLICY "Users create word analyses"
  ON word_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own word analyses
CREATE POLICY "Users update own word analyses"
  ON word_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own word analyses
CREATE POLICY "Users delete own word analyses"
  ON word_analyses FOR DELETE
  USING (auth.uid() = user_id);
```

### RLS Policies cho sentence_analyses

```sql
-- Users can view their own sentence analyses
CREATE POLICY "Users view own sentence analyses"
  ON sentence_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sentence analyses
CREATE POLICY "Users create sentence analyses"
  ON sentence_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sentence analyses
CREATE POLICY "Users update own sentence analyses"
  ON sentence_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sentence analyses
CREATE POLICY "Users delete own sentence analyses"
  ON sentence_analyses FOR DELETE
  USING (auth.uid() = user_id);
```

### RLS Policies cho paragraph_analyses

```sql
-- Users can view their own paragraph analyses
CREATE POLICY "Users view own paragraph analyses"
  ON paragraph_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own paragraph analyses
CREATE POLICY "Users create paragraph analyses"
  ON paragraph_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own paragraph analyses
CREATE POLICY "Users update own paragraph analyses"
  ON paragraph_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own paragraph analyses
CREATE POLICY "Users delete own paragraph analyses"
  ON paragraph_analyses FOR DELETE
  USING (auth.uid() = user_id);
```

### RLS Policies cho bảng quan hệ (thông qua bảng cha)

```sql
-- word_synonyms policies (via word_analyses)
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

-- word_antonyms policies (via word_analyses)
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

-- word_collocations policies (via word_analyses)
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

-- sentence_key_components policies (via sentence_analyses)
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

-- sentence_rewrite_suggestions policies (via sentence_analyses)
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

-- paragraph_structure_breakdown policies (via paragraph_analyses)
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

-- paragraph_constructive_feedback policies (via paragraph_analyses)
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
```

## Functions và Triggers

### Auto-update updated_at trigger

```sql
-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
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
```

## Migration Script

### Migration từ schema cũ sang schema mới

```sql
-- Step 1: Create new tables
-- (Execute all CREATE TABLE statements above)

-- Step 2: Migrate data from semantic_analyses to new tables
-- Migrate word analyses
INSERT INTO word_analyses (
  id, document_id, user_id, word, sentence_context, paragraph_context, created_at
)
SELECT 
  id, 
  document_id, 
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  context->>'sentence',
  context->>'paragraph',
  created_at
FROM semantic_analyses
WHERE type = 'word';

-- Migrate sentence analyses
INSERT INTO sentence_analyses (
  id, document_id, user_id, sentence, paragraph_context, created_at
)
SELECT 
  id, 
  document_id, 
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  context->>'paragraph',
  created_at
FROM semantic_analyses
WHERE type = 'sentence';

-- Migrate paragraph analyses
INSERT INTO paragraph_analyses (
  id, document_id, user_id, paragraph, created_at
)
SELECT 
  id, 
  document_id, 
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  created_at
FROM semantic_analyses
WHERE type = 'paragraph';

-- Step 3: Create indexes
-- (Execute all CREATE INDEX statements above)

-- Step 4: Enable RLS and create policies
-- (Execute all ALTER TABLE and CREATE POLICY statements above)

-- Step 5: Create triggers
-- (Execute all CREATE TRIGGER statements above)

-- Step 6: Drop old table (after verification)
-- DROP TABLE semantic_analyses;
```

## TypeScript Types cho Database

```typescript
// Word Analysis types
export interface WordAnalysisDB {
  id: string;
  document_id: string;
  user_id: string;
  word: string;
  ipa?: string;
  pos?: string;
  cefr?: string;
  tone?: string;
  root_meaning?: string;
  context_meaning?: string;
  vietnamese_translation?: string;
  inference_clues?: string;
  inference_reasoning?: string;
  example_sentence?: string;
  example_translation?: string;
  sentence_context?: string;
  paragraph_context?: string;
  created_at: string;
  updated_at: string;
}

export interface WordSynonymDB {
  id: string;
  word_analysis_id: string;
  synonym_word: string;
  ipa?: string;
  meaning_en?: string;
  meaning_vi?: string;
  created_at: string;
}

export interface WordAntonymDB {
  id: string;
  word_analysis_id: string;
  antonym_word: string;
  ipa?: string;
  meaning_en?: string;
  meaning_vi?: string;
  created_at: string;
}

export interface WordCollocationDB {
  id: string;
  word_analysis_id: string;
  phrase: string;
  meaning?: string;
  usage_example?: string;
  frequency_level?: 'common' | 'uncommon' | 'rare';
  created_at: string;
  updated_at: string;
}

// Sentence Analysis types
export interface SentenceAnalysisDB {
  id: string;
  document_id: string;
  user_id: string;
  sentence: string;
  complexity_level?: 'Basic' | 'Intermediate' | 'Advanced';
  sentence_type?: string;
  main_idea?: string;
  subtext?: string;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
  subject?: string;
  main_verb?: string;
  object?: string;
  clauses?: any; // JSONB
  function?: string;
  relation_to_previous?: string;
  literal_translation?: string;
  natural_translation?: string;
  paragraph_context?: string;
  created_at: string;
  updated_at: string;
}

export interface SentenceKeyComponentDB {
  id: string;
  sentence_analysis_id: string;
  phrase: string;
  type?: string;
  meaning?: string;
  significance?: string;
  created_at: string;
}

export interface SentenceRewriteSuggestionDB {
  id: string;
  sentence_analysis_id: string;
  style: string;
  text: string;
  change_log?: string;
  created_at: string;
}

// Paragraph Analysis types
export interface ParagraphAnalysisDB {
  id: string;
  document_id: string;
  user_id: string;
  paragraph: string;
  type?: string;
  tone?: string;
  target_audience?: string;
  main_topic?: string;
  sentiment_label?: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  sentiment_intensity?: number;
  sentiment_justification?: string;
  keywords?: string[];
  logic_score?: number;
  flow_score?: number;
  transition_words?: string[];
  gap_analysis?: string;
  vocabulary_level?: string;
  sentence_variety?: string;
  better_version?: string;
  created_at: string;
  updated_at: string;
}

export interface ParagraphStructureBreakdownDB {
  id: string;
  paragraph_analysis_id: string;
  sentence_index: number;
  snippet?: string;
  role?: string;
  analysis?: string;
  created_at: string;
}

export interface ParagraphConstructiveFeedbackDB {
  id: string;
  paragraph_analysis_id: string;
  issue_type?: string;
  description?: string;
  suggestion?: string;
  created_at: string;
}
```

## Performance Optimization Tips

1. **Sử dụng JSONB cho dữ liệu phức tạp**: Các trường như clauses trong sentence_analyses nên dùng JSONB để lưu trữ cấu trúc phức tạp.

2. **Partitioning cho large tables**: Nếu dữ liệu phân tích lớn, cân nhắc partitioning theo user_id hoặc created_at.

3. **Materialized Views cho thống kê**: Tạo materialized views cho các báo cáo thống kê thường xuyên truy vấn.

4. **Connection Pooling**: Sử dụng connection pooling để tối ưu hiệu suất khi có nhiều truy vấn đồng thời.

5. **Caching Strategy**: Implement caching ở ứng dụng cho các truy vấn thường xuyên.

## Backup và Recovery

1. **Regular Backups**: Thiết lập backup tự động hàng ngày cho database.

2. **Point-in-Time Recovery**: Cấu hình PITR để có thể khôi phục dữ liệu tại thời điểm cụ thể.

3. **Testing Restores**: Thường xuyên kiểm tra quy trình khôi phục dữ liệu để đảm bảo tính tin cậy.

## Monitoring

1. **Performance Monitoring**: Sử dụng pg_stat_statements để monitor các truy vấn chậm.

2. **Size Monitoring**: Theo dõi kích thước các bảng để dự báo cần thiết tối ưu.

3. **Connection Monitoring**: Giám sát số lượng kết nối để tránh overload.

## Security Considerations

1. **Input Validation**: Validate tất cả input trước khi insert vào database.

2. **SQL Injection Prevention**: Sử dụng parameterized queries cho tất cả truy vấn.

3. **Least Privilege**: Đảm bảo các tài khoản database có quyền tối thiểu cần thiết.

4. **Audit Logging**: Cân nhắc implement audit logging cho các thao tác nhạy cảm.

## Conclusion

Database schema mới này cung cấp cấu trúc toàn diện để hỗ trợ các chức năng phân tích ngữ nghĩa sâu. Schema được thiết kế với các best practices của PostgreSQL và Supabase, bao gồm RLS, indexes tối ưu, và các trigger tự động. Schema này cũng dễ dàng mở rộng cho các tính năng tương lai của ứng dụng.

## SQL Script Hoàn Chỉnh cho Migration

Đây là SQL script hoàn chỉnh để thực hiện migration từ schema cũ sang schema mới. Script này có thể được lưu vào file `supabase/migrations/20240101_rich_fields_migration.sql`.

```sql
-- Migration: Rich Fields for AI Semantic Analysis Editor
-- Description: Add rich fields support for word, sentence, and paragraph analyses
-- Version: 1.0
-- Date: 2024-01-01

-- ========================================
-- STEP 1: CREATE NEW TABLES
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
-- STEP 2: MIGRATE DATA FROM OLD TABLE
-- ========================================

-- Migrate word analyses from semantic_analyses
INSERT INTO word_analyses (
  id, document_id, user_id, word, sentence_context, paragraph_context, created_at
)
SELECT
  id,
  document_id,
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  context->>'sentence',
  context->>'paragraph',
  created_at
FROM semantic_analyses
WHERE type = 'word'
ON CONFLICT (id) DO NOTHING;

-- Migrate sentence analyses from semantic_analyses
INSERT INTO sentence_analyses (
  id, document_id, user_id, sentence, paragraph_context, created_at
)
SELECT
  id,
  document_id,
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  context->>'paragraph',
  created_at
FROM semantic_analyses
WHERE type = 'sentence'
ON CONFLICT (id) DO NOTHING;

-- Migrate paragraph analyses from semantic_analyses
INSERT INTO paragraph_analyses (
  id, document_id, user_id, paragraph, created_at
)
SELECT
  id,
  document_id,
  (SELECT user_id FROM documents WHERE id = semantic_analyses.document_id),
  target_text,
  created_at
FROM semantic_analyses
WHERE type = 'paragraph'
ON CONFLICT (id) DO NOTHING;

-- Note: Collocations migration will be handled separately when migrating from the old schema
-- This is because the old word_analyses table had collocations as TEXT[] array
-- but the new schema doesn't include this field
-- If migrating from old schema with collocations array, use:
/*
INSERT INTO word_collocations (word_analysis_id, phrase, frequency_level, created_at)
SELECT
  wa.id,
  unnest(COALESCE(wa.collocations, ARRAY[]::text[])) as phrase,
  'common' as frequency_level, -- Default frequency level
  NOW() as created_at
FROM word_analyses_old wa
WHERE wa.collocations IS NOT NULL AND array_length(wa.collocations, 1) > 0
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- STEP 3: CREATE INDEXES
-- ========================================

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
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS on all tables
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
-- STEP 5: CREATE TRIGGERS
-- ========================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
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
-- STEP 6: CLEANUP (OPTIONAL)
-- ========================================

-- Uncomment the following lines after verifying migration is successful
-- DROP TABLE semantic_analyses;

-- ========================================
-- STEP 7: VERIFICATION QUERIES
-- ========================================

-- Verify data migration
-- SELECT
--   'word_analyses' as table_name,
--   COUNT(*) as count
-- FROM word_analyses
-- UNION ALL
-- SELECT
--   'sentence_analyses' as table_name,
--   COUNT(*) as count
-- FROM sentence_analyses
-- UNION ALL
-- SELECT
--   'paragraph_analyses' as table_name,
--   COUNT(*) as count
-- FROM paragraph_analyses
-- UNION ALL
-- SELECT
--   'semantic_analyses' as table_name,
--   COUNT(*) as count
-- FROM semantic_analyses;

-- Check RLS policies
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'word_analyses',
--     'sentence_analyses',
--     'paragraph_analyses',
--     'word_synonyms',
--     'word_antonyms',
--     'sentence_key_components',
--     'sentence_rewrite_suggestions',
--     'paragraph_structure_breakdown',
--     'paragraph_constructive_feedback'
--   );

-- Migration completed successfully!
```

## Hướng Dẫn Thực Hiện Migration

1. **Backup Database**:
   ```bash
   pg_dump your_database > backup_before_migration.sql
   ```

2. **Thực hiện Migration**:
   - Lưu script trên vào file `supabase/migrations/20240101_rich_fields_migration.sql`
   - Chạy migration qua Supabase Dashboard hoặc CLI:
   ```bash
   supabase db push
   ```

3. **Kiểm tra Migration**:
   - Chạy các verification queries ở cuối script
   - Kiểm tra dữ liệu đã được migrate đúng chưa
   - Test các chức năng của ứng dụng

4. **Rollback (nếu cần)**:
   ```sql
   -- Drop new tables
   DROP TABLE IF EXISTS word_analyses CASCADE;
   DROP TABLE IF EXISTS sentence_analyses CASCADE;
   DROP TABLE IF EXISTS paragraph_analyses CASCADE;
   DROP TABLE IF EXISTS word_synonyms CASCADE;
   DROP TABLE IF EXISTS word_antonyms CASCADE;
   DROP TABLE IF EXISTS sentence_key_components CASCADE;
   DROP TABLE IF EXISTS sentence_rewrite_suggestions CASCADE;
   DROP TABLE IF EXISTS paragraph_structure_breakdown CASCADE;
   DROP TABLE IF EXISTS paragraph_constructive_feedback CASCADE;
   
   -- Restore from backup
   psql your_database < backup_before_migration.sql
   ```

5. **Cập nhật TypeScript Types**:
   - Cập nhật file types để match với schema mới
   - Regenerate types từ Supabase:
   ```bash
   supabase gen types typescript --local > src/types/database.ts
   ```
   
   - Hoặc cập nhật thủ công file `src/types/database.ts` với các interface mới:
   
   ```typescript
   // Thêm vào file src/types/database.ts
   
   export interface Database {
     public: {
       Tables: {
         profiles: {
           Row: Profile
           Insert: Omit<Profile, 'id' | 'updated_at'>
           Update: Partial<Omit<Profile, 'id' | 'user_id' | 'updated_at'>>
         }
         word_analyses: {
           Row: WordAnalysisDB
           Insert: Omit<WordAnalysisDB, 'id' | 'created_at' | 'updated_at'>
           Update: Partial<Omit<WordAnalysisDB, 'id' | 'user_id' | 'document_id' | 'created_at'>>
         }
         word_synonyms: {
           Row: WordSynonymDB
           Insert: Omit<WordSynonymDB, 'id' | 'created_at'>
           Update: Partial<Omit<WordSynonymDB, 'id' | 'word_analysis_id' | 'created_at'>>
         }
         word_antonyms: {
           Row: WordAntonymDB
           Insert: Omit<WordAntonymDB, 'id' | 'created_at'>
           Update: Partial<Omit<WordAntonymDB, 'id' | 'word_analysis_id' | 'created_at'>>
         }
         word_collocations: {
           Row: WordCollocationDB
           Insert: Omit<WordCollocationDB, 'id' | 'created_at' | 'updated_at'>
           Update: Partial<Omit<WordCollocationDB, 'id' | 'word_analysis_id' | 'created_at'>>
         }
         // ... các bảng khác
       }
       Views: {
         [_ in never]: never
       }
       Functions: {
         [_ in never]: never
       }
       Enums: {
         [_ in never]: never
       }
       CompositeTypes: {
         [_ in never]: never
       }
     }
   }
   ```

Migration này sẽ chuyển đổi database từ schema cũ sang schema mới với rich fields, hỗ trợ đầy đủ các chức năng phân tích ngữ nghĩa sâu cho từ, câu và đoạn văn.