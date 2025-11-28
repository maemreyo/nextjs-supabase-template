'use client'

import React from 'react'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SupabaseProvider } from './supabase-provider'
import { AuthSyncProvider } from './auth-sync-provider'
import { ThemeProvider } from './theme-provider'
import { ZustandProvider } from './zustand-provider'
import { AnalysisDialogProvider } from './analysis-dialog-provider'
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
      {/* <ZustandProvider>
        <SupabaseProvider>
          <AuthSyncProvider>
            <QueryClientProvider client={queryClient}>
              <AnalysisDialogProvider>
                {children}
              </AnalysisDialogProvider>
            </QueryClientProvider>
          </AuthSyncProvider>
        </SupabaseProvider>
      </ZustandProvider> */}
      <SupabaseProvider>
        <AuthSyncProvider>
          <QueryClientProvider client={queryClient}>
            <AnalysisDialogProvider>
              {children}
              {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            </AnalysisDialogProvider>
          </QueryClientProvider>
        </AuthSyncProvider>
      </SupabaseProvider>
    </ThemeProvider>
  )
}