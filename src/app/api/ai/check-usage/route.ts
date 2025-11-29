import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiServiceServer } from '@/lib/ai/ai-service-server'
import { apiLogger } from '@/services/logger'

export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/ai/check-usage', {
    timestamp: new Date().toISOString()
  })
  
  try {
    // Get user from session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      apiLogger.warn('Unauthorized access attempt', {
        error: 'User not found in session'
      })
      
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    // Only allow users to check their own usage unless they're admin
    if (userId !== user.id) {
      // TODO: Add admin check here
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    apiLogger.info('Checking user AI usage', { userId })
    
    // Check usage using AI service
    const usageData = await aiServiceServer.checkUsage(userId)
    
    apiLogger.success('Usage data retrieved successfully', {
      userId,
      canUseAI: usageData.canUseAI,
      remainingRequests: usageData.remainingRequests
    })
    
    return NextResponse.json({
      success: true,
      data: usageData
    })

  } catch (error) {
    apiLogger.error('Error in AI check usage API', {
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

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}