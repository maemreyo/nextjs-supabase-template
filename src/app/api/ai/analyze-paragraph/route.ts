import { NextRequest, NextResponse } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeParagraphRequest } from '@/lib/ai/types'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
      console.log('DEBUG: API Route - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    const userId = user.id

    // Parse request body
    const body = await request.json()
    const { paragraph } = body

    // Validate input
    if (!paragraph || !paragraph.trim()) {
      return NextResponse.json(
        { error: 'Paragraph is required' },
        { status: 400 }
      )
    }

    // Validate paragraph length
    if (paragraph.length < 50) {
      return NextResponse.json(
        { error: 'Paragraph too short (minimum 50 characters)' },
        { status: 400 }
      )
    }

    if (paragraph.length > 5000) {
      return NextResponse.json(
        { error: 'Paragraph too long (maximum 5000 characters)' },
        { status: 400 }
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
      return NextResponse.json(
        { error: result.error || 'Failed to analyze paragraph' },
        { status: 500 }
      )
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    })

  } catch (error) {
    console.error('Error in analyze-paragraph API:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    )
  }
}

// Handle GET method for checking if paragraph analysis is available
export async function GET(request: NextRequest) {
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
      console.log('DEBUG: API Route GET - Invalid token:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    const userId = user.id
    const aiService = createAIServiceServer()

    // Check user limits
    const usageCheck = await aiService.checkUsage(userId)
    
    return NextResponse.json({
      available: usageCheck.canUseAI,
      remainingRequests: usageCheck.remainingRequests,
      remainingTokens: usageCheck.remainingTokens,
      features: usageCheck.tier.features
    })

  } catch (error) {
    console.error('Error in analyze-paragraph GET API:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        available: false 
      },
      { status: 500 }
    )
  }
}