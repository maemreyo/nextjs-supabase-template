# Báo cáo Phân tích và Đề xuất Cấu trúc Database Supabase

## Tóm tắt

Báo cáo này phân tích cấu trúc database hiện tại của hệ thống phân tích ngôn ngữ và đề xuất schema tối ưu cho việc lưu trữ kết quả phân tích từ, cụm từ, câu và đoạn văn.

## 1. Phân tích Cấu trúc Database Hiện tại

### 1.1 Các bảng chính liên quan đến phân tích

#### Bảng phân tích chính:
- **`word_analyses`** - Lưu trữ kết quả phân tích từ (1663 fields)
- **`sentence_analyses`** - Lưu trữ kết quả phân tích câu (586 fields)  
- **`paragraph_analyses`** - Lưu trữ kết quả phân tích đoạn văn (391 fields)

#### Bảng quản lý session:
- **`analysis_sessions`** - Quản lý các phiên phân tích
- **`session_analyses`** - Liên kết giữa session và các phân tích

#### Bảng hỗ trợ phân tích:
- **Word analysis support**: `word_synonyms`, `word_antonyms`, `word_collocations`
- **Sentence analysis support**: `sentence_key_components`, `sentence_rewrite_suggestions`
- **Paragraph analysis support**: `paragraph_constructive_feedback`, `paragraph_structure_breakdown`

### 1.2 Cấu trúc dữ liệu phân tích

#### Word Analysis:
- **Meta**: word, ipa, pos, cefr, tone
- **Definitions**: root meaning, context meaning, Vietnamese translation
- **Inference Strategy**: clues, reasoning
- **Relations**: synonyms, antonyms
- **Usage**: collocations, example sentence

#### Sentence Analysis:
- **Meta**: sentence, complexity level, sentence type
- **Semantics**: main idea, subtext, sentiment
- **Grammar Breakdown**: subject, verb, object, clauses
- **Contextual Role**: function, relation to previous
- **Key Components**: phrases, types, meanings
- **Rewrite Suggestions**: styles, texts, change logs
- **Translation**: literal, natural

#### Paragraph Analysis:
- **Meta**: type, tone, target audience
- **Content Analysis**: main topic, sentiment, keywords
- **Structure Breakdown**: sentence roles, analysis
- **Coherence and Cohesion**: logic score, flow score, transition words
- **Stylistic Evaluation**: vocabulary level, sentence variety
- **Constructive Feedback**: critiques, better version

## 2. Đánh giá Schema Hiện tại

### 2.1 Điểm mạnh

#### Cấu trúc tốt:
- ✅ **Phân tách dữ liệu rõ ràng**: Các bảng phân tích được tách riêng theo loại
- ✅ **Normalization tốt**: Dữ liệu được phân tách thành các bảng liên quan
- ✅ **Hỗ trợ session management hoàn chỉnh**: Có hệ thống session với settings, tags
- ✅ **Flexible JSON storage**: Bảng `session_analyses` sử dụng trường `analysis_data` dạng JSON

#### Quan hệ dữ liệu:
- ✅ **Foreign keys rõ ràng**: Các bảng con có foreign key đến bảng cha
- ✅ **Cascade deletes**: Hỗ trợ xóa dữ liệu liên quan tự động
- ✅ **User isolation**: Mọi bảng đều có `user_id` để phân tách dữ liệu

### 2.2 Các điểm cần cải thiện

#### Vấn đề về redundancy và normalization:

1. **Trùng lặp dữ liệu phân tích**:
   - Dữ liệu phân tích được lưu cả trong bảng cụ thể (word_analyses, sentence_analyses, paragraph_analyses)
   - Và lại được lưu thêm trong `session_analyses.analysis_data` dạng JSON
   - **Vấn đề**: Dữ liệu bị trùng lặp, khó đồng bộ, tốn dung lượng

2. **Thiếu consistency trong cấu trúc phân tích**:
   - Mỗi loại phân tích có cấu trúc bảng riêng biệt
   - Khó mở rộng cho các loại phân tích mới
   - Khó thực hiện các truy vấn cross-type analysis

3. **Inefficient queries**:
   - Để lấy phân tích trong session, cần join qua nhiều bảng
   - Query phức tạp khi cần lấy tất cả các loại phân tích của một session

#### Vấn đề về performance:

1. **JSON operations**:
   - Trường `analysis_data` trong `session_analyses` khó index và query
   - Performance kém khi cần tìm kiếm trong nội dung phân tích

2. **Missing indexes**:
   - Thiếu index trên các trường thường xuyên query (analysis_type, created_at, etc.)
   - Performance kém khi truy vấn dữ liệu lớn

#### Vấn đề về scalability:

1. **Hard to extend**:
   - Thêm loại phân tích mới cần tạo bảng mới, modify nhiều code
   - Không có cơ chế chung để quản lý các loại phân tích

2. **Limited metadata support**:
   - Thiếu trường metadata chung cho các loại phân tích
   - Khó lưu trữ thông tin mở rộng (model AI used, processing time, cost, etc.)

## 3. Đề xuất Thiết kế Schema Tối ưu

### 3.1 Triết lý thiết kế

#### Nguyên tắc chính:
1. **Unified storage**: Sử dụng bảng chung cho tất cả các loại phân tích
2. **Flexible schema**: Hỗ trợ mở rộng cho các loại phân tích mới
3. **Performance optimization**: Indexing và query optimization
4. **Data integrity**: Constraints và validation rules
5. **Backward compatibility**: Hỗ trợ migration từ schema hiện tại

### 3.2 Schema đề xuất

#### Bảng chính: `analyses`

```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Common fields for all analysis types
  analysis_type VARCHAR(20) NOT NULL CHECK (analysis_type IN ('word', 'sentence', 'paragraph', 'phrase')),
  source_text TEXT NOT NULL,
  source_text_hash VARCHAR(64) NOT NULL, -- For deduplication
  
  -- AI processing metadata
  ai_provider VARCHAR(50) NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  processing_time_ms INTEGER,
  cost DECIMAL(10,6),
  tokens_used INTEGER,
  
  -- Analysis results (JSON structure based on type)
  analysis_data JSONB NOT NULL,
  
  -- Search and filtering
  search_vector tsvector, -- For full-text search
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_source_analysis UNIQUE(user_id, source_text_hash, analysis_type)
);
```

#### Bảng liên kết: `session_analyses` (cải tiến)

```sql
CREATE TABLE session_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Position and organization
  position INTEGER NOT NULL,
  parent_analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL, -- For nested analyses
  
  -- Display preferences
  is_expanded BOOLEAN DEFAULT true,
  is_bookmarked BOOLEAN DEFAULT false,
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_session_analysis_position UNIQUE(session_id, position),
  CONSTRAINT check_position CHECK (position >= 0)
);
```

#### Bảng metadata: `analysis_metadata`

```sql
CREATE TABLE analysis_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  
  -- Metadata categories
  metadata_type VARCHAR(50) NOT NULL, -- 'confidence', 'source', 'validation', etc.
  metadata_key VARCHAR(100) NOT NULL,
  metadata_value JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_metadata UNIQUE(analysis_id, metadata_type, metadata_key)
);
```

### 3.3 Indexes cho performance

```sql
-- Performance indexes
CREATE INDEX idx_analyses_user_type ON analyses(user_id, analysis_type);
CREATE INDEX idx_analyses_session_position ON analyses(session_id, created_at);
CREATE INDEX idx_analyses_document ON analyses(document_id);
CREATE INDEX idx_analyses_search ON analyses USING GIN(search_vector);
CREATE INDEX idx_analyses_ai_provider ON analyses(ai_provider, ai_model);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

CREATE INDEX idx_session_analyses_session_position ON session_analyses(session_id, position);
CREATE INDEX idx_session_analyses_analysis ON session_analyses(analysis_id);
CREATE INDEX idx_session_analyses_parent ON session_analyses(parent_analysis_id);
```

### 3.4 Functions và Triggers

#### Trigger cho search vector:
```sql
CREATE OR REPLACE FUNCTION update_analysis_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.source_text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.analysis_data::text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analysis_search_vector
  BEFORE INSERT OR UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_analysis_search_vector();
```

## 4. Lợi ích của Schema Mới

### 4.1 Performance improvements:
- **Faster queries**: Indexes optimized cho common query patterns
- **Full-text search**: Native PostgreSQL full-text search support
- **Reduced redundancy**: Eliminate data duplication

### 4.2 Scalability benefits:
- **Easy extension**: Add new analysis types without schema changes
- **Flexible metadata**: Support for arbitrary metadata
- **Hierarchical analyses**: Support for nested analyses

### 4.3 Data integrity:
- **Consistent validation**: Unified validation rules
- **Referential integrity**: Proper foreign key constraints
- **Deduplication**: Hash-based duplicate detection

## 5. Migration Strategy

### 5.1 Phase 1: Preparation (1-2 weeks)
- [ ] Create migration scripts
- [ ] Set up testing environment
- [ ] Create backup of current data

### 5.2 Phase 2: Schema Implementation (2-3 weeks)
- [ ] Create new tables and indexes
- [ ] Implement triggers and functions
- [ ] Create backward compatibility views

### 5.3 Phase 3: Data Migration (2-3 weeks)
- [ ] Migrate word_analyses data
- [ ] Migrate sentence_analyses data
- [ ] Migrate paragraph_analyses data
- [ ] Update session_analyses references
- [ ] Validate data integrity

### 5.4 Phase 4: Application Updates (2-3 weeks)
- [ ] Update API routes
- [ ] Update TypeScript types
- [ ] Update UI components
- [ ] Add validation for JSON structures

### 5.5 Phase 5: Testing and Deployment (1-2 weeks)
- [ ] Integration testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Production deployment

### 5.6 Phase 6: Cleanup (1 week)
- [ ] Drop old tables
- [ ] Remove deprecated code
- [ ] Update documentation

## 6. Risks và Mitigation

### 6.1 Technical Risks:
- **Data loss during migration**: Implement comprehensive backup and rollback procedures
- **Performance degradation**: Thorough testing and gradual rollout
- **Application compatibility**: Maintain backward compatibility during transition

### 6.2 Business Risks:
- **Downtime during migration**: Schedule migration during low-traffic periods
- **User impact**: Communicate changes and provide training
- **Cost overruns**: Monitor migration progress and adjust scope as needed

## 7. Recommendations

### 7.1 Immediate Actions (Next 2 weeks):
1. **Add missing indexes** to current schema for immediate performance improvement
2. **Implement data validation** in API routes
3. **Create backup procedures** for current data

### 7.2 Short-term Actions (Next 1-2 months):
1. **Implement new schema** in staging environment
2. **Develop migration scripts** with thorough testing
3. **Update application code** to support new schema

### 7.3 Long-term Actions (Next 3-6 months):
1. **Complete migration** to new schema
2. **Implement advanced features** like hierarchical analyses
3. **Optimize performance** based on real-world usage patterns

## 8. Kết luận

Schema hiện tại có nền tảng tốt nhưng gặp vấn đề về redundancy, performance và scalability. Schema đề xuất giải quyết các vấn đề này bằng cách:

1. **Unifying storage** trong một bảng chung với JSONB cho type-specific data
2. **Optimizing performance** với proper indexes và full-text search
3. **Enabling scalability** với flexible schema và metadata support
4. **Maintaining data integrity** với proper constraints và validation

Migration plan được đề xuất sẽ đảm bảo chuyển đổi平滑 với minimal disruption cho users. Lợi ích dài hạn về performance, scalability và maintainability sẽ vượt qua chi phí migration.

---

*Report prepared by: Kilo Code (Architect Mode)*  
*Date: 2025-11-23*  
*Version: 1.0*