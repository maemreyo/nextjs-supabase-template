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
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
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