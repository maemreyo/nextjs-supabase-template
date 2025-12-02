-- Migration: Remove unique_content indexes from analyses tables
-- Reason: Large AI JSON data exceeds btree version 4 maximum 2704 bytes for index
-- Tables affected: word_analyses, phrase_analyses, sentence_analyses, paragraph_analyses

-- Import logger for migration logging
-- Note: This is a SQL migration, logging will be handled by Supabase migration system

-- Drop unique indexes on content columns to prevent btree size limit errors
-- These indexes were causing failures when inserting large AI-generated JSON data

-- Drop unique constraints first (these create the underlying indexes)
-- Reason: In PostgreSQL, UNIQUE constraints create underlying indexes
-- We must drop the constraint first, then optionally drop the index

-- Drop word_analyses_unique_content constraint
ALTER TABLE word_analyses DROP CONSTRAINT IF EXISTS word_analyses_unique_content;
-- Optional: Drop any remaining index with the same name
DROP INDEX IF EXISTS word_analyses_unique_content;

-- Drop phrase_analyses_unique_content constraint
ALTER TABLE phrase_analyses DROP CONSTRAINT IF EXISTS phrase_analyses_unique_content;
-- Optional: Drop any remaining index with the same name
DROP INDEX IF EXISTS phrase_analyses_unique_content;

-- Drop sentence_analyses_unique_content constraint
ALTER TABLE sentence_analyses DROP CONSTRAINT IF EXISTS sentence_analyses_unique_content;
-- Optional: Drop any remaining index with the same name
DROP INDEX IF EXISTS sentence_analyses_unique_content;

-- Drop paragraph_analyses_unique_content constraint
ALTER TABLE paragraph_analyses DROP CONSTRAINT IF EXISTS paragraph_analyses_unique_content;
-- Optional: Drop any remaining index with the same name
DROP INDEX IF EXISTS paragraph_analyses_unique_content;

-- Note: We are removing these unique constraints because:
-- 1. AI-generated analysis content can be very large (JSON > 2704 bytes)
-- 2. Postgres btree indexes have size limitations
-- 3. The same content could be analyzed in different contexts legitimately
-- 4. Application-level deduplication can handle uniqueness if needed

-- Alternative indexes could be added later if needed:
-- - Hash indexes on content hashes instead of full content
-- - Partial indexes on truncated content
-- - Composite indexes with user_id + content_hash

-- Migration completed successfully
-- Analyses tables can now accept large AI-generated content without index size errors