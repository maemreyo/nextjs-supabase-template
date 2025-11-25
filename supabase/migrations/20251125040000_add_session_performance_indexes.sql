-- Add performance indexes for analysis tables to improve query performance
-- These indexes target the common query patterns in the /load endpoint

-- Index for session_analyses table to optimize queries by session_id, user_id, and analysis_type
CREATE INDEX IF NOT EXISTS idx_session_analyses_session_user_type ON public.session_analyses (session_id, user_id, analysis_type);

-- Index for word_analyses table to optimize queries by document_id and user_id
CREATE INDEX IF NOT EXISTS idx_word_analyses_document_user ON public.word_analyses (document_id, user_id);

-- Index for phrase_analyses table to optimize queries by document_id and user_id
CREATE INDEX IF NOT EXISTS idx_phrase_analyses_document_user ON public.phrase_analyses (document_id, user_id);

-- Index for sentence_analyses table to optimize queries by document_id and user_id
CREATE INDEX IF NOT EXISTS idx_sentence_analyses_document_user ON public.sentence_analyses (document_id, user_id);

-- Index for paragraph_analyses table to optimize queries by document_id and user_id
CREATE INDEX IF NOT EXISTS idx_paragraph_analyses_document_user ON public.paragraph_analyses (document_id, user_id);

-- Additional composite indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_session_analyses_user_session ON public.session_analyses (user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_analyses_type_created ON public.session_analyses (analysis_type, created_at);

-- Indexes for analysis_sessions table to optimize loading queries
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_status ON public.analysis_sessions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_updated ON public.analysis_sessions (user_id, updated_at DESC);