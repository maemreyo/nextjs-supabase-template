import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Server-side authentication helper
export async function authenticateRequest(request: Request): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
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
      const result = await supabase.auth.getUser(token);
      user = result.data.user;
      error = result.error;
      
      if (error) {
        console.log(`Auth attempt ${retryCount + 1} failed:`, error.message);
        if (retryCount < maxRetries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        }
      }
    } catch (err) {
      console.log(`Auth attempt ${retryCount + 1} error:`, err);
      error = err;
      if (retryCount < maxRetries - 1) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      }
    }
    retryCount++;
  }
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

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
      console.error('Authentication error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Authorization header required')) {
          return createErrorResponse(error.message, 401);
        }
        if (error.message.includes('Invalid or expired token')) {
          return createErrorResponse(error.message, 401);
        }
      }
      
      return createErrorResponse('Internal server error', 500);
    }
  };
}