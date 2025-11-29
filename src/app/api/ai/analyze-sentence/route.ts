import { NextRequest } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeSentenceRequest } from '@/lib/ai/types'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client'
import { apiLogger } from '@/services/logger'

export const POST = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    apiLogger.start('Handling POST /api/ai/analyze-sentence', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    try {
      const userId = user.id

      // Parse request body
      const body = await request.json()
      const { sentence, paragraphContext, sessionId } = body

      // Validate input
      if (!sentence || !sentence.trim()) {
        return createErrorResponse(
          'Sentence is required',
          400
        )
      }

      // Validate sentence length
      if (sentence.length > 1000) {
        return createErrorResponse(
          'Sentence too long (max 1000 characters)',
          400
        )
      }

      // Validate context length
      if (paragraphContext && paragraphContext.length > 2000) {
        return createErrorResponse(
          'Paragraph context too long (max 2000 characters)',
          400
        )
      }

      // Validate sessionId if provided
      if (sessionId) {
        // Basic UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(sessionId)) {
          return createErrorResponse(
            'Invalid session ID format',
            400
          )
        }
      }

      // Get AI service instance
      const aiService = createAIServiceServer()

      // Create analysis request
      const analysisRequest: AnalyzeSentenceRequest = {
        sentence: sentence.trim(),
        paragraphContext: paragraphContext?.trim() || '',
        sessionId: sessionId
      }

      // Perform analysis
      const result = await aiService.analyzeSentence(userId, analysisRequest)

      if (!result.success) {
        return createErrorResponse(
          result.error || 'Failed to analyze sentence',
          500
        )
      }

      // Return successful response
      return createSuccessResponse({
        data: result.data,
        metadata: result.metadata
      })

    } catch (error) {
      apiLogger.error('Error in analyze-sentence API', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
);

// Handle GET method for checking if sentence analysis is available
export const GET = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    apiLogger.start('Handling GET /api/ai/analyze-sentence', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    try {
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
      
      return createSuccessResponse({
        available: usageCheck.canUseAI,
        remainingRequests: usageCheck.remainingRequests,
        remainingTokens: usageCheck.remainingTokens,
        features: usageCheck.tier.features
      })

    } catch (error) {
      apiLogger.error('Error in analyze-sentence GET API', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
);