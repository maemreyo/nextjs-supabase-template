import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiServiceServer } from '@/lib/ai/ai-service-server'
import { GenerateTextParams } from '@/lib/ai/types'
import { apiLogger } from '@/services/logger'

export async function POST(request: NextRequest) {
  apiLogger.start('Handling POST /api/ai/generate-text', {
    timestamp: new Date().toISOString()
  })
  
  try {
    // Get user from session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: GenerateTextParams = await request.json()
    
    // Validate required fields
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (body.maxTokens && (typeof body.maxTokens !== 'number' || body.maxTokens < 1)) {
      return NextResponse.json(
        { success: false, error: 'maxTokens must be a positive number' },
        { status: 400 }
      )
    }

    if (body.temperature && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) {
      return NextResponse.json(
        { success: false, error: 'temperature must be between 0 and 2' },
        { status: 400 }
      )
    }

    // Generate text using AI service
    const response = await aiServiceServer.generateText(user.id, body)

    apiLogger.success('Text generated successfully', {
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    apiLogger.error('Error in AI generate text API', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        metadata: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  apiLogger.warn('Method not allowed for GET /api/ai/generate-text')
  
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}