import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { apiClientLogger } from '@/services/logger';

// Server-side authentication helper
export async function authenticateRequest(request: Request): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    apiClientLogger.warn('Missing authorization header in request');
    throw new Error('Authorization header required');
  }

  const supabase = await createClient();
  const token = authHeader.replace('Bearer ', '');
  
  // Add retry mechanism for DNS resolution issues
  let retryCount = 0;
  const maxRetries = 3;
  let user = null;
  let error = null;
  
  while (retryCount < maxRetries && !user) {
    try {
      apiClientLogger.start('Token authentication attempt', { attempt: retryCount + 1, maxRetries });
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      error = result.error;
      
      if (error) {
        if (retryCount < maxRetries - 1) {
          apiClientLogger.warn('Authentication failed, retrying', { attempt: retryCount + 1, error: error.message });
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        }
      }
    } catch (err) {
      error = err;
      if (retryCount < maxRetries - 1) {
        apiClientLogger.warn('Authentication exception, retrying', { attempt: retryCount + 1, error: err instanceof Error ? err.message : 'Unknown error' });
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      }
    }
    retryCount++;
  }
  
  if (error || !user) {
    apiClientLogger.error('Authentication failed after retries', { error: error instanceof Error ? error.message : 'Unknown error', retryCount });
    apiClientLogger.error('Authentication retry exhausted', {
      retryCount,
      lastError: error instanceof Error ? error.message : 'Unknown error',
      userId: user?.id
    });
    throw new Error('Invalid or expired token');
  }

  apiClientLogger.success('Authentication successful', { userId: user.id });
  return { user, supabase };
}

// Server-side API response helper
export function createSuccessResponse<T>(data: T, meta?: any) {
  return Response.json({
    success: true,
    data,
    ...(meta && { meta })
  });
}

export function createErrorResponse(error: string, status: number = 500) {
  return Response.json({
    success: false,
    error
  }, { status });
}

// Wrapper for API handlers with authentication
export function withAuth<T extends any[]>(
  handler: (request: any, context: { user: User; supabase: Awaited<ReturnType<typeof createClient>> } & Record<string, any>, ...args: T) => Promise<Response>
) {
  return async (request: any, context: Record<string, any>, ...args: T): Promise<Response> => {
    try {
      const { user, supabase } = await authenticateRequest(request);
      
      // Handle Next.js 15+ async params
      let resolvedContext = { ...context };
      if (context.params && typeof context.params.then === 'function') {
        resolvedContext.params = await context.params;
      }
      
      return await handler(request, { user, supabase, ...resolvedContext }, ...args);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Authorization header required')) {
          apiClientLogger.warn('Missing authorization header', { error: error.message });
          return createErrorResponse(error.message, 401);
        }
        if (error.message.includes('Invalid or expired token')) {
          apiClientLogger.warn('Invalid token', { error: error.message });
          return createErrorResponse(error.message, 401);
        }
      }
      
      apiClientLogger.error('API handler error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return createErrorResponse('Internal server error', 500);
    }
  };
}