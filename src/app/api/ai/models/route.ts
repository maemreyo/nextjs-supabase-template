import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiServiceServer } from '@/lib/ai/ai-service-server'
import { apiLogger } from '@/services/logger'

export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/ai/models', {
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

    // Get available models
    const models = await aiServiceServer.getModels()

    apiLogger.success('Models retrieved successfully', {
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: models
    })

  } catch (error) {
    apiLogger.error('Error in AI get models API', {
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
  apiLogger.warn('Method not allowed for POST /api/ai/models')
  
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}