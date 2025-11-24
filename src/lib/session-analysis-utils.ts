import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'

type SessionAnalysis = Database['public']['Tables']['session_analyses']['Insert']
type AnalysisSession = Database['public']['Tables']['analysis_sessions']['Update']

export interface SessionAnalysisOptions {
  sessionId?: string
  analysisId: string
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph'
  userId: string
  analysisData?: any
  analysisTitle?: string
  analysisSummary?: string
  position?: number
}

export interface SessionCounterUpdate {
  sessionId: string
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph'
  increment: number
}

/**
 * Tạo session analysis record và cập nhật counters trong một transaction
 * Đây là function chính nên được sử dụng trong các API routes
 */
export async function addAnalysisToSession(options: SessionAnalysisOptions) {
  const supabase = await createClient()
  
  if (!options.sessionId) {
    console.warn('No sessionId provided, skipping session analysis creation')
    return { success: true, data: null }
  }

  try {
    // Bắt đầu transaction manually bằng cách thực hiện các operations tuần tự
    // với error handling để đảm bảo consistency
    
    // 1. Lấy thông tin session hiện tại
    const { data: currentSession, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', options.sessionId)
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      throw sessionError
    }

    // 2. Tạo session analysis record
    const sessionAnalysisData: SessionAnalysis = {
      session_id: options.sessionId,
      analysis_id: options.analysisId,
      analysis_type: options.analysisType,
      user_id: options.userId,
      analysis_data: options.analysisData || null,
      analysis_title: options.analysisTitle || null,
      analysis_summary: options.analysisSummary || null,
      position: options.position || null,
      created_at: new Date().toISOString()
    }

    const { data: sessionAnalysis, error: analysisError } = await supabase
      .from('session_analyses')
      .insert(sessionAnalysisData)
      .select()
      .single()

    if (analysisError) {
      throw analysisError
    }

    // 3. Cập nhật counters trong analysis_sessions
    const updateData: AnalysisSession = {
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Tính toán counters mới
    const currentCounters = currentSession || {
      word_analyses_count: 0,
      sentence_analyses_count: 0,
      paragraph_analyses_count: 0,
      total_analyses: 0
    }

    switch (options.analysisType) {
      case 'word':
        updateData.word_analyses_count = (currentCounters.word_analyses_count || 0) + 1
        break
      case 'sentence':
        updateData.sentence_analyses_count = (currentCounters.sentence_analyses_count || 0) + 1
        break
      case 'paragraph':
        updateData.paragraph_analyses_count = (currentCounters.paragraph_analyses_count || 0) + 1
        break
    }

    updateData.total_analyses = (currentCounters.total_analyses || 0) + 1

    const { error: updateError } = await supabase
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', options.sessionId)

    if (updateError) {
      // Rollback session analysis creation nếu update session failed
      await supabase
        .from('session_analyses')
        .delete()
        .eq('id', sessionAnalysis.id)
      
      throw updateError
    }

    return { success: true, data: sessionAnalysis }
  } catch (error) {
    console.error('Failed to add analysis to session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Cập nhật counters trong analysis_sessions khi có analysis mới
 */
export async function updateSessionCounters(update: SessionCounterUpdate) {
  const supabase = await createClient()
  
  try {
    // Lấy thông tin session hiện tại
    const { data: currentSession, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', update.sessionId)
      .single()

    if (sessionError) {
      throw sessionError
    }

    // Tính toán counters mới
    const updateData: AnalysisSession = {
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const currentCounters = currentSession || {
      word_analyses_count: 0,
      sentence_analyses_count: 0,
      paragraph_analyses_count: 0,
      total_analyses: 0
    }

    switch (update.analysisType) {
      case 'word':
        updateData.word_analyses_count = (currentCounters.word_analyses_count || 0) + update.increment
        break
      case 'sentence':
        updateData.sentence_analyses_count = (currentCounters.sentence_analyses_count || 0) + update.increment
        break
      case 'paragraph':
        updateData.paragraph_analyses_count = (currentCounters.paragraph_analyses_count || 0) + update.increment
        break
    }

    updateData.total_analyses = (currentCounters.total_analyses || 0) + update.increment

    const { data, error } = await supabase
      .from('analysis_sessions')
      .update(updateData)
      .eq('id', update.sessionId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to update session counters:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Lấy session ID từ request body hoặc query parameters
 */
export function extractSessionId(request: Request): string | null {
  const url = new URL(request.url)
  return url.searchParams.get('sessionId') || null
}

/**
 * Tạo analysis title dựa trên type và content
 */
export function generateAnalysisTitle(
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph',
  content: string,
  maxLength: number = 50
): string {
  const prefix = analysisType.charAt(0).toUpperCase() + analysisType.slice(1)
  
  if (content.length <= maxLength - prefix.length - 2) {
    return `${prefix}: ${content}`
  }
  
  return `${prefix}: ${content.substring(0, maxLength - prefix.length - 5)}...`
}

/**
 * Tạo analysis summary ngắn gọn
 */
export function generateAnalysisSummary(
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph',
  content: string,
  maxLength: number = 100
): string {
  const prefixes = {
    word: 'Phân tích từ',
    phrase: 'Phân tích cụm từ',
    sentence: 'Phân tích câu',
    paragraph: 'Phân tích đoạn văn'
  }
  
  const prefix = prefixes[analysisType]
  
  if (content.length <= maxLength - prefix.length - 2) {
    return `${prefix}: ${content}`
  }
  
  return `${prefix}: ${content.substring(0, maxLength - prefix.length - 5)}...`
}

/**
 * Validate session analysis options
 */
export function validateSessionAnalysisOptions(options: SessionAnalysisOptions): string[] {
  const errors: string[] = []
  
  if (!options.analysisId) {
    errors.push('analysisId is required')
  }
  
  if (!options.analysisType) {
    errors.push('analysisType is required')
  }
  
  if (!options.userId) {
    errors.push('userId is required')
  }
  
  if (options.analysisType && !['word', 'phrase', 'sentence', 'paragraph'].includes(options.analysisType)) {
    errors.push('analysisType must be one of: word, phrase, sentence, paragraph')
  }
  
  return errors
}