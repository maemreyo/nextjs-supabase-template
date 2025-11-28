import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'
import { dbLogger } from '@/services/logger'

export const createClient = async () => {
  dbLogger.debug('Creating Supabase server client', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
  })
  
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            dbLogger.warn('Failed to set Supabase cookies', {
              error: error instanceof Error ? error.message : String(error),
              cookieCount: cookiesToSet.length
            })
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}