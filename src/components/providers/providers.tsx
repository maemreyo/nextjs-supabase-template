'use client'

import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SupabaseProvider } from './supabase-provider'
import { AuthSyncProvider } from './auth-sync-provider'
import { ThemeProvider } from './theme-provider'
import { getQueryClient } from '@/lib/query-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        <AuthSyncProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AuthSyncProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}