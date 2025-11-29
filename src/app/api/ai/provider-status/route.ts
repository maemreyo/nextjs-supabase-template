import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiServiceServer } from '@/lib/ai/ai-service-server'
import { apiLogger } from '@/services/logger'

export async function GET(request: NextRequest) {
  apiLogger.start('Handling GET /api/ai/provider-status', {
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

    apiLogger.info('Checking AI provider status')
    
    // Get provider status
    const providerStatus = await aiServiceServer.getProviderStatus()
    
    apiLogger.success('Provider status retrieved successfully', {
      status: providerStatus
    })
    
    return NextResponse.json({
      success: true,
      data: providerStatus
    })

  } catch (error) {
    apiLogger.error('Error in AI provider status API', {
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
  apiLogger.warn('Method not allowed for POST /api/ai/provider-status')
  
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}