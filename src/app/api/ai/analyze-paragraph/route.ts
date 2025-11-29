import { NextRequest } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeParagraphRequest } from '@/lib/ai/types'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client'
import { apiLogger } from '@/services/logger'

export const POST = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    apiLogger.start('Handling POST /api/ai/analyze-paragraph', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    try {
      const userId = user.id

    // Parse request body
    const body = await request.json()
    const { paragraph, sessionId } = body

    // Validate input
    if (!paragraph || !paragraph.trim()) {
      return createErrorResponse(
        'Paragraph is required',
        400
      )
    }

    // Validate paragraph length
    if (paragraph.length < 50) {
      return createErrorResponse(
        'Paragraph too short (minimum 50 characters)',
        400
      )
    }

    if (paragraph.length > 5000) {
      return createErrorResponse(
        'Paragraph too long (maximum 5000 characters)',
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
    const analysisRequest: AnalyzeParagraphRequest = {
      paragraph: paragraph.trim(),
      sessionId: sessionId
    }

    // Perform analysis
    const result = await aiService.analyzeParagraph(userId, analysisRequest)

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Failed to analyze paragraph',
        500
      )
    }

      // Return successful response
      return createSuccessResponse({
        data: result.data,
        metadata: result.metadata
      })

    } catch (error) {
      apiLogger.error('Error in analyze-paragraph API', {
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

// Handle GET method for checking if paragraph analysis is available
export const GET = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    apiLogger.start('Handling GET /api/ai/analyze-paragraph', {
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
      apiLogger.error('Error in analyze-paragraph GET API', {
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