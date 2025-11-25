-- Migration: Cleanup Duplicates and Add Unique Constraints
-- Description: Remove duplicate data and add unique constraints
-- Version: 1.0
-- Date: 2025-11-25

-- ========================================
-- STEP 1: CLEANUP DUPLICATE DATA
-- ========================================

-- Delete duplicate word_analyses using window function
DELETE FROM word_analyses
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY user_id, word, sentence_context, document_id
            ORDER BY created_at
        ) as rn
        FROM word_analyses
    ) t WHERE rn > 1
);

-- Delete duplicate sentence_analyses using window function
DELETE FROM sentence_analyses
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY user_id, sentence, document_id
            ORDER BY created_at
        ) as rn
        FROM sentence_analyses
    ) t WHERE rn > 1
);

-- Delete duplicate paragraph_analyses using window function
DELETE FROM paragraph_analyses
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY user_id, paragraph, document_id
            ORDER BY created_at
        ) as rn
        FROM paragraph_analyses
    ) t WHERE rn > 1
);

-- Delete duplicate phrase_analyses using window function
DELETE FROM phrase_analyses
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY user_id, phrase, sentence_context, document_id
            ORDER BY created_at
        ) as rn
        FROM phrase_analyses
    ) t WHERE rn > 1
);

-- Delete duplicate session_analyses using window function
DELETE FROM session_analyses
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY session_id, analysis_id, user_id
            ORDER BY created_at
        ) as rn
        FROM session_analyses
    ) t WHERE rn > 1
);

-- ========================================
-- STEP 2: CREATE UNIQUE CONSTRAINTS
-- ========================================

-- Unique constraint for word_analyses
ALTER TABLE word_analyses 
ADD CONSTRAINT word_analyses_unique_content 
UNIQUE (user_id, word, sentence_context, document_id);

-- Unique constraint for sentence_analyses
ALTER TABLE sentence_analyses 
ADD CONSTRAINT sentence_analyses_unique_content 
UNIQUE (user_id, sentence, document_id);

-- Unique constraint for paragraph_analyses
ALTER TABLE paragraph_analyses 
ADD CONSTRAINT paragraph_analyses_unique_content 
UNIQUE (user_id, paragraph, document_id);

-- Unique constraint for phrase_analyses
ALTER TABLE phrase_analyses 
ADD CONSTRAINT phrase_analyses_unique_content 
UNIQUE (user_id, phrase, sentence_context, document_id);

-- Unique constraint for session_analyses
ALTER TABLE session_analyses 
ADD CONSTRAINT session_analyses_unique_link 
UNIQUE (session_id, analysis_id, user_id);