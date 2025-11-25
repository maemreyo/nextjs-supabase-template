-- Migration: Add 'phrase' to phrase_type constraint
-- Description: Update phrase_type check constraint to include 'phrase' as valid option
-- Version: 1.0
-- Date: 2025-11-25

-- ========================================
-- STEP 1: UPDATE PHRASE_TYPE CONSTRAINT
-- ========================================

-- Drop existing check constraint
ALTER TABLE phrase_analyses DROP CONSTRAINT IF EXISTS phrase_analyses_phrase_type_check;

-- Add new check constraint that includes 'phrase'
ALTER TABLE phrase_analyses
ADD CONSTRAINT phrase_analyses_phrase_type_check
CHECK (phrase_type IN ('idiom', 'collocation', 'phrasal_verb', 'proverb', 'expression', 'phrase', 'other'));

-- ========================================
-- STEP 2: VERIFICATION
-- ========================================

-- Verify constraint was added successfully
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'phrase_analyses'::regclass 
AND conname = 'phrase_analyses_phrase_type_check';

-- Migration completed successfully!