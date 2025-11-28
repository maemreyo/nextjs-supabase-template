import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types'
import { dbLogger } from '@/services/logger'

export const createClient = () => {
  dbLogger.debug('Creating Supabase browser client', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
  })
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()