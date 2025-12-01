-- Migration: Create Highlights System
-- Description: Add highlights table and related metadata table to support new workflow where users can highlight text first and analyze later
-- Created: 2025-12-01

-- Create highlights table
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    highlight_type VARCHAR(20) NOT NULL CHECK (highlight_type IN ('word', 'phrase', 'sentence', 'paragraph')),
    content TEXT NOT NULL,
    start_position INTEGER NOT NULL CHECK (start_position >= 0),
    end_position INTEGER NOT NULL CHECK (end_position > start_position),
    selected_text TEXT NOT NULL,
    color VARCHAR(7) DEFAULT '#ffff00' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
    status VARCHAR(20) DEFAULT 'pending_analysis' NOT NULL CHECK (status IN ('pending_analysis', 'analyzed', 'error', 'skipped')),
    analysis_id UUID,
    analysis_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    -- Constraints
    CONSTRAINT highlights_analysis_id_check CHECK (
        (analysis_id IS NULL AND analysis_type IS NULL) OR 
        (analysis_id IS NOT NULL AND analysis_type IS NOT NULL)
    )
);

-- Create highlight_metadata table
CREATE TABLE IF NOT EXISTS public.highlight_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID NOT NULL REFERENCES public.highlights(id) ON DELETE CASCADE,
    document_context TEXT,
    paragraph_index INTEGER,
    sentence_index INTEGER,
    selection_duration_ms INTEGER,
    click_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add highlight_id to existing analysis tables
ALTER TABLE public.word_analyses 
ADD COLUMN IF NOT EXISTS highlight_id UUID REFERENCES public.highlights(id) ON DELETE SET NULL;

ALTER TABLE public.phrase_analyses 
ADD COLUMN IF NOT EXISTS highlight_id UUID REFERENCES public.highlights(id) ON DELETE SET NULL;

ALTER TABLE public.sentence_analyses 
ADD COLUMN IF NOT EXISTS highlight_id UUID REFERENCES public.highlights(id) ON DELETE SET NULL;

ALTER TABLE public.paragraph_analyses 
ADD COLUMN IF NOT EXISTS highlight_id UUID REFERENCES public.highlights(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_highlights_session_id ON public.highlights(session_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON public.highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_status ON public.highlights(status);
CREATE INDEX IF NOT EXISTS idx_highlights_highlight_type ON public.highlights(highlight_type);
CREATE INDEX IF NOT EXISTS idx_highlights_analysis_id ON public.highlights(analysis_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON public.highlights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_highlight_metadata_highlight_id ON public.highlight_metadata(highlight_id);

-- Add indexes for analysis tables
CREATE INDEX IF NOT EXISTS idx_word_analyses_highlight_id ON public.word_analyses(highlight_id);
CREATE INDEX IF NOT EXISTS idx_phrase_analyses_highlight_id ON public.phrase_analyses(highlight_id);
CREATE INDEX IF NOT EXISTS idx_sentence_analyses_highlight_id ON public.sentence_analyses(highlight_id);
CREATE INDEX IF NOT EXISTS idx_paragraph_analyses_highlight_id ON public.paragraph_analyses(highlight_id);

-- Create GIN index for metadata JSONB
CREATE INDEX IF NOT EXISTS idx_highlight_metadata_gin ON public.highlight_metadata USING GIN(metadata);

-- Add comments for documentation
COMMENT ON TABLE public.highlights IS 'Stores user highlights that can be analyzed later';
COMMENT ON COLUMN public.highlights.highlight_type IS 'Type of highlight: word, phrase, sentence, or paragraph';
COMMENT ON COLUMN public.highlights.content IS 'Full content context where highlight was made';
COMMENT ON COLUMN public.highlights.start_position IS 'Start position of highlight in content';
COMMENT ON COLUMN public.highlights.end_position IS 'End position of highlight in content';
COMMENT ON COLUMN public.highlights.selected_text IS 'Actual text that was highlighted';
COMMENT ON COLUMN public.highlights.color IS 'Highlight color in hex format';
COMMENT ON COLUMN public.highlights.status IS 'Current status: pending_analysis, analyzed, error, or skipped';
COMMENT ON COLUMN public.highlights.analysis_id IS 'Reference to the analysis result when available';
COMMENT ON COLUMN public.highlights.analysis_type IS 'Type of analysis performed: word, phrase, sentence, or paragraph';

COMMENT ON TABLE public.highlight_metadata IS 'Stores additional metadata about highlights';
COMMENT ON COLUMN public.highlight_metadata.document_context IS 'Context around the highlighted text';
COMMENT ON COLUMN public.highlight_metadata.paragraph_index IS 'Index of paragraph containing the highlight';
COMMENT ON COLUMN public.highlight_metadata.sentence_index IS 'Index of sentence containing the highlight';
COMMENT ON COLUMN public.highlight_metadata.selection_duration_ms IS 'Time taken to make the selection in milliseconds';
COMMENT ON COLUMN public.highlight_metadata.click_count IS 'Number of times this highlight was clicked';
COMMENT ON COLUMN public.highlight_metadata.metadata IS 'Flexible JSON metadata for future extensions';

-- Enable Row Level Security (RLS)
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_metadata ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for highlights
CREATE POLICY "Users can view their own highlights" ON public.highlights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own highlights" ON public.highlights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" ON public.highlights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" ON public.highlights
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for highlight_metadata
CREATE POLICY "Users can view their own highlight metadata" ON public.highlight_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.highlights 
            WHERE highlights.id = highlight_metadata.highlight_id 
            AND highlights.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own highlight metadata" ON public.highlight_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.highlights 
            WHERE highlights.id = highlight_metadata.highlight_id 
            AND highlights.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own highlight metadata" ON public.highlight_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.highlights 
            WHERE highlights.id = highlight_metadata.highlight_id 
            AND highlights.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own highlight metadata" ON public.highlight_metadata
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.highlights 
            WHERE highlights.id = highlight_metadata.highlight_id 
            AND highlights.user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_highlights_updated_at
    BEFORE UPDATE ON public.highlights
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_highlight_metadata_updated_at
    BEFORE UPDATE ON public.highlight_metadata
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to automatically update click count
CREATE OR REPLACE FUNCTION public.increment_highlight_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.highlight_metadata 
    SET click_count = click_count + 1, updated_at = NOW()
    WHERE highlight_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_highlight_click_count_trigger
    AFTER UPDATE ON public.highlights
    FOR EACH ROW 
    WHEN (OLD.status = 'pending_analysis' AND NEW.status = 'analyzed')
    EXECUTE FUNCTION public.increment_highlight_click_count();

-- Create view for highlights with analysis data
CREATE OR REPLACE VIEW public.highlights_with_analysis AS
SELECT 
    h.id,
    h.session_id,
    h.user_id,
    h.highlight_type,
    h.content,
    h.start_position,
    h.end_position,
    h.selected_text,
    h.color,
    h.status,
    h.analysis_id,
    h.analysis_type,
    h.created_at,
    h.updated_at,
    h.analyzed_at,
    h.error_message,
    -- Include analysis data if available
    CASE 
        WHEN h.analysis_type = 'word' THEN json_build_object(
            'word', wa.word,
            'vietnamese_translation', wa.vietnamese_translation,
            'context_meaning', wa.context_meaning,
            'cefr', wa.cefr
        )
        WHEN h.analysis_type = 'phrase' THEN json_build_object(
            'phrase', pa.phrase,
            'vietnamese_translation', pa.vietnamese_translation,
            'contextual_meaning', pa.contextual_meaning,
            'complexity_level', pa.complexity_level
        )
        WHEN h.analysis_type = 'sentence' THEN json_build_object(
            'sentence', sa.sentence,
            'natural_translation', sa.natural_translation,
            'main_idea', sa.main_idea,
            'complexity_level', sa.complexity_level
        )
        WHEN h.analysis_type = 'paragraph' THEN json_build_object(
            'paragraph', pa2.paragraph,
            'main_topic', pa2.main_topic,
            'sentiment_label', pa2.sentiment_label,
            'vocabulary_level', pa2.vocabulary_level
        )
        ELSE NULL
    END as analysis_data,
    -- Include metadata
    hm.document_context,
    hm.paragraph_index,
    hm.sentence_index,
    hm.selection_duration_ms,
    hm.click_count,
    hm.metadata as highlight_metadata
FROM public.highlights h
LEFT JOIN public.word_analyses wa ON h.analysis_id = wa.id AND h.analysis_type = 'word'
LEFT JOIN public.phrase_analyses pa ON h.analysis_id = pa.id AND h.analysis_type = 'phrase'
LEFT JOIN public.sentence_analyses sa ON h.analysis_id = sa.id AND h.analysis_type = 'sentence'
LEFT JOIN public.paragraph_analyses pa2 ON h.analysis_id = pa2.id AND h.analysis_type = 'paragraph'
LEFT JOIN public.highlight_metadata hm ON h.id = hm.highlight_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlight_metadata TO authenticated;
GRANT SELECT ON public.highlights_with_analysis TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;