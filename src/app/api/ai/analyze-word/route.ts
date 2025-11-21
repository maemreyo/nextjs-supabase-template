import { NextRequest, NextResponse } from 'next/server'
import { createAIServiceServer } from '@/lib/ai/ai-service-server'
import { AnalyzeWordRequest } from '@/lib/ai/types'
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
    const { word, sentenceContext, paragraphContext, maxItems = 5 } = body

    // Validate input
    if (!word || !word.trim()) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    if (!sentenceContext || !sentenceContext.trim()) {
      return NextResponse.json(
        { error: 'Sentence context is required' },
        { status: 400 }
      )
    }

    // Validate word length
    if (word.length > 100) {
      return NextResponse.json(
        { error: 'Word too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Validate context length
    if (sentenceContext.length > 1000) {
      return NextResponse.json(
        { error: 'Sentence context too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    if (paragraphContext && paragraphContext.length > 2000) {
      return NextResponse.json(
        { error: 'Paragraph context too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Validate maxItems
    if (maxItems && (maxItems < 1 || maxItems > 10)) {
      return NextResponse.json(
        { error: 'Max items must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Get AI service instance
    const aiService = createAIServiceServer()

    // Create analysis request
    const analysisRequest: AnalyzeWordRequest = {
      word: word.trim(),
      sentenceContext: sentenceContext.trim(),
      paragraphContext: paragraphContext?.trim() || '',
      maxItems: Math.min(maxItems, 10)
    }

    // Perform analysis
    const result = await aiService.analyzeWord(userId, analysisRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze word' },
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
    console.error('Error in analyze-word API:', error)
    
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
    console.error('Error in analyze-word GET API:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        available: false 
      },
      { status: 500 }
    )
  }
}