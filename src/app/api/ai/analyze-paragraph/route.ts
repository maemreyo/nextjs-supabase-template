import { NextRequest } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeParagraphRequest } from '@/lib/ai/types'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client'

export const POST = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    try {
      const userId = user.id

    // Parse request body
    const body = await request.json()
    const { paragraph } = body

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

    // Get AI service instance
    const aiService = createAIServiceServer()

    // Create analysis request
    const analysisRequest: AnalyzeParagraphRequest = {
      paragraph: paragraph.trim()
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
      console.error('Error in analyze-paragraph API:', error)
      
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
    try {
      const userId = user.id
      const aiService = createAIServiceServer()

      // Check user limits
      const usageCheck = await aiService.checkUsage(userId)
      
      return createSuccessResponse({
        available: usageCheck.canUseAI,
        remainingRequests: usageCheck.remainingRequests,
        remainingTokens: usageCheck.remainingTokens,
        features: usageCheck.tier.features
      })

    } catch (error) {
      console.error('Error in analyze-paragraph GET API:', error)
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
);