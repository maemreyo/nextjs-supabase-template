import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiServiceServer } from '@/lib/ai/ai-service-server'
import { GenerateEmbeddingParams } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
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
    const body: GenerateEmbeddingParams = await request.json()
    
    // Validate required fields
    if (!body.input || (typeof body.input !== 'string' && !Array.isArray(body.input))) {
      return NextResponse.json(
        { success: false, error: 'Input is required and must be a string or array of strings' },
        { status: 400 }
      )
    }

    // Validate input length
    const inputs = Array.isArray(body.input) ? body.input : [body.input]
    for (const input of inputs) {
      if (typeof input !== 'string' || input.length === 0) {
        return NextResponse.json(
          { success: false, error: 'All inputs must be non-empty strings' },
          { status: 400 }
        )
      }
    }

    // Generate embedding using AI service
    const response = await aiServiceServer.generateEmbedding(user.id, body)

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('AI generate embedding error:', error)
    
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
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}