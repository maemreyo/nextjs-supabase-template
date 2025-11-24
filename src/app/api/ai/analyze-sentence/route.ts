import { NextRequest } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeSentenceRequest } from '@/lib/ai/types'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-client'

export const POST = withAuth(
  async (request: NextRequest, { user }: { user: any }) => {
    try {
      const userId = user.id

      // Parse request body
      const body = await request.json()
      const { sentence, paragraphContext } = body

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

      // Get AI service instance
      const aiService = createAIServiceServer()

      // Create analysis request
      const analysisRequest: AnalyzeSentenceRequest = {
        sentence: sentence.trim(),
        paragraphContext: paragraphContext?.trim() || ''
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
      console.error('Error in analyze-sentence API:', error)
      
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
      console.error('Error in analyze-sentence GET API:', error)
      
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
);