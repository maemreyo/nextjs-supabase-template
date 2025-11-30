import { NextRequest, NextResponse } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeWordRequest } from '@/lib/ai/types'
import { createClient } from '@/lib/supabase/server'
import { apiLogger } from '@/services/logger'

// Security imports
import { validateInput, validateWord, securityCheck } from '@/lib/security/input-validator'
import { validateAndSanitizeContent } from '@/lib/security/content-sanitizer'
import { validateSessionForAPI } from '@/lib/security/session-validator'

// Performance imports
import { analysisCache, cacheKeys } from '@/lib/performance/cache-manager'
import { performanceMonitor } from '@/lib/performance/server-utils'
import { rateLimitMiddleware } from '@/lib/security/rate-limiter'

// Apply rate limiting middleware
const rateLimitedHandler = rateLimitMiddleware('analysis', (req) => {
  // Get client IP for rate limiting
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 
               req.headers.get('x-real-ip') || 
               'unknown'
  return `analyze-word:${ip}`
})

export async function POST(request: NextRequest) {
  const timer = performanceMonitor.startTimer('analyze-word-api')
  const startTime = Date.now()
  
  apiLogger.start('Handling POST /api/ai/analyze-word', {
    timestamp: new Date().toISOString()
  })
  
  try {
    // Check rate limit first
    const rateLimitResponse = await rateLimitedHandler(request, async () => {
      return new Response('OK', { status: 200 })
    })
    
    if (rateLimitResponse.status === 429) {
      // Get client IP for rate limiting
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] :
                   request.headers.get('x-real-ip') ||
                   'unknown'
      
      apiLogger.warn('Rate limit exceeded', {
        ip,
        endpoint: 'analyze-word',
        retryAfter: rateLimitResponse.headers.get('Retry-After')
      })
      
      return rateLimitResponse
    }

    // Get user ID from authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify JWT token with Supabase
    const supabase = await createClient()
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {

      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    const userId = user.id
    
    apiLogger.info('User authenticated successfully', { userId })

    // Parse request body
    const body = await request.json()
    const { word, sentenceContext, paragraphContext, maxItems = 5, sessionId } = body

    // Enhanced validation with security utilities
    const wordValidation = validateWord(word)
    if (!wordValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid word', details: wordValidation.errors },
        { status: 400 }
      )
    }

    const contextValidation = validateInput(sentenceContext, 'analysisText', {
      maxLength: 1000,
      allowEmpty: false
    })
    if (!contextValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid sentence context', details: contextValidation.errors },
        { status: 400 }
      )
    }

    if (paragraphContext) {
      const paragraphValidation = validateInput(paragraphContext, 'analysisText', {
        maxLength: 2000,
        allowEmpty: true
      })
      if (!paragraphValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid paragraph context', details: paragraphValidation.errors },
          { status: 400 }
        )
      }
    }

    // Validate maxItems
    const maxItemsValidation = validateInput(maxItems.toString(), 'numeric', {
      min: 1,
      max: 10
    })
    if (!maxItemsValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid max items', details: maxItemsValidation.errors },
        { status: 400 }
      )
    }

    // Validate sessionId if provided
    if (sessionId) {
      const sessionIdValidation = validateInput(sessionId, 'sessionId', {
        allowEmpty: true
      })
      if (!sessionIdValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid session ID', details: sessionIdValidation.errors },
          { status: 400 }
        )
      }
    }

    // Check cache first
    const cacheKey = cacheKeys.api.wordAnalysis(
      wordValidation.sanitized || word,
      contextValidation.sanitized || sentenceContext
    )
    
    const cachedResult = analysisCache.get(cacheKey)
    if (cachedResult) {
      timer.end()
      return NextResponse.json({
        success: true,
        data: cachedResult,
        metadata: { cached: true, timestamp: Date.now() }
      })
    }

    // Get AI service instance
    const aiService = createAIServiceServer()

    // Create analysis request with sanitized inputs
    const analysisRequest: AnalyzeWordRequest = {
      word: wordValidation.sanitized || word,
      sentenceContext: contextValidation.sanitized || sentenceContext,
      paragraphContext: paragraphContext ?
        validateAndSanitizeContent(paragraphContext, { type: 'text' }).sanitized || paragraphContext : '',
      maxItems: maxItemsValidation.parsedValue || 5,
      sessionId: sessionId
    }

    // Perform analysis with performance monitoring
    apiLogger.info('Starting AI word analysis', {
      userId,
      word: wordValidation.sanitized || word,
      hasSessionId: !!sessionId
    })
    
    const result = await performanceMonitor.measure(
      () => aiService.analyzeWord(userId, analysisRequest),
      'ai-analyze-word'
    )

    apiLogger.info('AI word analysis completed', {
      userId,
      word: wordValidation.sanitized || word,
      success: result.success,
      hasError: !!result.error,
      hasData: !!result.data,
      processingTime: timer.end()
    })

    if (!result.success) {
      apiLogger.error('Word analysis failed', {
        userId,
        word: wordValidation.sanitized || word,
        error: result.error,
        processingTime: timer.end()
      })
      
      return NextResponse.json(
        { error: result.error || 'Failed to analyze word' },
        { status: 500 }
      )
    }

    // Cache result
    if (result.success && result.data) {
      analysisCache.set(cacheKey, result.data, 30 * 60 * 1000) // 30 minutes
      
      apiLogger.debug('Word analysis result cached', {
        userId,
        word: wordValidation.sanitized || word,
        cacheKey
      })
    }

    // Return successful response
    timer.end()
    
    apiLogger.success('Word analysis API completed successfully', {
      userId,
      word: wordValidation.sanitized || word,
      processingTime: timer.end(),
      hasAnalysisId: !!result.metadata?.analysisId
    })
    
    apiLogger.info('Request completed', {
      userId,
      word: wordValidation.sanitized || word,
      processingTime: Date.now() - startTime,
      responseSize: JSON.stringify(result).length
    })
    
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        ...result.metadata,
        cached: false,
        timestamp: Date.now(),
        processingTime: timer.end()
      }
    })

  } catch (error) {
    timer.end()
    apiLogger.error('Error in analyze-word API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}

// Handle GET method for checking if word analysis is available
export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/ai/analyze-word', {
    timestamp: new Date().toISOString()
  })
  
  try {
    // Get user ID from authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify JWT token with Supabase
    const supabase = await createClient()
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {

      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    const userId = user.id
    const aiService = createAIServiceServer()
    
    apiLogger.info('Checking user AI usage limits', { userId })
    
    // Check user limits
    const usageCheck = await aiService.checkUsage(userId)
    
    apiLogger.success('Usage limits retrieved successfully', {
      userId,
      canUseAI: usageCheck.canUseAI,
      remainingRequests: usageCheck.remainingRequests
    })
    
    return NextResponse.json({
      available: usageCheck.canUseAI,
      remainingRequests: usageCheck.remainingRequests,
      remainingTokens: usageCheck.remainingTokens,
      features: usageCheck.tier.features
    })

  } catch (error) {
    apiLogger.error('Error in analyze-word GET API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        available: false
      },
      { status: 500 }
    )
  }
}